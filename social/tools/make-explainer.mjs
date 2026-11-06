#!/usr/bin/env node
// Narrated explainer reels: voiceover (Kokoro TTS) + burned-in captions.
//   KOKORO_DIR=/path/to/model node social/tools/make-explainer.mjs social/specs/x.json
// Needs Node 18+, playwright, ffmpeg, and python with kokoro-onnx + soundfile
// (set PYTHON to that interpreter; default python3).
// Output: social/reels/<id>.mp4 and <id>.jpg

import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const { chromium } = createRequire(import.meta.url)('playwright');

const W = 1080, H = 1920, FPS = 30;
const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rich = (s) => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
const plain = (s) => String(s ?? '').replace(/\*/g, '');

const LOGO = `<svg viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset=".55" stop-color="#2563eb"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#g)"/><path d="M15 18h11c8.3 0 14 5.6 14 14s-5.7 14-14 14H15zm7 6v16h4c4.4 0 7-3.1 7-8s-2.6-8-7-8z" fill="#fff"/><path d="M48 14l2.2 5.8L56 22l-5.8 2.2L48 30l-2.2-5.8L40 22l5.8-2.2z" fill="#fff"/></svg>`;

const CSS = `
*{box-sizing:border-box;margin:0}
body{width:${W}px;height:${H}px;overflow:hidden;font-family:Inter,system-ui,sans-serif;color:#eef1fb;position:relative;
 background:radial-gradient(900px 700px at 90% 5%,rgba(124,58,237,.42),transparent 60%),radial-gradient(800px 700px at 0% 100%,rgba(6,182,212,.30),transparent 60%),#070a14}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(160,175,230,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(160,175,230,.06) 1px,transparent 1px);background-size:72px 72px;mask-image:radial-gradient(closest-side,#000,transparent)}
em{font-style:normal;background:linear-gradient(100deg,#a78bfa 0%,#22d3ee 55%,#67e8f9 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.top{position:absolute;top:210px;left:70px;right:70px;display:flex;align-items:center;justify-content:space-between}
.chip{font:700 26px/1 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#22d3ee;padding:14px 22px;border:2px solid rgba(34,211,238,.35);border-radius:999px;background:rgba(34,211,238,.08)}
.brand{display:flex;align-items:center;gap:12px;font-weight:700;font-size:28px;color:#c4cbe0}.brand svg{width:44px;height:44px}
.bar{position:absolute;top:290px;left:70px;right:70px;height:8px;border-radius:9px;background:rgba(255,255,255,.08);overflow:hidden}
.bar i{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,#7c3aed,#2563eb,#06b6d4)}
.stage{position:absolute;top:360px;left:70px;right:70px;height:860px;display:flex;flex-direction:column;justify-content:center;gap:34px}
.cap{position:absolute;left:60px;right:150px;top:1250px;min-height:150px;padding:28px 34px;border-radius:30px;background:rgba(7,10,20,.78);border:2px solid rgba(160,175,230,.18);font-size:44px;line-height:1.28;font-weight:700;letter-spacing:-.01em}
.cap em{background:none;-webkit-background-clip:initial;background-clip:initial;color:#fde047}
.kicker{font:600 30px/1 "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:#9aa4bf}
h1{font-size:100px;line-height:1.02;letter-spacing:-.035em;font-weight:800}
h2{font-size:84px;line-height:1.06;letter-spacing:-.03em;font-weight:800}
.body{font-size:46px;line-height:1.35;color:#c4cbe0}
.emoji{font-size:150px;line-height:1}
.num{display:inline-grid;place-items:center;width:110px;height:110px;border-radius:30px;font-size:56px;font-weight:800;background:linear-gradient(135deg,#7c3aed,#2563eb 55%,#06b6d4)}
.big{font-size:230px;line-height:.9;font-weight:900;letter-spacing:-.05em}
.tl{display:flex;flex-direction:column;gap:22px}
.tl .row{display:flex;gap:28px;align-items:center;padding:24px 28px;border-radius:26px;background:rgba(255,255,255,.04);border:2px solid rgba(160,175,230,.14);transition:none}
.tl .row.on{background:rgba(124,58,237,.18);border-color:rgba(167,139,250,.6)}
.tl .row.off{opacity:.28}
.tl .d{flex:none;width:170px;font:800 34px "JetBrains Mono",monospace;color:#22d3ee}
.tl .t{font-size:40px;font-weight:700;line-height:1.2}
.cmp{display:grid;grid-template-columns:1fr 1fr;gap:26px}
.cmp .c{padding:36px 30px;border-radius:30px;background:rgba(255,255,255,.04);border:2px solid rgba(160,175,230,.14);display:flex;flex-direction:column;gap:18px}
.cmp .c.new{background:rgba(52,211,153,.10);border-color:rgba(52,211,153,.5)}
.cmp .h{font:700 28px "JetBrains Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:#9aa4bf}
.cmp .v{font-size:66px;font-weight:900;letter-spacing:-.03em;line-height:1}
.cmp .c.new .v{color:#34d399}
.cmp ul{list-style:none;padding:0;display:flex;flex-direction:column;gap:12px;font-size:32px;line-height:1.25;color:#c4cbe0}
.chat{align-self:center;width:900px;border-radius:44px;background:#0e1424;border:2px solid #263052;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.5)}
.chat .hd{display:flex;align-items:center;gap:18px;padding:26px 30px;background:#121a30;border-bottom:2px solid #263052;font-size:32px;font-weight:700}
.chat .hd svg{width:56px;height:56px}.chat .hd small{display:block;font-size:24px;font-weight:500;color:#34d399}
.chat .ms{display:flex;flex-direction:column;gap:22px;padding:34px;min-height:640px;justify-content:flex-end}
.m{max-width:82%;padding:24px 30px;border-radius:30px;font-size:40px;line-height:1.28}
.m.u{align-self:flex-end;background:#2563eb;border-bottom-right-radius:8px}
.m.b{align-self:flex-start;background:#1c2540;border-bottom-left-radius:8px}
.m.hide{visibility:hidden}
.end{align-items:center;text-align:center}
.end svg{width:170px;height:170px}
.handle{font-size:54px;font-weight:800;padding:24px 50px;border-radius:999px;background:linear-gradient(100deg,#7c3aed,#2563eb 55%,#06b6d4)}
`;

