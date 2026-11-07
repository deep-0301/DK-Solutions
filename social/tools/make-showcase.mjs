#!/usr/bin/env node
// "Website concept on a laptop" reels: records an animated concept site
// (social/concepts/*.html, driven by window.update(t)), puts it on the screen
// of a 3D laptop on a desk (laptop-scene.html, three.js), adds a slow camera
// push-in, hook text, voiceover (Kokoro) and a music bed.
//
//   THREE_DIR=/path/to/node_modules/three KOKORO_DIR=... PYTHON=... \
//   node social/tools/make-showcase.mjs social/specs/20-cafe-concept.json
// Spec: { id, site: "cafe.html", dur, hook, tag, say: [{at, text}], voice, speed }
// PREVIEW=out.png renders 4 stills only.

import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const { chromium } = createRequire(import.meta.url)('playwright');

const FPS = 30;
const here = path.dirname(new URL(import.meta.url).pathname);
const repo = path.resolve(here, '..', '..');
const sh = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });

function serve(threeDir, framesDir) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    let f = u.startsWith('/three/') ? path.join(threeDir, u.slice(7)) : u.startsWith('/frames/') ? path.join(framesDir, u.slice(8)) : path.join(repo, u);
    if (!f.startsWith(threeDir) && !f.startsWith(framesDir) && !f.startsWith(repo)) { res.writeHead(403); return res.end(); }
    fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(b); });
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv)));
}

async function main() {
  const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const threeDir = process.env.THREE_DIR || path.dirname(path.dirname(createRequire(import.meta.url).resolve('three')));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'showcase-'));
  const sdir = path.join(tmp, 'site'), fdir = path.join(tmp, 'frames'); fs.mkdirSync(sdir); fs.mkdirSync(fdir);
  const srv = await serve(threeDir, sdir); const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const preview = process.env.PREVIEW;
  const times = preview ? [0.5, spec.dur * 0.35, spec.dur * 0.65, spec.dur - 0.5] : [...Array(Math.round(spec.dur * FPS)).keys()].map((i) => i / FPS);

  // 1. Website frames.
  const site = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await site.goto(`${base}/social/concepts/${spec.site}`); await site.waitForTimeout(400);
  for (const [i, t] of times.entries()) {
    await site.evaluate((t) => window.update(t), t);
    await site.screenshot({ path: path.join(sdir, `${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
  }
  // 2. Laptop scene frames.
  const sc = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  sc.on('pageerror', (e) => console.error('scene error', e));
  await sc.goto(`${base}/social/tools/laptop-scene.html`); await sc.waitForFunction(() => window.ready, null, { timeout: 60000 });
  await sc.evaluate((o) => window.setup(o), { dur: spec.dur, hook: spec.hook, tag: spec.tag, hookOut: spec.hookOut || 3.2 });
  const outs = [];
  for (const [i, t] of times.entries()) {
    const n = String(i).padStart(5, '0');
    await sc.evaluate(([t, u]) => window.renderFrame(t, u), [t, `/frames/${n}.jpg`]);
    const f = path.join(fdir, `${n}.jpg`); await sc.screenshot({ path: f, type: 'jpeg', quality: 92 }); outs.push(f);
    if (i % 60 === 0) console.log(`frame ${i}/${times.length}`);
  }
  await browser.close(); srv.close();
  if (preview) { execFileSync('convert', [...outs, '-resize', '360x', '+append', preview]); console.log('preview', preview); return; }

  // 3. Voice lines at their times + soft music bed.
  const lines = spec.say || [];
  let ains = [], amix = [];
  if (lines.length) {
    fs.writeFileSync(path.join(tmp, 'lines.json'), JSON.stringify(lines.map((l) => l.text)));
    execFileSync(process.env.PYTHON || 'python3', [path.join(here, 'tts.py'), process.env.KOKORO_DIR, path.join(tmp, 'lines.json'), tmp, spec.voice || 'af_heart', String(spec.speed || 1.05)]);
    lines.forEach((l, k) => { ains.push('-i', path.join(tmp, `${k}.wav`)); const ms = Math.round(l.at * 1000); amix.push(`[${k + 1}:a]aresample=44100,aformat=channel_layouts=stereo,adelay=${ms}|${ms}[v${k}]`); });
  }
  const D = spec.dur;
  const chord = (f) => `sin(2*PI*${f}*t)+0.45*sin(2*PI*${f * 2}*t)+0.2*sin(2*PI*${f * 3}*t)`;
  // Warm lo-fi style progression with a soft pulse (generated here, royalty free).
  const prog = `if(lt(mod(t,8),2),${chord(174.61)}+${chord(220)}+${chord(261.63)},if(lt(mod(t,8),4),${chord(196)}+${chord(246.94)}+${chord(293.66)},if(lt(mod(t,8),6),${chord(164.81)}+${chord(196)}+${chord(246.94)},${chord(146.83)}+${chord(185)}+${chord(220)})))`;
  const music = `aevalsrc='0.02*(${prog})*(0.7+0.3*pow(sin(PI*t*1.6),2))':s=44100:d=${D},lowpass=f=1500,aecho=0.8:0.6:180:0.25,aformat=channel_layouts=stereo,afade=t=in:d=1,afade=t=out:st=${D - 1.5}:d=1.5[m]`;
  const mixIn = lines.map((_, k) => `[v${k}]`).join('') + '[m]';
  const mp4 = path.join(repo, 'social', 'reels', `${spec.id}.mp4`);
  sh(['-framerate', String(FPS), '-i', path.join(fdir, '%05d.jpg'), ...ains, '-filter_complex',
    `${amix.length ? amix.join(';') + ';' : ''}${music};${mixIn}amix=inputs=${lines.length + 1}:duration=longest:normalize=0,atrim=0:${D},loudnorm=I=-15:TP=-1.5:LRA=11[a];[0:v]noise=alls=6:allf=t,format=yuv420p[v]`,
    '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-movflags', '+faststart', '-t', String(D), mp4]);
  fs.copyFileSync(outs[Math.min(outs.length - 1, Math.round(FPS * 1.5))], path.join(repo, 'social', 'reels', `${spec.id}.jpg`));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`built ${path.relative(process.cwd(), mp4)} (${D}s)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
