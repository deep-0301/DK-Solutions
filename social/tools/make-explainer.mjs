#!/usr/bin/env node
// Narrated, animated explainer reels: Kokoro TTS voiceover, karaoke captions,
// word-by-word titles, typing chat, moving background. Every frame is rendered
// by seeking CSS animations (Web Animations API), so output is frame-exact.
// Motion rules follow bangtutorial/bang-motion (MIT): one statement per shot,
// sentence first then object then detail, asymmetric in/out, background and
// camera always moving.
//
//   KOKORO_DIR=/path/to/model PYTHON=/path/to/python node social/tools/make-explainer.mjs social/specs/x.json
// Needs Node 18+, playwright, ffmpeg, python with kokoro-onnx + soundfile.
// Output: social/reels/<id>.mp4 and <id>.jpg

import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const { chromium } = createRequire(import.meta.url)('playwright');

const W = 1080, H = 1920, FPS = 30, OUT = 0.32; // OUT = exit animation length (s)
const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plain = (s) => String(s ?? '').replace(/\*/g, '');
const rich = (s) => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');

// Split "*marked* words" into word spans; each word gets an index for stagger.
function words(s, cls = 'w') {
  let on = false, i = 0;
  return String(s ?? '').split(/\s+/).filter(Boolean).map((tok) => {
    const start = tok.startsWith('*'); const end = tok.replace(/[.,!?:;)]*$/, '').endsWith('*');
    if (start) on = true;
    const html = `<span class="${cls}${on ? ' hl' : ''}" style="--i:${i++}">${esc(tok.replace(/\*/g, ''))}</span>`;
    if (end) on = false;
    return html;
  }).join(' ');
}

const LOGO = `<svg viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset=".55" stop-color="#2563eb"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#g)"/><path d="M15 18h11c8.3 0 14 5.6 14 14s-5.7 14-14 14H15zm7 6v16h4c4.4 0 7-3.1 7-8s-2.6-8-7-8z" fill="#fff"/><path d="M48 14l2.2 5.8L56 22l-5.8 2.2L48 30l-2.2-5.8L40 22l5.8-2.2z" fill="#fff"/></svg>`;

