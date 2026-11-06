#!/usr/bin/env node
// Build a 1080x1920 Instagram reel (MP4, H.264, AAC) from a JSON spec.
//   node social/tools/make-reel.mjs social/specs/01-bakery-before-after.json
// Needs: Node 18+, playwright (with Chromium) and ffmpeg on PATH.
// Output: social/reels/<id>.mp4 and social/reels/<id>.jpg (cover).

import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { beforeSite, afterSite } from './sites.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');

const W = 1080, H = 1920, FPS = 30, T = 0.45; // T = transition length (s)
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Allow *word* for gradient highlight in titles.
const rich = (s) => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');

const LOGO = `<svg viewBox="0 0 64 64" width="64" height="64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset=".55" stop-color="#2563eb"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#g)"/><path d="M15 18h11c8.3 0 14 5.6 14 14s-5.7 14-14 14H15zm7 6v16h4c4.4 0 7-3.1 7-8s-2.6-8-7-8z" fill="#fff"/><path d="M48 14l2.2 5.8L56 22l-5.8 2.2L48 30l-2.2-5.8L40 22l5.8-2.2z" fill="#fff"/></svg>`;

const BASE_CSS = `
*{box-sizing:border-box;margin:0}
body{width:${W}px;height:${H}px;overflow:hidden;font-family:Inter,system-ui,sans-serif;color:#eef1fb;
 background:radial-gradient(900px 700px at 85% 8%,rgba(124,58,237,.45),transparent 60%),
 radial-gradient(800px 700px at 0% 95%,rgba(6,182,212,.35),transparent 60%),#070a14;position:relative}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(160,175,230,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(160,175,230,.07) 1px,transparent 1px);background-size:72px 72px;mask-image:radial-gradient(closest-side,#000,transparent)}
.brand{position:absolute;top:150px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:16px;font-weight:700;font-size:34px;letter-spacing:-.01em}
.brand svg{width:52px;height:52px}
em{font-style:normal;background:linear-gradient(100deg,#a78bfa 0%,#22d3ee 55%,#67e8f9 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.kicker{font:600 30px/1 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#22d3ee}
.center{position:absolute;left:90px;right:90px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:40px;padding-bottom:160px}
h1{font-size:104px;line-height:1.02;letter-spacing:-.035em;font-weight:800}
h2{font-size:76px;line-height:1.06;letter-spacing:-.03em;font-weight:800}
.sub{font-size:44px;line-height:1.35;color:#c4cbe0}
.foot{position:absolute;bottom:330px;left:0;right:0;text-align:center;font:500 30px "JetBrains Mono",monospace;color:#9aa4bf}
`;

function page(body, extraCss = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}${extraCss}</style></head><body><div class="grid"></div>${body}</body></html>`;
}

function sceneHtml(s, shots) {
  const brand = `<div class="brand">${LOGO}<span>DK Solutions</span></div>`;
  switch (s.type) {
    case 'text':
      return page(`${brand}<div class="center">${s.kicker ? `<div class="kicker">${esc(s.kicker)}</div>` : ''}<h1>${rich(s.title)}</h1>${s.sub ? `<div class="sub">${rich(s.sub)}</div>` : ''}</div>`);
    case 'list': {
      const items = s.items.map((it, i) => `<li style="opacity:${i < s.show ? 1 : 0}"><span class="n">${i + 1}</span><span>${rich(it)}</span></li>`).join('');
      return page(`${brand}<div class="center" style="gap:56px"><h2>${rich(s.title)}</h2><ol>${items}</ol></div>`,
        `ol{list-style:none;padding:0;display:flex;flex-direction:column;gap:34px}
         li{display:flex;gap:30px;align-items:flex-start;font-size:50px;line-height:1.25;font-weight:600}
         .n{flex:none;width:78px;height:78px;border-radius:22px;display:grid;place-items:center;font-size:40px;font-weight:800;background:linear-gradient(135deg,#7c3aed,#2563eb 55%,#06b6d4)}`);
    }
    case 'phone': {
      const good = s.tone === 'good';
      const notes = (s.notes || []).map((n, i) => {
        const side = i % 2 ? 'right:40px' : 'left:40px';
        const top = 700 + i * 205;
        return `<div class="note ${good ? 'g' : 'b'}" style="${side};top:${top}px">${good ? '&#10003;' : '&#10007;'} ${esc(n)}</div>`;
      }).join('');
      return page(`
        <div class="label ${good ? 'g' : 'b'}">${esc(s.label || (good ? 'After' : 'Before'))}</div>
        ${s.title ? `<div class="ptitle">${rich(s.title)}</div>` : ''}
        <div class="phone"><img src="${shots[s.site]}"></div>${notes}`,
        `.label{position:absolute;top:170px;left:50%;transform:translateX(-50%);padding:14px 40px;border-radius:999px;font-weight:800;font-size:46px;letter-spacing:.08em;text-transform:uppercase}
         .label.b{background:#ef4444;color:#fff}.label.g{background:#34d399;color:#062018}
         .ptitle{position:absolute;top:275px;left:60px;right:60px;text-align:center;font-size:44px;font-weight:700;letter-spacing:-.02em}
         .phone{position:absolute;top:370px;left:50%;transform:translateX(-50%);width:540px;height:1169px;border-radius:70px;background:#05070d;padding:16px;box-shadow:0 0 0 3px #2a3150,0 40px 120px rgba(0,0,0,.6)}
         .phone img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:56px;display:block}
         .note{position:absolute;max-width:430px;padding:20px 26px;border-radius:24px;font-size:34px;font-weight:700;line-height:1.2;box-shadow:0 20px 50px rgba(0,0,0,.45)}
         .note.b{background:#fff;color:#b91c1c;border-left:10px solid #ef4444}
         .note.g{background:#fff;color:#047857;border-left:10px solid #34d399}`);
    }
    case 'cta':
      return page(`<div class="center" style="align-items:center;text-align:center;gap:44px">
        <div style="transform:scale(2.6);margin-bottom:70px">${LOGO}</div>
        <h2>${rich(s.title || 'Want a website that *brings in customers?*')}</h2>
        <div class="sub">${rich(s.sub || 'Free quote. Built for small businesses.')}</div>
        <div class="pill">dksolutions.dev</div>
        <div class="kicker" style="color:#9aa4bf">Link in bio</div></div>`,
        `.pill{font-size:52px;font-weight:800;padding:26px 56px;border-radius:999px;background:linear-gradient(100deg,#7c3aed,#2563eb 55%,#06b6d4)}`);
    default:
      throw new Error('Unknown scene type ' + s.type);
  }
}

