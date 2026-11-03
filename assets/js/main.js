(function () {
  // EmailJS settings (from the previous portfolio). The public key is meant to be visible in the browser.
  var EMAILJS = { service: 'service_k88olpk', template: 'template_pp0l5z9', publicKey: 'QBmQSD4Bh7R2WzUED' };
  var EMAIL = 'deepkpatel0301@gmail.com';

  var root = document.documentElement;

  // Theme toggle
  var themeBtn = document.querySelector('[data-theme-toggle]');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var cur = root.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('dp-theme', next); } catch (e) {}
  });

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
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  // Year
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();

  // Reveal on scroll
  var targets = document.querySelectorAll('.section-head, .card, .problem, .work, .steps li, .price, .care, .quote, .faq details');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
  }

  // Pricing buttons preselect the request type
  var form = document.getElementById('contact-form');
  document.querySelectorAll('[data-plan]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (!form) return;
      var plan = a.getAttribute('data-plan');
      var map = { Starter: 'A new website', Business: 'A new website', Redesign: 'A redesign of my current site', 'Care plan': 'A care plan' };
      form.need.value = map[plan] || form.need.value;
      if (!form.details.value) form.details.value = 'I\'m interested in the ' + plan + ' package. ';
    });
  });

  // Contact form
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
    return [
      'Business: ' + (form.business.value || '-'),
      'Website: ' + (form.website.value || '-'),
      'Needs: ' + form.need.value,
      '',
      form.details.value || '(no message)'
    ].join('\n');
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
    if (form.website.value && !form.website.checkValidity()) {
      form.website.setAttribute('aria-invalid', 'true'); bad = bad || form.website;
    } else { form.website.setAttribute('aria-invalid', 'false'); }
    if (bad) { setStatus('Please add your name and a valid email (and a full link starting with https:// for the website).', 'err'); bad.focus(); return; }

    form.message.value = compose();
    btn.disabled = true; setStatus('Sending...');
    loadEmailJS()
      .then(function (ejs) { return ejs.sendForm(EMAILJS.service, EMAILJS.template, form); })
      .then(function () {
        form.reset();
        setStatus('Thanks! I\'ll get back to you within one business day.', 'ok');
      })
      .catch(function () {
        var body = encodeURIComponent('Name: ' + form.user_name.value + '\nEmail: ' + form.user_email.value + '\n' + compose());
        var link = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Website enquiry') + '&body=' + body;
        status.className = 'form-status err';
        status.innerHTML = 'Sorry, that didn\'t send. <a href="' + link + '">Email me directly instead</a>.';
      })
      .then(function () { btn.disabled = false; });
  });
})();
