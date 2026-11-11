/* DK Solutions hero: an "exploded" website in real 3D.
   Six glass layers (browser, nav, headline, photo, cards, AI chat) float apart in depth,
   follow the pointer, and click together into one finished page as you scroll.
   Loaded only after first paint, only on devices that can afford it (see main.js). */
import * as THREE from 'three';
import { RoomEnvironment } from './../vendor/three/RoomEnvironment.js';

export function start(canvas, opts) {
  opts = opts || {};
  var small = window.matchMedia('(max-width: 760px)').matches;
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !small, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  var DPR = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
  renderer.setPixelRatio(DPR);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  var scene = new THREE.Scene();
  var pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  /* ---------- textures drawn with Canvas 2D (no image downloads) ---------- */
  var TW = 1024, TH = 640;
  function tex(draw) {
    var c = document.createElement('canvas'); c.width = TW; c.height = TH;
    var g = c.getContext('2d'); draw(g);
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function glassSheet(g) {
    rr(g, 4, 4, TW - 8, TH - 8, 34);
    g.fillStyle = 'rgba(120,170,255,0.045)'; g.fill();
    g.lineWidth = 3; g.strokeStyle = 'rgba(140,200,255,0.30)'; g.stroke();
  }
  var CY = '#3ee6ff', VI = '#8b6cff';
  function grad(g, x0, x1) { var gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, '#7c3aed'); gr.addColorStop(.55, '#2563eb'); gr.addColorStop(1, '#06b6d4'); return gr; }

  var drawers = [
    function base(g) { // browser window
      var bg = g.createLinearGradient(0, 0, TW, TH); bg.addColorStop(0, '#0d1430'); bg.addColorStop(1, '#070a18');
      rr(g, 0, 0, TW, TH, 36); g.fillStyle = bg; g.fill();
      g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, 0, TW, 64);
      ['#ff6b6b', '#ffc75a', '#46e08a'].forEach(function (c, i) { g.beginPath(); g.arc(40 + i * 30, 32, 9, 0, 7); g.fillStyle = c; g.fill(); });
      rr(g, 300, 16, 424, 32, 16); g.fillStyle = 'rgba(255,255,255,0.07)'; g.fill();
      g.fillStyle = 'rgba(220,230,255,0.75)'; g.font = '500 20px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('yourbusiness.com', 512, 39);
    },
    function nav(g) {
      glassSheet(g);
      rr(g, 56, 96, 120, 30, 15); g.fillStyle = '#eef1fb'; g.fill();
      for (var i = 0; i < 3; i++) { rr(g, 520 + i * 96, 104, 70, 14, 7); g.fillStyle = 'rgba(200,210,240,0.5)'; g.fill(); }
      rr(g, 836, 92, 132, 40, 20); g.fillStyle = CY; g.fill();
    },
    function headline(g) {
      glassSheet(g);
      rr(g, 56, 196, 430, 40, 12); g.fillStyle = '#f4f6ff'; g.fill();
      rr(g, 56, 250, 330, 40, 12); g.fillStyle = '#f4f6ff'; g.fill();
      rr(g, 56, 316, 400, 14, 7); g.fillStyle = 'rgba(190,200,230,0.55)'; g.fill();
      rr(g, 56, 342, 360, 14, 7); g.fill();
      rr(g, 56, 384, 170, 54, 16); g.fillStyle = grad(g, 56, 226); g.fill();
      g.fillStyle = '#fff'; g.font = '600 22px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('Book now', 141, 418);
    },
    function photo(g) {
      glassSheet(g);
      var x = 560, y = 180, w = 410, h = 270;
      g.save(); rr(g, x, y, w, h, 24); g.clip();
      var sky = g.createLinearGradient(0, y, 0, y + h); sky.addColorStop(0, '#2b2a7a'); sky.addColorStop(.6, '#0f6f8f'); sky.addColorStop(1, '#0b2a3a');
      g.fillStyle = sky; g.fillRect(x, y, w, h);
      g.beginPath(); g.arc(x + 300, y + 80, 34, 0, 7); g.fillStyle = 'rgba(255,220,160,0.9)'; g.fill();
      g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + 120, y + 130); g.lineTo(x + 210, y + 210); g.lineTo(x + 300, y + 120); g.lineTo(x + w, y + 230); g.lineTo(x + w, y + h); g.closePath();
      g.fillStyle = 'rgba(8,20,40,0.85)'; g.fill();
      g.restore();
      rr(g, x, y, w, h, 24); g.lineWidth = 3; g.strokeStyle = 'rgba(160,220,255,0.5)'; g.stroke();
    },
    function cards(g) {
      glassSheet(g);
      for (var i = 0; i < 3; i++) {
        var x = 56 + i * 312;
        rr(g, x, 486, 288, 112, 20); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fill();
        g.lineWidth = 2; g.strokeStyle = 'rgba(160,190,255,0.35)'; g.stroke();
        rr(g, x + 22, 508, 40, 40, 12); g.fillStyle = i === 1 ? VI : CY; g.fill();
        rr(g, x + 78, 516, 150, 12, 6); g.fillStyle = 'rgba(230,235,255,0.8)'; g.fill();
        rr(g, x + 78, 540, 120, 10, 5); g.fillStyle = 'rgba(190,200,230,0.45)'; g.fill();
      }
    },
    function chat(g) {
      glassSheet(g);
      rr(g, 600, 470, 380, 92, 26); g.fillStyle = 'rgba(14,20,44,0.96)'; g.fill();
      g.lineWidth = 3; g.strokeStyle = 'rgba(62,230,255,0.8)'; g.stroke();
      g.beginPath(); g.arc(646, 516, 24, 0, 7); g.fillStyle = grad(g, 622, 670); g.fill();
      g.fillStyle = '#fff'; g.font = '700 18px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('AI', 646, 523);
      g.textAlign = 'left'; g.font = '500 20px Inter, sans-serif'; g.fillStyle = '#e8ecff';
      g.fillText('Hi! Want to book a', 684, 508); g.fillText('visit this week?', 684, 536);
    }
  ];

  /* ---------- geometry ---------- */
  var W = 4.2, H = W * TH / TW;
  var site = new THREE.Group();
  var rig = new THREE.Group(); rig.add(site); scene.add(rig);
  var layers = [];

  // base slab: brushed dark metal with clearcoat, browser texture on the front
  var slabMat = new THREE.MeshPhysicalMaterial({ color: 0x0b1024, metalness: 0.7, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 });
  var faceMat = new THREE.MeshBasicMaterial({ map: tex(drawers[0]), transparent: true });
  var slab = new THREE.Mesh(new THREE.BoxGeometry(W + 0.06, H + 0.06, 0.12), [slabMat, slabMat, slabMat, slabMat, faceMat, slabMat]);
  site.add(slab); layers.push(slab);

  var edgeGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(W, H));
  for (var i = 1; i < drawers.length; i++) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: tex(drawers[i]), transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    var e = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: i === 5 ? 0x3ee6ff : 0x8fb4ff, transparent: true, opacity: 0.0 }));
    m.add(e); m.userData.edge = e;
    m.renderOrder = i;
    site.add(m); layers.push(m);
  }

  // soft glow pool under the stack
  var glowTex = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d');
    var r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    r.addColorStop(0, 'rgba(62,230,255,0.55)'); r.addColorStop(.4, 'rgba(124,58,237,0.22)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, 256, 256);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  var pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = -2.1; scene.add(pool);

  // a few dust motes catching the light (capped: 16 phone / 34 desktop)
  var N = small ? 16 : 34, pos = new Float32Array(N * 3), seeds = [];
  for (var k = 0; k < N; k++) { seeds.push(Math.random() * 6.28); pos[k * 3] = (Math.random() - .5) * 8; pos[k * 3 + 1] = (Math.random() - .5) * 5; pos[k * 3 + 2] = (Math.random() - .5) * 4; }
  var dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x9fe9ff, size: small ? 0.05 : 0.04, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  /* ---------- state ---------- */
  var target = { p: 0, mx: 0, my: 0 }, cur = { p: 0, mx: 0, my: 0 };
  var running = false, visible = true, paused = !!opts.paused, raf = 0, t0 = performance.now(), intro = 0;

  function resize() {
    var r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    // keep the whole stack in frame on narrow screens
    camera.position.z = camera.aspect < 1.1 ? 12 + (1.1 - camera.aspect) * 7 : 12;
    camera.updateProjectionMatrix();
  }
  var ease = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

  function frame(now) {
    var t = (now - t0) / 1000;
    intro = Math.min(1, Math.max(intro, (now - t0) / 1800));
    var k = 0.085;
    cur.p += (target.p - cur.p) * k; cur.mx += (target.mx - cur.mx) * 0.06; cur.my += (target.my - cur.my) * 0.06;
    var p = ease(Math.min(1, Math.max(0, cur.p)));
    var open = ease(intro) * (1 - p); // 1 = exploded, 0 = assembled

    var gap = 0.04 + open * 0.95;
    for (var i = 0; i < layers.length; i++) {
      var L = layers[i];
      L.position.z = i * gap;
      L.position.y = Math.sin(t * 0.9 + i) * 0.04 * open;
      if (L.userData.edge) L.userData.edge.material.opacity = 0.15 + open * 0.55;
    }
    site.position.z = -layers.length * gap * 0.5;
    rig.rotation.y = -0.78 * open - 0.06 + cur.mx * 0.22 + Math.sin(t * 0.35) * 0.03 * open;
    rig.rotation.x = 0.3 * open + 0.03 - cur.my * 0.14;
    rig.rotation.z = 0.05 * open;
    rig.position.y = 0.15 * open;
    camera.position.x = cur.mx * 0.35;
    camera.position.y = cur.my * 0.2;
    camera.lookAt(0, 0, 0);

    var a = dustGeo.attributes.position.array;
    for (var d = 0; d < N; d++) { a[d * 3 + 1] += Math.sin(t * 0.5 + seeds[d]) * 0.0016; a[d * 3] += 0.0009; if (a[d * 3] > 4) a[d * 3] = -4; }
    dustGeo.attributes.position.needsUpdate = true;
    pool.material.opacity = 0.6 + open * 0.4;

    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(frame);
  }
  function play() { if (running || paused || !visible || document.hidden) return; running = true; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  resize();
  window.addEventListener('resize', function () { resize(); if (!running) frame(performance.now()); }, { passive: true });
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', function (e) {
      target.mx = (e.clientX / window.innerWidth - 0.5) * 2;
      target.my = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else play(); });
  new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) play(); else stop(); }).observe(canvas);

  if (paused) { intro = 1; frame(performance.now()); } else play();

  return {
    setProgress: function (p) { target.p = p; if (paused) { cur.p = p; frame(performance.now()); } },
    pause: function (v) { paused = v; if (v) { stop(); intro = 1; frame(performance.now()); } else play(); }
  };
}
