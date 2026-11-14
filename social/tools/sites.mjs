// HTML for the fictional "before" and "after" phone screenshots used in reels.
// Every business here is made up. Do not put a real business in a public reel
// without the owner's written OK.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function beforeSite(b) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:${b.oldBg || '#d9d4c7'};font-family:"Times New Roman",serif;color:#222;width:390px}
  .top{background:${b.oldBar || '#3a5a8c'};color:#ff0;text-align:center;padding:6px;font:bold 13px Arial}
  marquee,.marq{display:block;background:#000;color:#0f0;font:12px "Courier New";padding:3px;white-space:nowrap;overflow:hidden}
  h1{font-family:"Comic Sans MS","Times New Roman",serif;font-size:27px;text-align:center;color:${b.oldTitle || '#8b0000'};margin:14px 8px 4px;text-decoration:underline}
  .tag{text-align:center;font-size:13px;font-style:italic;margin:0 10px 10px}
  .img{margin:8px auto;width:300px;height:150px;background:#bbb;border:3px ridge #888;display:flex;align-items:center;justify-content:center;font:11px Arial;color:#555}
  .menu{margin:8px;font-size:12px;line-height:1.4;text-align:center}
  .menu a{color:#00e;text-decoration:underline;margin:0 3px}
  p{font-size:11.5px;line-height:1.35;margin:6px 12px;text-align:justify}
  .uc{margin:10px auto;width:240px;border:2px dashed red;color:red;text-align:center;font:bold 12px Arial;padding:6px;background:#ffffe0}
  table{margin:6px auto;border-collapse:collapse;font-size:11px}
  td{border:1px solid #777;padding:3px 6px;background:#eee}
  .cnt{text-align:center;font:11px "Courier New";margin:8px}
  .cnt span{background:#000;color:#f00;padding:1px 4px;letter-spacing:2px}
  .foot{text-align:center;font-size:10px;color:#555;margin:10px 0 30px}
  </style></head><body>
  <div class="top">*** WELCOME TO OUR WEB SITE ***</div>
  <div class="marq">${esc(b.marquee || 'Call us for more info!!! Best service in town!!! Call us for more info!!!')}</div>
  <h1>${esc(b.name)}</h1>
  <div class="tag">${esc(b.oldTagline || 'Serving our community since ' + (b.since || 1998))}</div>
  <div class="menu"><a>Home</a>|<a>About Us</a>|<a>Servises</a>|<a>Photo Gallary</a>|<a>Links</a>|<a>Guestbook</a></div>
  <div class="img">[ image not found ]</div>
  <p>${esc(b.oldBlurb || 'Welcome to our web site. We are a family owned business. Please browse our web site to find out more about us and what we do. Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore.')}</p>
  <div class="uc">&#9888; PAGE UNDER CONSTRUCTION &#9888;<br>Online booking coming soon!</div>
  <table><tr><td>Mon-Fri</td><td>9-5 (call first)</td></tr><tr><td>Sat</td><td>?? see Facebook</td></tr></table>
  <p>Phone: please see Contact page. Email: ${esc(b.oldEmail || 'info@hotmail.com')}</p>
  <div class="cnt">You are visitor # <span>004127</span></div>
  <div class="foot">Best viewed in Internet Explorer 6 at 800x600<br>&copy; ${b.copyright || 2014} ${esc(b.name)}. All rights reserved.</div>
  </body></html>`;
}

export function afterSite(b) {
  const c = b.color || '#2563eb';
  const c2 = b.color2 || '#06b6d4';
  const services = (b.services || []).map((s) => `<div class="svc"><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}
  body{margin:0;width:390px;background:${b.dark ? '#0d1220' : '#fbfaf7'};color:${b.dark ? '#eef1fb' : '#17171c'};font-family:Inter,system-ui,sans-serif}
  nav{display:flex;align-items:center;justify-content:space-between;padding:16px 20px}
  .logo{font-weight:800;font-size:18px;letter-spacing:-.02em}
  .logo i{font-style:normal;color:${c}}
  .burger{width:22px;height:14px;border-top:2.5px solid currentColor;border-bottom:2.5px solid currentColor;position:relative}
  .burger:after{content:"";position:absolute;left:0;right:0;top:3.5px;border-top:2.5px solid currentColor}
  .hero{margin:4px 14px 0;border-radius:22px;padding:26px 22px 24px;background:linear-gradient(135deg,${c},${c2});color:#fff;position:relative;overflow:hidden}
  .hero .emoji{position:absolute;right:-4px;bottom:-14px;font-size:84px;opacity:.9;transform:rotate(12deg)}
  .kick{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.9}
  h1{font-size:33px;line-height:1.05;letter-spacing:-.03em;margin:12px 0 10px;max-width:270px;font-weight:800}
  .sub{font-size:14px;line-height:1.45;opacity:.95;max-width:290px;margin:0}
  .btns{display:flex;gap:8px;margin-top:18px}
  .b1{background:#fff;color:#111;font-weight:700;font-size:14px;padding:12px 16px;border-radius:999px}
  .b2{border:1.5px solid rgba(255,255,255,.8);color:#fff;font-weight:600;font-size:14px;padding:11px 15px;border-radius:999px}
  .rev{display:flex;align-items:center;gap:10px;margin:14px 14px 0;padding:12px 14px;border-radius:16px;background:${b.dark ? '#151c30' : '#fff'};box-shadow:0 6px 20px rgba(0,0,0,.08);font-size:13px}
  .stars{color:#f5b301;font-size:15px;letter-spacing:1px}
  .svcs{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px}
  .svc{padding:14px;border-radius:16px;background:${b.dark ? '#151c30' : '#fff'};box-shadow:0 6px 20px rgba(0,0,0,.06);font-size:12px;line-height:1.35}
  .svc b{display:block;font-size:14px;margin-bottom:4px}
  .svc span{opacity:.7}
  .bar{position:fixed;left:14px;right:14px;bottom:16px;display:flex;gap:8px}
  .bar div{flex:1;text-align:center;padding:14px;border-radius:14px;font-weight:700;font-size:14px}
  .bar .p{background:${c};color:#fff}.bar .s{background:${b.dark ? '#1e2640' : '#111'};color:#fff}
  </style></head><body>
  <nav><div class="logo">${esc(b.logo || b.name)}</div><div class="burger"></div></nav>
  <div class="hero"><div class="emoji">${b.emoji || ''}</div>
    <div class="kick">${esc(b.kicker || 'Open today')}</div>
    <h1>${esc(b.headline)}</h1>
    <p class="sub">${esc(b.sub || '')}</p>
    <div class="btns"><div class="b1">${esc(b.cta || 'Book now')}</div><div class="b2">${esc(b.cta2 || 'Call us')}</div></div>
  </div>
  <div class="rev"><span class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span><span>${esc(b.review || '4.9 from 200+ Google reviews')}</span></div>
  <div class="svcs">${services}</div>
  <div class="bar"><div class="p">${esc(b.cta || 'Book now')}</div><div class="s">Call</div></div>
  </body></html>`;
}
