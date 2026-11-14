// Picture-first scenes for explainer reels: the image explains, text is a
// short label at most. Each visual returns HTML; animations are CSS and are
// seeked frame by frame by make-explainer.mjs. --d sets a delay (s).

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const d = (x) => `--d:${x}s`;

export const VIS_CSS = `
.vis{position:relative;height:100%;display:flex;align-items:center;justify-content:center}
.lbl{position:absolute;top:0;left:0;right:0;text-align:center;font-size:64px;font-weight:800;letter-spacing:-.03em}
/* phone */
.ph{position:relative;width:500px;height:1000px;border-radius:70px;background:#05070d;padding:16px;box-shadow:0 0 0 3px #2a3150,0 50px 120px rgba(0,0,0,.6)}
.ph .scr{position:relative;width:100%;height:100%;border-radius:56px;overflow:hidden;background:#f6f5f2}
.ph .notch{position:absolute;top:28px;left:50%;transform:translateX(-50%);width:140px;height:34px;border-radius:20px;background:#05070d;z-index:5}
.drop{animation:drop .8s cubic-bezier(.34,1.4,.64,1) var(--d,0s) both}
@keyframes drop{from{opacity:0;transform:translateY(-120px) scale(.9)}to{opacity:1;transform:none}}
.grow{animation:grow .7s cubic-bezier(.16,1,.3,1) var(--d,0s) both;transform-origin:left center}
@keyframes grow{from{transform:scaleX(0)}to{transform:none}}
.fade{animation:fadein .6s ease-out var(--d,0s) both}
@keyframes fadein{from{opacity:0}to{opacity:1}}
.pulse{animation:pulse 1.4s ease-in-out var(--d,0s) infinite}
@keyframes pulse{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(52,211,153,.6)}50%{transform:scale(1.06);box-shadow:0 0 0 26px rgba(52,211,153,0)}}
.spin{animation:spin 2.2s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.shake{animation:shake .5s ease-in-out var(--d,0s) 3 both}
@keyframes shake{25%{transform:rotate(-8deg)}75%{transform:rotate(8deg)}}
/* mini website parts */
.s-nav{position:absolute;top:80px;left:26px;right:26px;height:56px;display:flex;align-items:center;justify-content:space-between}
.s-nav b{width:150px;height:26px;border-radius:8px;background:#17171c}
.s-nav i{width:40px;height:26px;border-top:6px solid #17171c;border-bottom:6px solid #17171c}
.s-hero{position:absolute;top:160px;left:22px;right:22px;height:330px;border-radius:30px;background:linear-gradient(135deg,#7c3aed,#2563eb 55%,#06b6d4);padding:34px 28px;overflow:hidden}
.s-hero .t1,.s-hero .t2{height:30px;border-radius:10px;background:rgba(255,255,255,.95);margin-bottom:16px}
.s-hero .t1{width:85%}.s-hero .t2{width:60%}
.s-hero .t3{height:16px;width:75%;border-radius:8px;background:rgba(255,255,255,.6);margin-top:26px}
.s-hero .em{position:absolute;right:16px;bottom:6px;font-size:110px}
.s-btn{position:absolute;top:420px;left:50px;width:200px;height:56px;border-radius:999px;background:#fff;box-shadow:0 8px 20px rgba(0,0,0,.2)}
.s-cards{position:absolute;top:520px;left:22px;right:22px;display:grid;grid-template-columns:1fr 1fr;gap:16px}
.s-cards div{height:120px;border-radius:22px;background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.08);display:grid;place-items:center;font-size:54px}
.s-chat{position:absolute;right:26px;bottom:120px;width:96px;height:96px;border-radius:50%;background:#2563eb;display:grid;place-items:center;font-size:48px;box-shadow:0 12px 30px rgba(37,99,235,.5)}
.s-book{position:absolute;left:22px;right:140px;bottom:120px;height:96px;border-radius:24px;background:#17171c;display:flex;align-items:center;justify-content:center;gap:14px;color:#fff;font-size:34px;font-weight:800}
.s-badge{position:absolute;top:-30px;right:-60px;padding:18px 26px;border-radius:24px;background:#fff;color:#111;font-size:30px;font-weight:800;box-shadow:0 20px 50px rgba(0,0,0,.4);display:flex;gap:12px;align-items:center;z-index:6}
.s-gauge{position:absolute;bottom:200px;left:-90px;width:210px;height:210px;border-radius:50%;background:conic-gradient(#34d399 0 300deg,#1c2540 300deg);display:grid;place-items:center;z-index:6;box-shadow:0 20px 50px rgba(0,0,0,.4)}
.s-gauge div{width:160px;height:160px;border-radius:50%;background:#0e1424;display:grid;place-items:center;font-size:44px;font-weight:900;color:#34d399}
.live{position:absolute;inset:0;display:grid;place-items:center;z-index:7}
.live div{padding:30px 56px;border-radius:999px;background:#34d399;color:#062018;font-size:64px;font-weight:900;box-shadow:0 30px 80px rgba(52,211,153,.5)}
.conf{position:absolute;width:22px;height:22px;border-radius:5px;animation:conf 1.6s cubic-bezier(.2,.7,.4,1) var(--d,0s) both}
@keyframes conf{from{transform:translate(0,0) rotate(0);opacity:1}to{transform:translate(var(--x),var(--y)) rotate(540deg);opacity:0}}
/* 7-day dots */
.days{position:absolute;top:0;left:0;right:0;display:flex;justify-content:center;gap:16px}
.days span{width:92px;height:92px;border-radius:24px;display:grid;place-items:center;font:800 34px "JetBrains Mono",monospace;background:rgba(255,255,255,.05);border:2px solid rgba(160,175,230,.16);color:#9aa4bf}
.days span.done{background:rgba(124,58,237,.25);border-color:rgba(167,139,250,.7);color:#fff}
.days span.now{background:linear-gradient(135deg,#7c3aed,#2563eb 55%,#06b6d4);color:#fff;border-color:transparent;animation:pop .6s cubic-bezier(.34,1.56,.64,1) both}
/* calendars then/now */
.cal{width:300px;border-radius:30px;background:#fff;color:#111;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.45)}
.cal .top{position:static;height:64px;background:#ef4444;display:block}
.cal .n{font-size:120px;font-weight:900;text-align:center;line-height:170px;letter-spacing:-.04em}
.stack{position:relative;width:300px;height:300px}
.stack .cal{position:absolute;top:0;left:0}
.side{display:flex;flex-direction:column;align-items:center;gap:30px}
.side .cap2{font-size:52px;font-weight:800}
.flip{animation:flip .5s ease-in var(--d) both}
@keyframes flip{to{transform:translate(-120px,-260px) rotate(-35deg);opacity:0}}
/* search + AI answer */
.br{width:900px;border-radius:40px;background:#fff;color:#1f2937;padding:40px;box-shadow:0 40px 100px rgba(0,0,0,.5)}
.sbar{display:flex;align-items:center;gap:20px;height:96px;border-radius:999px;border:3px solid #e5e7eb;padding:0 34px;font-size:40px;font-weight:600}
.typed{display:inline-block;overflow:hidden;white-space:nowrap;border-right:4px solid #2563eb;animation:type 1.4s steps(var(--n)) var(--d,0s) both}
@keyframes type{from{width:0}to{width:var(--w)}}
.ai{margin-top:34px;border-radius:30px;background:linear-gradient(135deg,#eef2ff,#ecfeff);padding:32px;display:flex;flex-direction:column;gap:18px}
.ai .h{display:flex;align-items:center;gap:14px;font-size:34px;font-weight:800;color:#4338ca}
.ai .ln{height:22px;border-radius:11px;background:#c7d2fe}
.src{align-self:flex-start;display:flex;align-items:center;gap:12px;padding:14px 24px;border-radius:999px;background:#fff;border:3px solid #34d399;font-size:32px;font-weight:800;color:#047857}
/* night booking */
.sky{position:absolute;inset:-40px;border-radius:40px;background:radial-gradient(600px 500px at 75% 15%,rgba(253,224,71,.18),transparent 60%)}
.moon{position:absolute;top:30px;right:60px;font-size:170px}
.star{position:absolute;width:8px;height:8px;border-radius:50%;background:#fff;animation:tw 1.6s ease-in-out var(--d) infinite alternate}
@keyframes tw{from{opacity:.2}to{opacity:1}}
.lock{position:absolute;top:120px;left:0;right:0;text-align:center;color:#fff}
.lock .tm{font-size:150px;font-weight:300;letter-spacing:-.04em}
.lock .dt{font-size:34px;opacity:.8}
.note{position:absolute;left:22px;right:22px;padding:26px;border-radius:30px;background:rgba(255,255,255,.92);color:#111;display:flex;gap:18px;align-items:center;font-size:30px;line-height:1.25;box-shadow:0 20px 40px rgba(0,0,0,.3);animation:slidein .7s cubic-bezier(.34,1.4,.64,1) var(--d) both}
.note .ic{flex:none;width:72px;height:72px;border-radius:18px;display:grid;place-items:center;font-size:42px;background:linear-gradient(135deg,#7c3aed,#06b6d4)}
.note b{display:block;font-size:32px}
@keyframes slidein{from{opacity:0;transform:translateY(-80px) scale(.95)}to{opacity:1;transform:none}}
/* icons flying into the bot */
.fly{position:absolute;font-size:110px;animation:fly 1s cubic-bezier(.5,0,.2,1) var(--d) both}
@keyframes fly{0%{opacity:0;transform:translate(0,0) scale(.6)}25%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(.3)}}
.bot{width:300px;height:300px;border-radius:90px;background:linear-gradient(135deg,#7c3aed,#2563eb 55%,#06b6d4);display:grid;place-items:center;font-size:170px;box-shadow:0 40px 120px rgba(37,99,235,.55);animation:pop .7s cubic-bezier(.34,1.56,.64,1) both, gulp .35s ease-in-out var(--g,1.1s) 4 alternate}
@keyframes gulp{to{transform:scale(1.08)}}
/* clock */
.clock{position:relative;width:520px;height:520px;border-radius:50%;background:#0e1424;border:10px solid #263052;box-shadow:0 40px 100px rgba(0,0,0,.5)}
.clock .hand{position:absolute;left:50%;bottom:50%;width:12px;margin-left:-6px;border-radius:6px;transform-origin:bottom center;background:#eef1fb}
.clock .hh{height:150px;animation:spin 6s linear infinite}.clock .mh{height:210px;background:#22d3ee;animation:spin .5s linear infinite}
.clock .ctr{position:absolute;left:50%;top:50%;width:40px;height:40px;margin:-20px;border-radius:50%;background:#22d3ee}
.bub{position:absolute;padding:20px 28px;border-radius:28px;background:#2563eb;font-size:56px;animation:pop .5s cubic-bezier(.34,1.56,.64,1) var(--d) both}
/* handoff */
.arrow{font-size:120px;color:#22d3ee;animation:nudge .8s ease-in-out infinite alternate}
@keyframes nudge{to{transform:translateX(30px)}}
.big-emoji{font-size:220px;line-height:1}
/* form vs chat */
.duo{display:flex;gap:40px;align-items:flex-end}
.card{width:440px;height:620px;border-radius:44px;padding:40px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;background:rgba(255,255,255,.05);border:3px solid rgba(160,175,230,.18)}
.card.win{background:rgba(52,211,153,.10);border-color:rgba(52,211,153,.6);box-shadow:0 30px 90px rgba(52,211,153,.2)}
.card .t{font-size:44px;font-weight:800}
.card .time{font-size:110px;font-weight:900;letter-spacing:-.04em}
.card.win .time{color:#34d399}.card.lose .time{color:#f87171}
.zz{position:absolute;font-size:60px;animation:zz 2s ease-out var(--d) infinite}
@keyframes zz{from{opacity:0;transform:translate(0,0)}30%{opacity:1}to{opacity:0;transform:translate(60px,-160px)}}
/* chart */
.chart{width:880px;height:560px}
.chart polyline{fill:none;stroke:url(#cg);stroke-width:18;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1400;animation:draw 1.6s cubic-bezier(.16,1,.3,1) var(--d,0s) both}
@keyframes draw{from{stroke-dashoffset:1400}to{stroke-dashoffset:0}}
/* pile */
.pile{display:flex;gap:30px}
.pile .it{width:230px;height:230px;border-radius:50px;display:grid;place-items:center;font-size:120px;background:rgba(255,255,255,.06);border:3px solid rgba(160,175,230,.2)}
`;