function sh(args) { execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' }); }

async function main() {
  const specPath = process.argv[2];
  if (!specPath) { console.error('usage: make-reel.mjs <spec.json>'); process.exit(1); }
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-'));
  const outDir = path.join(root, 'reels');
  fs.mkdirSync(outDir, { recursive: true });

  // Expand list scenes into one frame per revealed item.
  const scenes = [];
  for (const s of spec.scenes) {
    if (s.type === 'list') s.items.forEach((_, i) => scenes.push({ ...s, show: i + 1, duration: i === s.items.length - 1 ? (s.last || 2.6) : (s.each || 1.9), transition: i === 0 ? s.transition : 'fade' }));
    else scenes.push(s);
  }

  const browser = await chromium.launch();
  // Phone screenshots of the fictional business, before and after.
  const shots = {};
  if (spec.business) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    for (const [k, fn] of [['before', beforeSite], ['after', afterSite]]) {
      await p.setContent(fn(spec.business), { waitUntil: 'load' });
      const f = path.join(tmp, `site-${k}.png`);
      await p.screenshot({ path: f });
      shots[k] = 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
    }
    await ctx.close();
  }
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const frames = [];
  for (const [i, s] of scenes.entries()) {
    await p.setContent(sceneHtml(s, shots), { waitUntil: 'load' });
    const f = path.join(tmp, `scene-${i}.png`);
    await p.screenshot({ path: f });
    frames.push(f);
  }
  await browser.close();

  // One clip per scene with a slow push-in, then join with crossfades/wipes.
  const clips = [];
  scenes.forEach((s, i) => {
    const d = (s.duration || 2.5) + (i < scenes.length - 1 ? T : 0);
    const n = Math.round(d * FPS);
    const zoom = s.type === 'list' ? 0 : 0.035;
    const out = path.join(tmp, `clip-${i}.mp4`);
    sh(['-loop', '1', '-i', frames[i], '-t', String(d), '-vf',
      `scale=${W * 2}:${H * 2},zoompan=z='1+${zoom}*on/${n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${n}:s=${W}x${H}:fps=${FPS},format=yuv420p`,
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-r', String(FPS), out]);
    clips.push({ out, d });
  });

  let filter = '', last = '[0:v]', acc = clips[0].d;
  for (let i = 1; i < clips.length; i++) {
    const tr = scenes[i].transition || 'fade';
    const lab = `[v${i}]`;
    filter += `${last}[${i}:v]xfade=transition=${tr}:duration=${T}:offset=${(acc - T).toFixed(3)}${lab};`;
    acc += clips[i].d - T;
    last = lab;
  }
  const total = acc;
  // Soft generated pad so the reel isn't silent (royalty free, made here).
  const chord = (f) => `sin(2*PI*${f}*t)+0.5*sin(2*PI*${f * 2}*t)`;
  const prog = `if(lt(mod(t,8),4),${chord(220)}+${chord(261.63)}+${chord(329.63)},${chord(196)}+${chord(246.94)}+${chord(293.66)})`;
  const audio = `aevalsrc='0.035*(${prog})*(0.75+0.25*sin(2*PI*2*t))':s=44100:d=${total.toFixed(2)},lowpass=f=1400,afade=t=in:d=0.8,afade=t=out:st=${(total - 1.2).toFixed(2)}:d=1.2[a]`;

  const id = spec.id;
  const mp4 = path.join(outDir, `${id}.mp4`);
  const inputs = clips.flatMap((c) => ['-i', c.out]);
  sh([...inputs, '-filter_complex', `${filter || '[0:v]null[vlast];'}${audio}`.replace(/;$/, ''),
    '-map', clips.length > 1 ? last : '[vlast]', '-map', '[a]',
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '20', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-movflags', '+faststart', '-t', total.toFixed(2), mp4]);
  // Cover image: the first scene (hook) frame.
  sh(['-i', frames[0], '-q:v', '3', path.join(outDir, `${id}.jpg`)]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`built ${path.relative(process.cwd(), mp4)} (${total.toFixed(1)}s)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
