(function () {
  // EmailJS settings (from the previous portfolio). The public key is meant to be visible in the browser.
  var EMAILJS = { service: 'service_k88olpk', template: 'template_pp0l5z9', publicKey: 'QBmQSD4Bh7R2WzUED' };
  var EMAIL = 'deepkpatel0301@gmail.com';

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

  // Reveal on scroll
  var targets = document.querySelectorAll('.section-head, .card, .metric, .work, .steps li, .price, .care, .quote, .faq details');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
  }

  /* ---------- Demo AI assistant ----------
     A scripted demo that answers from a small knowledge base about Deep's services,
     the same way a client's assistant answers only from their own business info. */
  var KB = [
    { k: ['hi', 'hello', 'hey', 'bonjour', 'salut'], a: 'Hi! I\'m the DK Solutions assistant. Ask me about new websites, redesigns, timelines, or how to get a free website check.' },
    { k: ['services', 'service', 'offer', 'build', 'provide', 'sell', 'make'], a: 'DK Solutions builds new websites and redesigns outdated ones for Canadian small businesses, plus local SEO, booking and quote forms, optional AI features and monthly care. <a href="#services">See all services</a>.' },
    { k: ['new', 'online', 'start', 'launch'], a: 'A new website is designed around your business: mobile-first, fast, set up for Google, with a contact or booking form so visitors turn into customers. Most are live in 2 to 4 weeks.' },
    { k: ['existing', 'already', 'wix', 'squarespace', 'wordpress', 'shopify', 'current', 'redesign', 'old', 'outdated', 'slow'], a: 'Yes, DK Solutions redesigns existing websites, including Wix, Squarespace and WordPress sites. You keep your address and Google rankings, and get a faster, modern site. The free website check tells you what to fix first.' },
    { k: ['price', 'cost', 'much', 'pricing', 'quote', 'budget', 'expensive', 'cheap', 'afford'], a: 'Every project gets its own fixed quote, free, before any work starts. Tell Deep about your business in the <a href="#contact">contact form</a> and you\'ll usually hear back within one business day.' },
    { k: ['long', 'time', 'timeline', 'weeks', 'fast', 'quick', 'when'], a: 'Most Starter websites go live in about 2 weeks and Business websites in 3 to 4 weeks. Redesigns depend on the size of your current site.' },
    { k: ['seo', 'google', 'search', 'rank', 'found', 'maps'], a: 'Every site is built to be found: page titles, structured data, a sitemap, and a properly set up Google Business Profile so you show up on Google and Maps.' },
    { k: ['chatbot', 'assistant', 'bot', 'ai', 'chat', 'automation'], a: 'AI features are optional extras. You\'re using one right now: an assistant that answers customer questions 24/7 from your own business info and passes anything else to you.' },
    { k: ['french', 'francais', 'français', 'bilingual', 'language', 'quebec'], a: 'Oui! Websites can be built in English and French with a language switch.' },
    { k: ['update', 'edit', 'change', 'maintain', 'care', 'maintenance', 'hosting'], a: 'You can make simple edits yourself and Deep will show you how. Or the optional care plan covers backups, updates and small changes every month.' },
    { k: ['where', 'located', 'location', 'ottawa', 'canada', 'local', 'meet'], a: 'DK Solutions is based in Ottawa, Ontario, and works with small businesses anywhere in Canada by phone and video. Happy to meet in person around Ottawa.' },
    { k: ['who', 'deep', 'dk', 'solutions', 'about', 'experience', 'background', 'qualified'], a: 'DK Solutions is run by Deep Patel, an Ottawa web developer with a Master of Engineering from Carleton University. <a href="#about">More about Deep</a>.' },
    { k: ['work', 'portfolio', 'examples', 'projects', 'past', 'example'], a: 'Recent work includes a website redesign for Safal Embedded Solution, a rules assistant website for ATU Local 279, a timesheet web app for Ottawa transit operators, and event RSVP sites. <a href="#work">See the projects</a>.' },
    { k: ['contact', 'email', 'call', 'talk', 'reach', 'book', 'check', 'free'], a: 'The easiest way is the free website check: fill in the <a href="#contact">form</a> or email <a href="mailto:' + EMAIL + '">' + EMAIL + '</a>. Deep replies within one business day.' }
  ];
  var FALLBACK = 'Good question. I\'m a demo, so I only know about DK Solutions\' services. Send it through the <a href="#contact">contact form</a> and Deep will answer personally.';
  var CHIPS = ['Can you redesign my website?', 'How long does a website take?', 'How do I get a quote?', 'Will I show up on Google?', 'Can it be in French?'];

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

    function openChat() {
      chat.hidden = false; fab.setAttribute('aria-expanded', 'true');
      if (!started) { started = true; add('Hi! I\'m a demo of an AI feature DK Solutions can add to your website. Ask me about websites, redesigns or quotes, or tap a question below.', 'bot'); }
      setTimeout(function () { input.focus(); }, 50);
    }
    function closeChat() { chat.hidden = true; fab.setAttribute('aria-expanded', 'false'); fab.focus(); }

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
      .then(function () { form.reset(); setStatus('Thanks! I\'ll get back to you within one business day.', 'ok'); })
      .catch(function () {
        var body = encodeURIComponent('Name: ' + form.user_name.value + '\nEmail: ' + form.user_email.value + '\n' + compose());
        var link = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Website enquiry') + '&body=' + body;
        status.className = 'form-status err';
        status.innerHTML = 'Sorry, that didn\'t send. <a href="' + link + '">Email me directly instead</a>.';
      })
      .then(function () { btn.disabled = false; });
  });
})();