// A tiny website inside a phone; `upto` = how many parts are built (1-7), newest animates in.
function miniSite(upto, emoji = '✂️') {
  const part = (k, html) => (upto >= k ? html.replace('CLS', upto === k ? 'drop' : '') : '');
  return `<div class="ph"><div class="notch"></div><div class="scr">
    ${part(1, `<div class="s-nav CLS"><b></b><i></i></div>`)}
    ${upto === 1 ? `<div style="position:absolute;top:200px;left:40px;right:40px;display:flex;flex-direction:column;gap:22px">${['🏠 Home', '✂️ Services', '📅 Book', '📍 Find us'].map((t, i) => `<div class="drop" style="--d:${0.3 + i * 0.25}s;padding:26px 30px;border-radius:24px;background:#fff;border:3px dashed #a78bfa;color:#111;font-size:40px;font-weight:800">${t}</div>`).join('')}</div>` : ''}
    ${part(2, `<div class="s-hero CLS" style="${d(0.1)}"><div class="t1"></div><div class="t2"></div><div class="t3"></div><div class="em">${emoji}</div></div>`)}
    ${part(3, `<div class="s-cards CLS" style="${d(0.1)}"><div>✂️</div><div>🧔</div><div>💈</div><div>⭐</div></div>`)}
    ${part(4, `<div class="s-book CLS" style="${d(0.1)}">📅 Book</div><div class="s-chat CLS" style="${d(0.5)}">💬</div>`)}
  </div>
  ${part(5, `<div class="s-gauge CLS" style="${d(0.1)}"><div>99</div></div><div class="s-badge CLS" style="${d(0.6)}"><span style="font-size:40px">🔎</span> On Google</div>`)}
  ${upto >= 6 ? `<div class="live"><div class="drop">Live 🚀</div></div>${confetti()}` : ''}
  </div>`;
}

