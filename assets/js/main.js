(function () {
  // EmailJS settings (DK Solutions account; template sends to contact@dksolutions.dev). The public key is meant to be visible in the browser.
  var EMAILJS = { service: 'service_dspk1yn', template: 'template_mdna45f', publicKey: 'fIxpV5-VgHExTa4hp' };
  var EMAIL = 'contact@dksolutions.dev';

  // Mobile menu
  var menuBtn = document.querySelector('[data-menu-toggle]');
  var nav = document.getElementById('site-nav');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  }

  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var paused = reduce.matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Scroll-driven 3D ----------
     One passive scroll listener + one rAF writes CSS variables:
     --scroll (page progress), --hero-p (hero assembly 0..1), --grid-y (floor drift),
     and --p (0..1) on each [data-depth] element as it rises into view. */
  var hero = document.getElementById('hero');
  var dock = document.querySelector('.dock');
  var contact = document.getElementById('contact');
  var depthEls = [].slice.call(document.querySelectorAll('[data-depth]'));
  var active = new Set(depthEls);
  var scene3d = null, bg3d = null, ticking = false, contactVisible = false;

  if ('IntersectionObserver' in window) {
    active = new Set();
    var dio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) active.add(en.target); else active.delete(en.target); });
      requestTick();
    }, { rootMargin: '10% 0px 10% 0px' });
    depthEls.forEach(function (el) { dio.observe(el); });
    if (contact) new IntersectionObserver(function (en) { contactVisible = en[0].isIntersecting; requestTick(); }, { threshold: .15 }).observe(contact);
  }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function update() {
    ticking = false;
    var vh = window.innerHeight, sy = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - vh;
    root.style.setProperty('--scroll', max > 0 ? (sy / max).toFixed(4) : 0);
    var hp = hero ? clamp(sy / (hero.offsetHeight * 0.75)) : 1;
    if (paused) hp = 1;
    root.style.setProperty('--hero-p', hp.toFixed(4));
    if (scene3d) scene3d.setProgress(hp);
    if (bg3d) bg3d.setProgress(max > 0 ? sy / max : 0);
    if (!paused) root.style.setProperty('--grid-y', ((sy * 0.35) % 64).toFixed(1) + 'px');
    active.forEach(function (el) {
      var r = el.getBoundingClientRect();
      // 0 when the top edge is at the bottom of the screen, 1 once it is 32% of the screen up
      var p = paused ? 1 : clamp((vh - r.top) / (vh * 0.32));
      el.style.setProperty('--p', p.toFixed(3));
    });
    if (dock) dock.classList.toggle('show', sy > vh * 0.55 && !contactVisible);
    updateWork(vh);
    updateCube(vh);
  }

  /* Work: which project is in the middle of the screen drives the 3D laptop */
  var workSec = document.getElementById('work');
  var workList = workSec && workSec.querySelector('.work-list');
  var works = workSec ? [].slice.call(workSec.querySelectorAll('.work')) : [];
  var workLabel = document.querySelector('[data-work-label]');
  var work3d = null, workIdx = -1;
  function updateWork(vh) {
    if (!workList) return;
    var r = workList.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2) return;
    var mid = vh / 2, best = 0, bestD = Infinity;
    works.forEach(function (w, i) { var b = w.getBoundingClientRect(); var d = Math.abs(b.top + b.height / 2 - mid); if (d < bestD) { bestD = d; best = i; } });
    if (best !== workIdx) {
      workIdx = best;
      works.forEach(function (w, i) { w.classList.toggle('is-active', i === best); });
      if (workLabel) workLabel.textContent = works[best].querySelector('h3').textContent;
    }
    if (work3d) work3d.set(paused ? 1 : clamp((vh - r.top) / (vh * 0.7)), best);
  }

  /* Process: the big cube turns to face the step being read */
  var cube = document.querySelector('[data-cube]');
  var steps = [].slice.call(document.querySelectorAll('.step'));
  var stepIdx = -1;
  function updateCube(vh) {
    if (!cube || !steps.length) return;
    var idx = 0;
    steps.forEach(function (st, i) { if (st.getBoundingClientRect().top < vh * 0.6) idx = i; });
    if (idx !== stepIdx) {
      stepIdx = idx;
      cube.style.setProperty('--cube-ry', String(-idx * 90));
      steps.forEach(function (st, i) { st.classList.toggle('is-active', i === idx); });
    }
  }
  function requestTick() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick, { passive: true });
  update();

  /* ---------- Pointer tilt on panels and device screens (mouse/trackpad only) ---------- */
  if (finePointer) {
    document.querySelectorAll('.tilt').forEach(function (el) {
      var max = el.classList.contains('device') ? 6 : 8;
      el.addEventListener('pointermove', function (e) {
        if (paused) return;
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.classList.add('is-tilting');
        el.style.setProperty('--ry', ((x - .5) * 2 * max).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((.5 - y) * 2 * max).toFixed(2) + 'deg');
        el.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- Pause motion (WCAG 2.2.2) ---------- */
  var motionBtn = document.querySelector('[data-motion-toggle]');
  function setPaused(v, save) {
    paused = v;
    root.classList.toggle('paused', v);
    if (motionBtn) {
      motionBtn.setAttribute('aria-pressed', String(v));
      motionBtn.setAttribute('aria-label', v ? 'Play motion' : 'Pause motion');
      motionBtn.title = v ? 'Play motion' : 'Pause motion';
    }
    if (scene3d) scene3d.pause(v);
    if (work3d) work3d.pause(v);
    if (bg3d) bg3d.pause(v);
    if (carouselTick) carouselTick();
    if (save) { try { localStorage.setItem('dk-motion', v ? 'off' : 'on'); } catch (e) {} }
    requestTick();
  }
  try { if (localStorage.getItem('dk-motion') === 'off') paused = true; } catch (e) {}
  setPaused(paused, false);
  if (motionBtn) motionBtn.addEventListener('click', function () { setPaused(!paused, true); });

  /* ---------- Real 3D hero (three.js), loaded after first paint on capable devices ---------- */
  function canWebGL() {
    try { var c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  }
  var conn = navigator.connection || {};
  var lowEnd = conn.saveData || (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
  var heroCanvas = document.querySelector('[data-hero-canvas]');
  function boot3d() {
    if (!heroCanvas || reduce.matches || lowEnd || !canWebGL()) return;
    import('./hero3d.js?v=7').then(function (mod) {
      scene3d = mod.start(heroCanvas, { paused: paused });
      if (!scene3d) return;
      requestAnimationFrame(function () { root.classList.add('webgl-on'); });
      requestTick();
    }).catch(function () { /* keep the CSS 3D poster */ });
  }
  /* Real 3D laptop for the work section: wide screens only, loaded when the section gets close */
  var workCanvas = document.querySelector('[data-work-canvas]');
  function bootWork3d() {
    if (!workCanvas || reduce.matches || lowEnd || !canWebGL() || !window.matchMedia('(min-width: 1100px)').matches) return;
    var go = function () {
      import('./work3d.js?v=7').then(function (mod) {
        workSec.classList.add('work3d-on');
        work3d = mod.start(workCanvas, works, { paused: paused });
        if (!work3d) { workSec.classList.remove('work3d-on'); return; }
        workIdx = -1; requestTick();
      }).catch(function () { workSec.classList.remove('work3d-on'); });
    };
    if ('IntersectionObserver' in window) {
      var wio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { wio.disconnect(); go(); } }, { rootMargin: '900px 0px' });
      wio.observe(workSec);
    } else go();
  }

  function whenIdle(fn) { if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 2500 }); else setTimeout(fn, 600); }
  /* Immersive corridor behind the whole page. Phones get it only with 6+ cores and no data saver. */
  var bgCanvas = document.querySelector('[data-bg-canvas]');
  function bootBg3d() {
    if (!bgCanvas || reduce.matches || lowEnd || !canWebGL()) return;
    if (window.matchMedia('(max-width: 760px)').matches && !(navigator.hardwareConcurrency >= 6)) return;
    import('./bg3d.js?v=7').then(function (mod) {
      bg3d = mod.start(bgCanvas, { paused: paused });
      if (!bg3d) return;
      root.classList.add('bg3d-on'); requestTick();
    }).catch(function () {});
  }
  function bootAll() { boot3d(); bootWork3d(); setTimeout(bootBg3d, 400); }
  if (document.readyState === 'complete') whenIdle(bootAll); else window.addEventListener('load', function () { whenIdle(bootAll); });

  /* ---------- Concept designs: 3D cover-flow carousel ----------
     Buttons, arrow keys, swipe, or tap a side slide. Auto-advances every 5 s while on screen,
     stops on hover/focus and when motion is paused (WCAG 2.2.2). */
  var carouselTick = null;
  (function () {
    var root = document.querySelector('[data-carousel]');
    if (!root) return;
    var slides = [].slice.call(root.querySelectorAll('.cslide'));
    var status = root.querySelector('[data-status]');
    var n = slides.length, cur = 0, hover = false, inView = false, timer = 0;
    function render(announce) {
      slides.forEach(function (sl, i) {
        var d = i - cur; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
        sl.style.setProperty('--d', d); sl.style.setProperty('--ad', Math.abs(d));
        sl.classList.toggle('is-front', d === 0);
        sl.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
      });
      if (status && announce !== false) status.textContent = (cur + 1) + ' of ' + n + ': ' + slides[cur].querySelector('b').textContent;
    }
    function go(i, announce) { cur = (i + n) % n; render(announce); }
    root.querySelector('[data-prev]').addEventListener('click', function () { go(cur - 1); });
    root.querySelector('[data-next]').addEventListener('click', function () { go(cur + 1); });
    slides.forEach(function (sl, i) { sl.addEventListener('click', function () { if (i !== cur) go(i); }); });
    root.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') go(cur - 1); if (e.key === 'ArrowRight') go(cur + 1); });
    var sx = null;
    root.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    root.addEventListener('pointerup', function (e) { if (sx !== null && Math.abs(e.clientX - sx) > 40) go(cur + (e.clientX < sx ? 1 : -1)); sx = null; });
    root.addEventListener('mouseenter', function () { hover = true; }); root.addEventListener('mouseleave', function () { hover = false; });
    root.addEventListener('focusin', function () { hover = true; }); root.addEventListener('focusout', function () { hover = false; });
    carouselTick = function () {
      clearInterval(timer);
      if (paused || reduce.matches || !inView) return;
      timer = setInterval(function () { if (!hover && !document.hidden) go(cur + 1, false); }, 5000);
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { inView = en[0].isIntersecting; carouselTick(); }, { threshold: .3 }).observe(root);
    render(false);
  })();

  /* ---------- Demo AI assistant ----------
     A scripted demo that answers from a small knowledge base about Deep's services,
     the same way a client's assistant answers only from their own business info. */
  var KB = [
    { k: ['hi', 'hello', 'hey', 'bonjour', 'salut'], a: 'Hi! I\'m the DK Solutions assistant. Ask me about new websites, redesigns, timelines, or how to get a free website check.' },
    { k: ['services', 'service', 'offer', 'build', 'provide', 'sell', 'make'], a: 'DK Solutions builds new websites and redesigns outdated ones for small businesses anywhere in the world, plus local SEO, booking and quote forms, optional AI features and monthly care. <a href="#services">See all services</a>.' },
    { k: ['new', 'online', 'start', 'launch'], a: 'A new website is designed around your business: mobile-first, fast, set up for Google, with a contact or booking form so visitors turn into customers. Most are live in 2 to 4 weeks.' },
    { k: ['existing', 'already', 'wix', 'squarespace', 'wordpress', 'shopify', 'current', 'redesign', 'old', 'outdated', 'slow'], a: 'Yes, DK Solutions redesigns existing websites, including Wix, Squarespace and WordPress sites. You keep your address and Google rankings, and get a faster, modern site. The free website check tells you what to fix first.' },
    { k: ['price', 'cost', 'much', 'pricing', 'quote', 'budget', 'expensive', 'cheap', 'afford'], a: 'Every project gets its own fixed quote, free, before any work starts. Tell Deep about your business in the <a href="#contact">contact form</a> and you\'ll usually hear back within one business day.' },
    { k: ['long', 'time', 'timeline', 'weeks', 'fast', 'quick', 'when'], a: 'Most Starter websites go live in about 2 weeks and Business websites in 3 to 4 weeks. Redesigns depend on the size of your current site.' },
    { k: ['seo', 'google', 'search', 'rank', 'found', 'maps'], a: 'Every site is built to be found: page titles, structured data, a sitemap, and a properly set up Google Business Profile so you show up on Google and Maps.' },
    { k: ['chatbot', 'assistant', 'bot', 'ai', 'chat', 'automation'], a: 'AI features are optional extras. You\'re using one right now: an assistant that answers customer questions 24/7 from your own business info and passes anything else to you.' },
    { k: ['french', 'francais', 'français', 'bilingual', 'language', 'quebec'], a: 'Yes. Websites can be built in English plus another language, such as French or Spanish, with a language switch.' },
    { k: ['update', 'edit', 'change', 'maintain', 'care', 'maintenance', 'hosting'], a: 'You can make simple edits yourself and Deep will show you how. Or the optional care plan covers backups, updates and small changes every month.' },
    { k: ['where', 'located', 'location', 'ottawa', 'canada', 'local', 'meet', 'country', 'usa', 'uk', 'outside', 'abroad', 'international', 'worldwide', 'remote'], a: 'DK Solutions is based in Ottawa, Canada, and works with small businesses anywhere in the world by email, phone and video. Happy to meet in person around Ottawa.' },
    { k: ['who', 'deep', 'dk', 'solutions', 'about', 'experience', 'background', 'qualified'], a: 'DK Solutions is run by Deep Patel, a web developer who handles every project personally, from first call to launch. <a href="#work">See past work</a>.' },
    { k: ['work', 'portfolio', 'examples', 'projects', 'past', 'example'], a: 'Recent work includes Listaro, a subscription web platform for Marketplace sellers (listaro.dev), a website redesign for Safal Embedded Solution, and a timesheet web app for Ottawa transit operators. <a href="#work">See the projects</a>.' },
    { k: ['contact', 'email', 'call', 'talk', 'reach', 'book', 'check', 'free'], a: 'The easiest way is the free website check: fill in the <a href="#contact">form</a> or email <a href="mailto:' + EMAIL + '">' + EMAIL + '</a>. Deep replies within one business day.' }
  ];
  var FALLBACK = 'Good question. I\'m a demo, so I only know about DK Solutions\' services. Send it through the <a href="#contact">contact form</a> and Deep will answer personally.';
  var CHIPS = ['Can you redesign my website?', 'How long does a website take?', 'How do I get a quote?', 'Will I show up on Google?', 'Do you work outside Canada?'];

  function answer(q) {
    var words = q.toLowerCase().replace(/[^a-zàâçéèêëîïôûùüÿñæœ0-9\s]/gi, ' ').split(/\s+/).filter(Boolean);
    var best = null, bestScore = 0;
    KB.forEach(function (item, i) {
      var s = 0;
      item.k.forEach(function (k) { if (words.indexOf(k) !== -1) s += (k.length > 3 ? 2 : 1); });
      if (i === 0 && words.length > 3) s = 0; // greetings only win short messages
      if (s > bestScore) { bestScore = s; best = item; }
    });
    return best && bestScore >= 1 ? best.a : FALLBACK;
  }

  var chat = document.getElementById('chat');
  var fab = document.querySelector('.chat-fab');
  if (chat) {
    var log = chat.querySelector('.chat-log');
    var chips = chat.querySelector('.chat-chips');
    var chatForm = chat.querySelector('.chat-form');
    var input = chat.querySelector('#chat-input');
    var started = false;

    function add(html, who) {
      var p = document.createElement('p');
      p.className = 'msg ' + who;
      if (who === 'user') p.textContent = html; else p.innerHTML = html;
      log.appendChild(p); log.scrollTop = log.scrollHeight;
      return p;
    }
    function reply(q) {
      var t = document.createElement('p');
      t.className = 'msg bot typing'; t.innerHTML = '<i></i><i></i><i></i>';
      t.setAttribute('aria-label', 'Assistant is typing');
      log.appendChild(t); log.scrollTop = log.scrollHeight;
      setTimeout(function () { t.remove(); add(answer(q), 'bot'); }, 650 + Math.random() * 450);
    }
    function ask(q) { q = q.trim(); if (!q) return; add(q, 'user'); reply(q); }

    CHIPS.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = c;
      b.addEventListener('click', function () { ask(c); });
      chips.appendChild(b);
    });

    var opener = null;
    function openChat(e) {
      opener = e && e.currentTarget;
      chat.hidden = false; fab.setAttribute('aria-expanded', 'true');
      if (!started) { started = true; add('Hi! I\'m a demo of an AI feature DK Solutions can add to your website. Ask me about websites, redesigns or quotes, or tap a question below.', 'bot'); }
      setTimeout(function () { input.focus(); }, 50);
    }
    function closeChat() { chat.hidden = true; fab.setAttribute('aria-expanded', 'false'); var back = opener && opener.offsetParent ? opener : (fab.offsetParent ? fab : null); if (back) back.focus(); }

    document.querySelectorAll('[data-open-chat]').forEach(function (b) { b.addEventListener('click', openChat); });
    chat.querySelector('[data-close-chat]').addEventListener('click', closeChat);
    chatForm.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); input.value = ''; });
    log.addEventListener('click', function (e) { if (e.target.closest('a[href^="#"]') && window.innerWidth < 600) closeChat(); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!chat.hidden) closeChat(); else if (nav && nav.classList.contains('open')) setMenu(false);
    });
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contact-form');
  document.querySelectorAll('[data-plan]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (!form) return;
      var plan = a.getAttribute('data-plan');
      var map = { 'Starter website': 'A new website', 'Business website': 'A new website', 'Website redesign': 'A redesign of my current website', 'Care plan': 'Not sure yet' };
      form.need.value = map[plan] || form.need.value;
      if (!form.details.value) form.details.value = 'I\'m interested in the ' + plan + ' package. ';
    });
  });
  if (!form) return;
  var status = form.querySelector('.form-status');
  var btn = form.querySelector('button[type="submit"]');

  function loadEmailJS() {
    if (window.emailjs) return Promise.resolve(window.emailjs);
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4.4.1/dist/email.min.js';
      s.onload = function () { window.emailjs.init({ publicKey: EMAILJS.publicKey }); res(window.emailjs); };
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  function compose() {
    return ['Business: ' + (form.business.value || '-'), 'Website: ' + (form.website.value || '-'), 'Needs: ' + form.need.value, '', form.details.value || '(no message)'].join('\n');
  }
  function setStatus(text, cls) { status.textContent = text; status.className = 'form-status ' + (cls || ''); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = null;
    ['user_name', 'user_email'].forEach(function (n) {
      var f = form[n]; var ok = f.checkValidity();
      f.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok && !bad) bad = f;
    });
    if (form.website.value && !form.website.checkValidity()) { form.website.setAttribute('aria-invalid', 'true'); bad = bad || form.website; }
    else form.website.setAttribute('aria-invalid', 'false');
    if (bad) { setStatus('Please add your name and a valid email (and a full link starting with https:// for the website).', 'err'); bad.focus(); return; }

    form.message.value = compose();
    btn.disabled = true; setStatus('Sending...');
    loadEmailJS()
      .then(function (ejs) { return ejs.sendForm(EMAILJS.service, EMAILJS.template, form); })
      .then(function () { form.reset(); form.classList.add('sent'); setStatus('Thanks! Your request is in. I\'ll reply within one business day with your free website check.', 'ok'); status.setAttribute('tabindex', '-1'); status.focus(); })
      .catch(function () {
        var body = encodeURIComponent('Name: ' + form.user_name.value + '\nEmail: ' + form.user_email.value + '\n' + compose());
        var link = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Website enquiry') + '&body=' + body;
        status.className = 'form-status err';
        status.innerHTML = 'Sorry, that didn\'t send. <a href="' + link + '">Email me directly instead</a>.';
      })
      .then(function () { btn.disabled = false; });
  });
})();