const EASE_IN = 'cubic-bezier(.16,1,.3,1)'; // ~power4.out
const CSS = `
*{box-sizing:border-box;margin:0}
body{width:${W}px;height:${H}px;overflow:hidden;font-family:Inter,system-ui,sans-serif;color:#eef1fb;position:relative;background:#070a14}
/* Background layers: always moving, driven by global time (.bgl) */
.bgl{position:absolute;inset:-200px;pointer-events:none}
.blob{position:absolute;border-radius:50%;filter:blur(120px);opacity:.55}
.b1{width:900px;height:900px;left:420px;top:-120px;background:#6d28d9;animation:drift1 14s ease-in-out infinite alternate}
.b2{width:800px;height:800px;left:-200px;top:1300px;background:#0891b2;animation:drift2 17s ease-in-out infinite alternate}
.b3{width:520px;height:520px;left:600px;top:1100px;background:#1d4ed8;opacity:.35;animation:drift1 11s ease-in-out infinite alternate-reverse}
@keyframes drift1{to{transform:translate(-260px,260px) scale(1.15)}}
@keyframes drift2{to{transform:translate(300px,-240px) scale(1.2)}}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(160,175,230,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(160,175,230,.06) 1px,transparent 1px);background-size:72px 72px;mask-image:radial-gradient(closest-side,#000,transparent);animation:gridmove 20s linear infinite}
@keyframes gridmove{to{background-position:0 720px}}
em,.hl{font-style:normal;background:linear-gradient(100deg,#a78bfa 0%,#22d3ee 55%,#67e8f9 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.top{position:absolute;top:210px;left:70px;right:70px;display:flex;align-items:center;justify-content:space-between}
.chip{font:700 26px/1 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#22d3ee;padding:14px 22px;border:2px solid rgba(34,211,238,.35);border-radius:999px;background:rgba(34,211,238,.08)}
.brand{display:flex;align-items:center;gap:12px;font-weight:700;font-size:28px;color:#c4cbe0}.brand svg{width:44px;height:44px}
.bar{position:absolute;top:290px;left:70px;right:70px;height:8px;border-radius:9px;background:rgba(255,255,255,.08);overflow:hidden}
.bar i{display:block;height:100%;width:var(--to);border-radius:9px;background:linear-gradient(90deg,#7c3aed,#2563eb,#06b6d4);animation:bar var(--dur) linear both}
@keyframes bar{from{width:var(--from)}to{width:var(--to)}}
/* Camera: slow breathing push on the whole stage, plus exit */
.cam{position:absolute;top:360px;left:70px;right:70px;height:860px;animation:breathe var(--dur) linear both, out ${OUT}s cubic-bezier(.5,0,.75,0) var(--outAt) both}
@keyframes breathe{from{transform:scale(1)}to{transform:scale(1.045)}}
@keyframes out{to{opacity:0;transform:scale(1.06) translateY(-50px);filter:blur(10px)}}
.stage{height:100%;display:flex;flex-direction:column;justify-content:center;gap:34px}
/* Entrances */
.in{animation:rise .9s ${EASE_IN} calc(var(--d,0s)) both}
@keyframes rise{from{opacity:0;transform:translateY(70px);filter:blur(12px)}to{opacity:1;transform:none;filter:none}}
.pop{animation:pop .7s cubic-bezier(.34,1.56,.64,1) calc(var(--d,0s)) both}
@keyframes pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
.float{animation:pop .7s cubic-bezier(.34,1.56,.64,1) calc(var(--d,0s)) both, float 2.4s ease-in-out .7s infinite alternate}
@keyframes float{to{transform:translateY(-22px) rotate(-6deg)}}
.w{display:inline-block;animation:word .75s ${EASE_IN} calc(var(--d,0s) + var(--i) * 0.07s) both}
@keyframes word{from{opacity:0;transform:translateY(60px) rotate(4deg);filter:blur(10px)}to{opacity:1;transform:none;filter:none}}
/* Karaoke captions */
.cap{position:absolute;left:60px;right:150px;top:1250px;padding:28px 34px;border-radius:30px;background:rgba(7,10,20,.82);border:2px solid rgba(160,175,230,.18);font-size:46px;line-height:1.28;font-weight:800;letter-spacing:-.01em;animation:capin .35s ${EASE_IN} both, out ${OUT}s ease-in var(--outAt) both}
@keyframes capin{from{opacity:0;transform:translateY(30px) scale(.97)}to{opacity:1;transform:none}}
.cw{display:inline-block;opacity:.38;animation:say .18s ease-out var(--t) both}
.cw.hl{background:none;-webkit-background-clip:initial;background-clip:initial;color:#fde047}
@keyframes say{from{opacity:.38;transform:translateY(4px)}to{opacity:1;transform:none}}
.kicker{font:600 30px/1 "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:#9aa4bf}
h1{font-size:104px;line-height:1.04;letter-spacing:-.035em;font-weight:800}
h2{font-size:88px;line-height:1.06;letter-spacing:-.03em;font-weight:800}
.body{font-size:44px;line-height:1.35;color:#c4cbe0}
.emoji{font-size:160px;line-height:1;display:inline-block}
.num{display:inline-grid;place-items:center;width:120px;height:120px;border-radius:32px;font-size:60px;font-weight:800;background:linear-gradient(135deg,#7c3aed,#2563eb 55%,#06b6d4);box-shadow:0 20px 60px rgba(124,58,237,.45)}
.big{font-size:240px;line-height:.9;font-weight:900;letter-spacing:-.05em}
.tl{display:flex;flex-direction:column;gap:20px}
.tl .row{display:flex;gap:28px;align-items:center;padding:24px 28px;border-radius:26px;background:rgba(255,255,255,.04);border:2px solid rgba(160,175,230,.14)}
.tl .row.on{background:rgba(124,58,237,.22);border-color:rgba(167,139,250,.75);animation:active .6s ${EASE_IN} both;box-shadow:0 20px 60px rgba(124,58,237,.3)}
@keyframes active{from{transform:translateX(-40px) scale(.96);opacity:.3}to{transform:translateX(0) scale(1.03);opacity:1}}
.tl .row.off{opacity:.25}
.tl .d{flex:none;width:170px;font:800 34px "JetBrains Mono",monospace;color:#22d3ee}
.tl .t{font-size:40px;font-weight:700;line-height:1.2}
.cmp{display:grid;grid-template-columns:1fr 1fr;gap:26px}
.cmp .c{padding:36px 30px;border-radius:30px;background:rgba(255,255,255,.04);border:2px solid rgba(160,175,230,.14);display:flex;flex-direction:column;gap:18px}
.cmp .c.new{background:rgba(52,211,153,.10);border-color:rgba(52,211,153,.5);box-shadow:0 20px 70px rgba(52,211,153,.18)}
.cmp .h{font:700 28px "JetBrains Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:#9aa4bf}
.cmp .v{font-size:70px;font-weight:900;letter-spacing:-.03em;line-height:1}
.cmp .c.new .v{color:#34d399}
.cmp ul{list-style:none;padding:0;display:flex;flex-direction:column;gap:12px;font-size:32px;line-height:1.25;color:#c4cbe0}
.chat{align-self:center;width:900px;border-radius:44px;background:#0e1424;border:2px solid #263052;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.5)}
.chat .hd{display:flex;align-items:center;gap:18px;padding:26px 30px;background:#121a30;border-bottom:2px solid #263052;font-size:32px;font-weight:700}
.chat .hd svg{width:56px;height:56px}.chat .hd small{display:block;font-size:24px;font-weight:500;color:#34d399}
.chat .ms{position:relative;display:flex;flex-direction:column;gap:22px;padding:34px;height:640px;justify-content:flex-end}
.m{max-width:82%;padding:24px 30px;border-radius:30px;font-size:40px;line-height:1.28}
.m.u{align-self:flex-end;background:#2563eb;border-bottom-right-radius:8px;transform-origin:right bottom}
.m.b{align-self:flex-start;background:#1c2540;border-bottom-left-radius:8px;transform-origin:left bottom}
.m.new{animation:pop .55s cubic-bezier(.34,1.56,.64,1) var(--d,0s) both}
.typing{position:absolute;left:34px;bottom:34px;display:flex;gap:10px;padding:26px 30px;border-radius:30px;background:#1c2540;animation:typingout .01s linear var(--d) both}
.typing i{width:16px;height:16px;border-radius:50%;background:#9aa4bf;animation:dot .9s ease-in-out infinite}
.typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}
@keyframes dot{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-12px);opacity:1}}
@keyframes typingout{to{display:none;opacity:0;height:0;padding:0;margin:0}}
.end{align-items:center;text-align:center}
.end svg{width:180px;height:180px}
.handle{font-size:56px;font-weight:800;padding:24px 50px;border-radius:999px;background:linear-gradient(100deg,#7c3aed,#2563eb 55%,#06b6d4);box-shadow:0 20px 70px rgba(37,99,235,.45)}
`;