function frame(spec, progress, stage, cap) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="grid"></div>
  <div class="top"><div class="chip">${esc(spec.topic || 'Website tips')}</div><div class="brand">${LOGO}<span>DK Solutions</span></div></div>
  <div class="bar"><i style="width:${(progress * 100).toFixed(1)}%"></i></div>
  <div class="stage ${stage.cls || ''}">${stage.html}</div>
  ${cap ? `<div class="cap">${rich(cap)}</div>` : ''}</body></html>`;
}

// Turn each scene into one or more steps: {stage, say, cap, min}
function steps(s) {
  const one = (html, cls) => [{ stage: { html, cls }, say: s.say, cap: s.cap ?? s.say, min: s.min }];
  switch (s.type) {
    case 'title':
      return one(`${s.emoji ? `<div class="emoji">${s.emoji}</div>` : ''}${s.kicker ? `<div class="kicker">${esc(s.kicker)}</div>` : ''}<h1>${rich(s.title)}</h1>`);
    case 'point':
      return one(`<div><span class="num">${esc(s.n)}</span></div><h2>${rich(s.title)}</h2>${s.body ? `<div class="body">${rich(s.body)}</div>` : ''}${s.emoji ? `<div class="emoji" style="font-size:120px">${s.emoji}</div>` : ''}`);
    case 'stat':
      return one(`${s.kicker ? `<div class="kicker">${esc(s.kicker)}</div>` : ''}<div class="big"><em>${esc(s.value)}</em></div><h2 style="font-size:64px">${rich(s.label)}</h2>`);
    case 'compare': {
      const col = (c, cls) => `<div class="c ${cls}"><div class="h">${esc(c.h)}</div><div class="v">${esc(c.v)}</div><ul>${(c.items || []).map((i) => `<li>${cls ? '✓' : '✗'} ${esc(i)}</li>`).join('')}</ul></div>`;
      return one(`${s.title ? `<h2 style="font-size:64px">${rich(s.title)}</h2>` : ''}<div class="cmp">${col(s.left, '')}${col(s.right, 'new')}</div>`);
    }
    case 'timeline':
      return s.items.map((_, k) => ({
        stage: { html: `${s.title ? `<h2 style="font-size:62px">${rich(s.title)}</h2>` : ''}<div class="tl">${s.items.map((it, j) => `<div class="row ${j === k ? 'on' : j > k ? 'off' : ''}"><div class="d">${esc(it.d)}</div><div class="t">${rich(it.t)}</div></div>`).join('')}</div>` },
        say: s.items[k].say, cap: s.items[k].cap ?? s.items[k].say, min: s.items[k].min,
      }));
    case 'chat':
      return s.messages.map((_, k) => ({
        stage: { html: `<div class="chat"><div class="hd">${LOGO}<div>${esc(s.botName || 'Website assistant')}<small>● online 24/7</small></div></div><div class="ms">${s.messages.map((m, j) => `<div class="m ${m.from === 'user' ? 'u' : 'b'} ${j > k ? 'hide' : ''}">${esc(m.text)}</div>`).join('')}</div></div>` },
        say: s.messages[k].say, cap: s.messages[k].cap ?? s.messages[k].say, min: s.messages[k].min ?? 1.6,
      }));
    case 'end':
      return one(`${LOGO}<h2>${rich(s.title || 'Follow for more *website tips*')}</h2><div class="handle">@dksolutions.dev</div>${s.body ? `<div class="body">${rich(s.body)}</div>` : ''}`, 'end');
    default:
      throw new Error('Unknown scene type ' + s.type);
  }
}

const sh = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });

async function main() {
  const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const kdir = process.env.KOKORO_DIR;
  if (!kdir) throw new Error('Set KOKORO_DIR to the folder with kokoro.onnx and voices.bin');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'explainer-'));
  const all = spec.scenes.flatMap(steps);

  // 1. Voiceover per step.
  fs.writeFileSync(path.join(tmp, 'lines.json'), JSON.stringify(all.map((s) => plain(s.say || ''))));
  const durs = JSON.parse(execFileSync(process.env.PYTHON || 'python3',
    [path.join(here, 'tts.py'), kdir, path.join(tmp, 'lines.json'), tmp, spec.voice || 'af_heart', String(spec.speed || 1.08)]).toString());
  all.forEach((s, i) => { s.voice = durs[i]; s.dur = Math.max(s.min || 1.4, durs[i] ? durs[i] + 0.4 : 0); });
  const total = all.reduce((a, s) => a + s.dur, 0);

  // 2. Frames.
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
  let t = 0;
  for (const [i, s] of all.entries()) {
    t += s.dur;
    await page.setContent(frame(spec, t / total, s.stage, s.cap), { waitUntil: 'load' });
    await page.screenshot({ path: path.join(tmp, `f${i}.png`) });
  }
  await browser.close();

  // 3. One clip per step (slow push-in + its voice line), then concat.
  const list = [];
  all.forEach((s, i) => {
    const n = Math.round(s.dur * FPS);
    const out = path.join(tmp, `c${i}.mp4`);
    const voice = s.voice ? ['-i', path.join(tmp, `${i}.wav`)] : ['-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono'];
    sh(['-loop', '1', '-framerate', String(FPS), '-i', path.join(tmp, `f${i}.png`), ...voice, '-filter_complex',
      `[0:v]scale=${W * 2}:${H * 2},zoompan=z='1+0.018*on/${n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${n}:s=${W}x${H}:fps=${FPS},format=yuv420p[v];` +
      `[1:a]aresample=44100,aformat=channel_layouts=stereo,adelay=120|120,apad,atrim=0:${s.dur.toFixed(3)}[a]`,
      '-map', '[v]', '-map', '[a]', '-t', s.dur.toFixed(3), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-r', String(FPS),
      '-c:a', 'aac', '-b:a', '160k', out]);
    list.push(`file '${out}'`);
  });
  fs.writeFileSync(path.join(tmp, 'list.txt'), list.join('\n'));
  const joined = path.join(tmp, 'joined.mp4');
  sh(['-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', joined]);

  // 4. Quiet generated music bed under the voice.
  const chord = (f) => `sin(2*PI*${f}*t)+0.5*sin(2*PI*${f * 2}*t)`;
  const prog = `if(lt(mod(t,8),4),${chord(220)}+${chord(261.63)}+${chord(329.63)},${chord(196)}+${chord(246.94)}+${chord(293.66)})`;
  const mp4 = path.join(root, 'reels', `${spec.id}.mp4`);
  sh(['-i', joined, '-filter_complex',
    `aevalsrc='0.018*(${prog})*(0.8+0.2*sin(2*PI*2*t))':s=44100:d=${total.toFixed(2)},lowpass=f=1200,aformat=channel_layouts=stereo,afade=t=in:d=0.8,afade=t=out:st=${(total - 1).toFixed(2)}:d=1[m];` +
    `[0:a][m]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=11[a]`,
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-movflags', '+faststart', mp4]);
  sh(['-i', path.join(tmp, 'f0.png'), '-q:v', '3', path.join(root, 'reels', `${spec.id}.jpg`)]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`built ${path.relative(process.cwd(), mp4)} (${total.toFixed(1)}s, ${all.length} steps)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