function confetti() {
  const cols = ['#a78bfa', '#22d3ee', '#34d399', '#fde047', '#f472b6'];
  return Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2, r = 420 + (i % 5) * 60;
    return `<i class="conf" style="left:50%;top:45%;background:${cols[i % 5]};--x:${Math.round(Math.cos(a) * r)}px;--y:${Math.round(Math.sin(a) * r)}px;--d:${0.3 + (i % 4) * 0.05}s"></i>`;
  }).join('');
}

function dayDots(active) {
  return `<div class="days">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<span class="${n < active[0] ? 'done' : active.includes(n) ? 'now' : ''}">${n}</span>`).join('')}</div>`;
}

export const visuals = {
  // { emoji, label }
  hero: (o) => `<div class="vis" style="flex-direction:column;gap:60px"><div class="big-emoji float">${o.emoji}</div>${o.label ? `<div style="font-size:${o.size || 96}px;font-weight:800;letter-spacing:-.035em;text-align:center;line-height:1.05">${o.labelHtml}</div>` : ''}</div>`,
  thenNow: () => `<div class="vis"><div style="display:flex;gap:90px;align-items:flex-end">
    <div class="side"><div class="stack">${[...Array(6)].map((_, i) => `<div class="cal ${i > 0 ? 'flip' : ''}" style="--d:${0.3 + (6 - i) * 0.18}s;transform:rotate(${(i - 3) * 2}deg)"><div class="top"></div><div class="n">${12 - i}</div></div>`).join('')}</div><div class="cap2" style="color:#f87171">Then: weeks</div></div>
    <div class="side pop" style="--d:1.6s"><div class="cal"><div class="top" style="background:#34d399"></div><div class="n">7</div></div><div class="cap2" style="color:#34d399">Now: 7 days</div></div></div></div>`,
  // { day: [n,...], upto, emoji }
  build: (o) => `<div class="vis">${dayDots(o.day)}<div style="margin-top:170px;transform:scale(.8)">${miniSite(o.upto, o.emoji)}</div></div>`,
  pile: () => `<div class="vis" style="flex-direction:column;gap:60px"><div class="big-emoji shake" style="--d:.8s">⏳</div><div class="pile">${['📸', '📝', '🔑'].map((e, i) => `<div class="it pop" style="--d:${0.2 + i * 0.2}s">${e}</div>`).join('')}</div></div>`,
  chart: () => `<div class="vis" style="flex-direction:column;gap:30px"><svg class="chart" viewBox="0 0 880 560"><defs><linearGradient id="cg" x1="0" x2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset=".6" stop-color="#2563eb"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs><polyline points="20,520 170,470 300,490 430,360 560,380 690,200 860,40" style="--d:.3s"/></svg><div style="display:flex;gap:40px;font-size:110px"><span class="pop" style="--d:.9s">🤖</span><span class="pop" style="--d:1.1s">📱</span><span class="pop" style="--d:1.3s">⚡</span></div></div>`,
  // { q: "barber near me open sunday" }
  search: (o) => {
    const q = o.q || 'barber near me open sunday';
    return `<div class="vis"><div class="br fade"><div class="sbar">🔎 <span class="typed" style="--n:${q.length};--w:${q.length * 0.55}em;--d:.3s">${esc(q)}</span></div>
    <div class="ai fade" style="--d:1.8s"><div class="h">✨ AI Overview</div><div class="ln grow" style="--d:2s;width:95%"></div><div class="ln grow" style="--d:2.15s;width:80%"></div><div class="ln grow" style="--d:2.3s;width:88%"></div>
    <div class="src pop" style="--d:2.7s">🔗 your website</div></div></div></div>`;
  },
  // site with services / FAQ / hours ticked
  checks: () => `<div class="vis"><div style="display:flex;flex-direction:column;gap:30px;width:860px">${[['🛠️', 'Services'], ['❓', 'FAQ'], ['🕒', 'Hours']].map(([e, t], i) => `<div class="drop" style="--d:${0.2 + i * 0.45}s;display:flex;align-items:center;gap:34px;padding:34px 40px;border-radius:36px;background:#fff;color:#111;box-shadow:0 30px 70px rgba(0,0,0,.4)"><span style="font-size:96px">${e}</span><span style="flex:1;font-size:56px;font-weight:800">${t}</span><span class="pop" style="--d:${0.6 + i * 0.45}s;width:90px;height:90px;border-radius:50%;background:#34d399;display:grid;place-items:center;font-size:56px;color:#062018">✓</span></div>`).join('')}</div></div>`,
  phoneCall: () => `<div class="vis"><div style="transform:scale(.8)"><div class="ph"><div class="notch"></div><div class="scr" style="background:#0d1220">
    <div class="s-nav" style="filter:invert(1)"><b></b><i></i></div>
    <div class="s-hero" style="top:170px"><div class="t1"></div><div class="t2"></div><div class="em">✂️</div></div>
    <div style="position:absolute;left:50%;top:640px;transform:translateX(-50%)"><div class="pulse" style="--d:.6s;width:230px;height:230px;border-radius:50%;background:#34d399;display:grid;place-items:center;font-size:120px">📞</div></div>
    <div style="position:absolute;left:40px;right:40px;bottom:70px;height:22px;border-radius:11px;background:#1c2540;overflow:hidden"><div class="grow" style="--d:.2s;height:100%;width:100%;background:linear-gradient(90deg,#34d399,#22d3ee)"></div></div>
  </div></div></div></div>`,
  night: (o) => `<div class="vis"><div class="sky"></div><div class="moon float">🌙</div>${[...Array(14)].map((_, i) => `<i class="star" style="left:${(i * 73) % 900 + 40}px;top:${(i * 131) % 380 + 20}px;--d:${(i % 5) * 0.3}s"></i>`).join('')}
    <div style="transform:scale(.78);margin-top:120px"><div class="ph"><div class="notch"></div><div class="scr" style="background:linear-gradient(180deg,#1e1b4b,#0f172a)">
    <div class="lock"><div class="tm">11:04</div><div class="dt">Saturday · closed</div></div>
    <div class="note" style="top:440px;--d:.6s"><div class="ic">📅</div><div><b>New booking</b>${esc(o.n1 || 'Sun 2:00 PM · Skin fade')}</div></div>
    <div class="note" style="top:600px;--d:1.4s"><div class="ic">💬</div><div><b>Question answered</b>${esc(o.n2 || '"Do you take walk-ins?"')}</div></div>
  </div></div></div></div>`,
  learn: () => `<div class="vis">${[['🕒', -300, -330], ['✂️', 300, -330], ['📍', -330, 260], ['❓', 330, 260]].map(([e, x, y], i) => `<span class="fly" style="left:calc(50% + ${x}px - 55px);top:calc(50% + ${y}px - 55px);--x:${-x}px;--y:${-y}px;--d:${0.3 + i * 0.25}s">${e}</span>`).join('')}<div class="bot" style="--g:1.1s">🤖</div></div>`,
  allDay: () => `<div class="vis"><div class="clock"><div class="hand hh"></div><div class="hand mh"></div><div class="ctr"></div></div>${['💬', '✅', '📅', '💬', '✅'].map((e, i) => `<div class="bub" style="--d:${0.3 + i * 0.35}s;left:${[40, 760, 0, 780, 380][i]}px;top:${[120, 200, 620, 640, 30][i]}px">${e}</div>`).join('')}</div>`,
  handoff: () => `<div class="vis"><div style="display:flex;align-items:center;gap:30px"><div class="bot" style="width:220px;height:220px;font-size:120px;border-radius:66px;--g:9s">🤖</div><div class="arrow fade" style="--d:.5s">➜</div>
    <div class="pop" style="--d:.9s;width:420px;padding:34px;border-radius:40px;background:#fff;color:#111;box-shadow:0 30px 80px rgba(0,0,0,.5)"><div style="font-size:90px">🧑‍💼</div><div style="font-size:38px;font-weight:800;margin-top:14px">New customer</div><div style="font-size:30px;color:#4b5563;margin-top:8px">Sam · wants a custom quote</div></div></div></div>`,
  formVsChat: () => `<div class="vis"><div class="duo">
    <div class="card lose fade" style="--d:.2s"><div class="t">📝 Form</div><div style="position:relative;font-size:170px">📨<span class="zz" style="--d:.8s;left:120px;top:0">💤</span></div><div class="time">3 hrs</div></div>
    <div class="card win pop" style="--d:1.3s"><div class="t">💬 Chatbot</div><div style="font-size:170px" class="float">⚡</div><div class="time">2 sec</div></div></div></div>`,
  both: () => `<div class="vis" style="flex-direction:column;gap:50px"><div style="display:flex;gap:60px;align-items:center;font-size:190px"><span class="pop" style="--d:.2s">📝</span><span class="pop" style="--d:.6s;font-size:150px">🤝</span><span class="pop" style="--d:1s">💬</span></div><div style="display:flex;gap:120px;font-size:44px;font-weight:800;color:#c4cbe0"><span class="fade" style="--d:.4s">Big requests</span><span class="fade" style="--d:1.1s">Quick questions</span></div></div>`,
};