function frame(spec, st, from, to) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head>
  <body style="--dur:${st.dur}s;--outAt:${(st.dur - OUT).toFixed(3)}s;--from:${(from * 100).toFixed(2)}%;--to:${(to * 100).toFixed(2)}%">
  <div class="bgl"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="grid"></div></div>
  <div class="top"><div class="chip">${esc(spec.topic || 'Website tips')}</div><div class="brand">${LOGO}<span>DK Solutions</span></div></div>
  <div class="bar"><i></i></div>
  <div class="cam"><div class="stage ${st.cls || ''}">${st.html}</div></div>
  ${st.cap ? caption(st.cap, st.voice) : ''}</body></html>`;
}

// Words light up in step with the voice (timed by character share of the line).
function caption(cap, voice) {
  const toks = String(cap).split(/\s+/).filter(Boolean);
  const total = toks.reduce((a, t) => a + t.length + 1, 0);
  const span = Math.max(voice || 1.2, 0.8) * 0.94;
  let acc = 0, on = false;
  const html = toks.map((tok) => {
    const t = 0.12 + (acc / total) * span; acc += tok.length + 1;
    const start = tok.startsWith('*'); const end = tok.replace(/[.,!?:;)]*$/, '').endsWith('*');
    if (start) on = true;
    const h = `<span class="cw${on ? ' hl' : ''}" style="--t:${t.toFixed(2)}s">${esc(tok.replace(/\*/g, ''))}</span>`;
    if (end) on = false;
    return h;
  }).join(' ');
  return `<div class="cap">${html}</div>`;
}

// Each scene becomes one or more steps: {html, say, cap, min, cls}
function steps(s) {
  const one = (html, cls) => [{ html, cls, say: s.say, cap: s.cap ?? s.say, min: s.min }];
  const d = (x) => `style="--d:${x}s"`;
  switch (s.type) {
    case 'title':
      return one(`${s.emoji ? `<div><span class="emoji float">${s.emoji}</span></div>` : ''}${s.kicker ? `<div class="kicker in" ${d(0.05)}>${esc(s.kicker)}</div>` : ''}<h1 style="--d:.15s">${words(s.title)}</h1>`);
    case 'point':
      return one(`<div><span class="num pop">${esc(s.n)}</span></div><h2 style="--d:.15s">${words(s.title)}</h2>${s.body ? `<div class="body in" ${d(0.75)}>${rich(s.body)}</div>` : ''}${s.emoji ? `<div><span class="emoji float" ${d(0.5)} style="font-size:130px;--d:.5s">${s.emoji}</span></div>` : ''}`);
    case 'stat':
      return one(`${s.kicker ? `<div class="kicker in">${esc(s.kicker)}</div>` : ''}<div class="big pop" ${d(0.1)}><em>${esc(s.value)}</em></div><h2 style="font-size:66px;--d:.5s">${words(s.label)}</h2>`);
    case 'compare': {
      const col = (c, cls, t) => `<div class="c ${cls} in" ${d(t)}><div class="h">${esc(c.h)}</div><div class="v">${esc(c.v)}</div><ul>${(c.items || []).map((i, k) => `<li class="in" ${d(t + 0.25 + k * 0.12)}>${cls ? '✓' : '✗'} ${esc(i)}</li>`).join('')}</ul></div>`;
      return one(`${s.title ? `<h2 style="font-size:66px">${words(s.title)}</h2>` : ''}<div class="cmp">${col(s.left, '', 0.3)}${col(s.right, 'new', s.rightAt ?? 1.4)}</div>`);
    }
    case 'timeline':
      return s.items.map((_, k) => ({
        html: `${s.title ? `<h2 style="font-size:64px">${k === 0 ? words(s.title) : rich(s.title)}</h2>` : ''}<div class="tl">${s.items.map((it, j) => `<div class="row ${j === k ? 'on' : j > k ? 'off' : ''}"><div class="d">${esc(it.d)}</div><div class="t">${rich(it.t)}</div></div>`).join('')}</div>`,
        say: s.items[k].say, cap: s.items[k].cap ?? s.items[k].say, min: s.items[k].min, keep: k > 0,
      }));
    case 'chat':
      return s.messages.map((_, k) => {
        const bot = s.messages[k].from !== 'user';
        const delay = bot ? 0.75 : 0.1;
        const ms = s.messages.slice(0, k + 1).map((m, j) => `<div class="m ${m.from === 'user' ? 'u' : 'b'} ${j === k ? 'new' : ''}" ${j === k ? d(delay) : ''}>${esc(m.text)}</div>`).join('');
        return {
          html: `<div class="chat ${k === 0 ? 'in' : ''}"><div class="hd">${LOGO}<div>${esc(s.botName || 'Website assistant')}<small>● online 24/7</small></div></div><div class="ms">${ms}${bot ? `<div class="typing" ${d(delay)}><i></i><i></i><i></i></div>` : ''}</div></div>`,
          say: s.messages[k].say, cap: s.messages[k].cap ?? s.messages[k].say, min: s.messages[k].min ?? 1.8, keep: k > 0,
        };
      });
    case 'end':
      return one(`<div class="pop">${LOGO}</div><h2 style="--d:.25s">${words(s.title || 'Follow for more *website tips*')}</h2><div class="handle pop" ${d(0.9)}>@dksolutions.dev</div>${s.body ? `<div class="body in" ${d(1.2)}>${rich(s.body)}</div>` : ''}`, 'end');
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
  all.forEach((s, i) => { s.voice = durs[i]; s.dur = +Math.max(s.min || 1.4, durs[i] ? durs[i] + 0.5 : 0).toFixed(3); });
  const total = all.reduce((a, s) => a + s.dur, 0);

  // 2. Render every frame by seeking animations. Steps that continue the same
  // visual (timeline/chat after the first) skip the camera exit/entry flash.
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
  const fdir = path.join(tmp, 'frames'); fs.mkdirSync(fdir);
  let t0 = 0, n = 0;
  for (const [i, s] of all.entries()) {
    const nextKeeps = all[i + 1]?.keep;
    let html = frame(spec, s, t0 / total, (t0 + s.dur) / total);
    if (nextKeeps) html = html.replace('class="cam"', 'class="cam" style="animation:breathe var(--dur) linear both"');
    if (s.keep) html = html.replace('class="chat in"', 'class="chat"');
    await page.setContent(html, { waitUntil: 'load' });
    const frames = Math.round(s.dur * FPS);
    for (let f = 0; f < frames; f++) {
      const local = (f / FPS) * 1000, global = (t0 + f / FPS) * 1000;
      await page.evaluate(([l, g]) => {
        for (const a of document.getAnimations()) {
          a.pause();
          a.currentTime = a.effect?.target?.closest?.('.bgl') ? g : l;
        }
      }, [local, global]);
      await page.screenshot({ path: path.join(fdir, `${String(n++).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 90 });
    }
    s.start = t0;
    t0 += frames / FPS;
  }
  await browser.close();

  // 3. Voice track: each line placed at its step start.
  const voiced = all.map((s, i) => ({ s, i })).filter(({ s }) => s.voice);
  const ains = voiced.flatMap(({ i }) => ['-i', path.join(tmp, `${i}.wav`)]);
  const amix = voiced.map(({ s }, k) => `[${k + 1}:a]aresample=44100,aformat=channel_layouts=stereo,adelay=${Math.round(s.start * 1000 + 120)}|${Math.round(s.start * 1000 + 120)}[v${k}]`).join(';');
  const chord = (f) => `sin(2*PI*${f}*t)+0.5*sin(2*PI*${f * 2}*t)`;
  const prog = `if(lt(mod(t,8),4),${chord(220)}+${chord(261.63)}+${chord(329.63)},${chord(196)}+${chord(246.94)}+${chord(293.66)})`;
  const music = `aevalsrc='0.018*(${prog})*(0.8+0.2*sin(2*PI*2*t))':s=44100:d=${t0.toFixed(2)},lowpass=f=1200,aformat=channel_layouts=stereo,afade=t=in:d=0.8,afade=t=out:st=${(t0 - 1).toFixed(2)}:d=1[m]`;
  const mixIn = voiced.map((_, k) => `[v${k}]`).join('') + '[m]';
  const mp4 = path.join(root, 'reels', `${spec.id}.mp4`);
  sh(['-framerate', String(FPS), '-i', path.join(fdir, '%05d.jpg'), ...ains, '-filter_complex',
    `${amix};${music};${mixIn}amix=inputs=${voiced.length + 1}:duration=longest:normalize=0,atrim=0:${t0.toFixed(3)},loudnorm=I=-15:TP=-1.5:LRA=11[a]`,
    '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-movflags', '+faststart', '-t', t0.toFixed(3), mp4]);
  // Cover: a settled frame from the hook (1.6s in).
  fs.copyFileSync(path.join(fdir, `${String(Math.min(48, n - 1)).padStart(5, '0')}.jpg`), path.join(root, 'reels', `${spec.id}.jpg`));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`built ${path.relative(process.cwd(), mp4)} (${t0.toFixed(1)}s, ${all.length} steps, ${n} frames)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
