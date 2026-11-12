/* DK Solutions work showcase: a real 3D laptop that stays on screen while the projects scroll past.
   The lid opens as the section arrives, the laptop turns for each project, and the screen switches
   to that project's screenshot. Desktop only (main.js decides); the CSS 3D screens remain the fallback. */
import * as THREE from 'three';
import { RoomEnvironment } from './../vendor/three/RoomEnvironment.js';

export function start(canvas, articles, opts) {
  opts = opts || {};
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  var scene = new THREE.Scene();
  var pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  var key = new THREE.DirectionalLight(0x9fe9ff, 1.4); key.position.set(-3, 5, 4); scene.add(key);
  var rim = new THREE.DirectionalLight(0x8b6cff, 1.2); rim.position.set(4, 2, -4); scene.add(rim);

  var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 2.4, 10.4);

  /* ---------- laptop ---------- */
  var W = 3.4, D = 2.3, T = 0.11;
  var metal = new THREE.MeshPhysicalMaterial({ color: 0x1c2233, metalness: 0.9, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  var edge = new THREE.MeshPhysicalMaterial({ color: 0x3ee6ff, metalness: 0.3, roughness: 0.2, emissive: 0x0a5f73, emissiveIntensity: 0.6 });

  var rig = new THREE.Group(); scene.add(rig);
  var laptop = new THREE.Group(); rig.add(laptop);

  var base = new THREE.Mesh(new THREE.BoxGeometry(W, T, D), metal);
  base.position.y = T / 2; laptop.add(base);
  // thin glowing seam along the front edge
  var seam = new THREE.Mesh(new THREE.BoxGeometry(W * 0.98, 0.012, 0.012), edge);
  seam.position.set(0, T * 0.55, D / 2 + 0.002); laptop.add(seam);

  // keyboard + trackpad drawn once with Canvas 2D
  var kb = (function () {
    var c = document.createElement('canvas'); c.width = 1024; c.height = 692; var g = c.getContext('2d');
    g.fillStyle = '#1d2232'; g.fillRect(0, 0, 1024, 692);
    var rows = [14, 14, 13, 12, 11], kw = 62, gap = 8;
    rows.forEach(function (n, r) {
      var total = n * kw + (n - 1) * gap, x0 = (1024 - total) / 2;
      for (var i = 0; i < n; i++) { g.fillStyle = '#0d1018'; g.beginPath(); g.roundRect(x0 + i * (kw + gap), 40 + r * 68, kw, 58, 8); g.fill(); }
    });
    g.fillStyle = '#0d1018'; g.beginPath(); g.roundRect(262, 40 + 5 * 68, 500, 58, 8); g.fill();
    g.strokeStyle = 'rgba(62,230,255,.35)'; g.lineWidth = 3; g.beginPath(); g.roundRect(352, 470, 320, 196, 18); g.stroke();
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  })();
  var deck = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.92, D * 0.9), new THREE.MeshStandardMaterial({ map: kb, metalness: 0.4, roughness: 0.6 }));
  deck.rotation.x = -Math.PI / 2; deck.position.y = T + 0.002; laptop.add(deck);

  // lid hinged at the back edge
  var hinge = new THREE.Group(); hinge.position.set(0, T, -D / 2); laptop.add(hinge);
  var LH = 2.2, LT = 0.07;
  var lid = new THREE.Mesh(new THREE.BoxGeometry(W, LH, LT), metal);
  lid.position.set(0, LH / 2, -LT / 2); hinge.add(lid);
  var bezel = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.97, LH * 0.95), new THREE.MeshBasicMaterial({ color: 0x05070d }));
  bezel.position.set(0, LH / 2, 0.002); hinge.add(bezel);
  var SW = W * 0.9, SH = SW * 10 / 16;
  var screenMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  var screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), screenMat);
  screen.position.set(0, LH / 2 + 0.03, 0.004); hinge.add(screen);
  // soft glass reflection sweeping across the screen
  var glare = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, depthWrite: false }));
  glare.position.set(0, LH / 2 + 0.03, 0.006); hinge.add(glare);

  // glow pool under the laptop
  var pool = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d');
    var r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    r.addColorStop(0, 'rgba(62,230,255,0.5)'); r.addColorStop(.45, 'rgba(124,58,237,0.18)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, 256, 256);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    var m = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.rotation.x = -Math.PI / 2; m.position.y = -0.01; return m;
  })();
  laptop.add(pool);
  laptop.position.y = -0.9;

  /* ---------- screens ---------- */
  var loader = new THREE.TextureLoader();
  var textures = articles.map(function (a) {
    var img = a.querySelector('img');
    var t = loader.load(img.currentSrc || img.src, function () { if (!running) frame(performance.now()); });
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  });
  screenMat.map = textures[0]; screenMat.needsUpdate = true;

  /* ---------- state ---------- */
  var open = 0, openTarget = 0, active = 0, shown = 0, swap = 1, mx = 0, my = 0, tmx = 0, tmy = 0, spin = 0, spinTarget = 0;
  var running = false, visible = false, paused = !!opts.paused, raf = 0, t0 = performance.now();
  var poses = [-0.42, 0.42, -0.28, 0.3];

  function resize() {
    var r = canvas.getBoundingClientRect(); if (!r.width) return;
    renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
  }
  function frame(now) {
    var t = (now - t0) / 1000;
    var k = paused ? 1 : 0.07;
    open += (openTarget - open) * k;
    spin += (spinTarget - spin) * (paused ? 1 : 0.05);
    mx += (tmx - mx) * 0.06; my += (tmy - my) * 0.06;
    // swap the screenshot while the screen is dimmed
    if (active !== shown) { swap = Math.max(0, swap - (paused ? 1 : 0.12)); if (swap === 0) { shown = active; screenMat.map = textures[shown]; screenMat.needsUpdate = true; } }
    else swap = Math.min(1, swap + (paused ? 1 : 0.08));
    screenMat.color.setScalar(0.08 + 0.92 * swap * Math.min(1, open * 1.3));
    hinge.rotation.x = (1 - open) * (Math.PI / 2 - 0.02) - 0.22 * open; // closed: folded onto the deck
    rig.rotation.y = spin + mx * 0.25 + (paused ? 0 : Math.sin(t * 0.4) * 0.03);
    rig.rotation.x = 0.06 + my * 0.08;
    glare.position.x = Math.sin(t * 0.3 + spin) * SW * 0.4;
    camera.lookAt(0, 0.1, 0);
    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(frame);
  }
  function play() { if (running || paused || !visible || document.hidden) return; running = true; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  resize();
  window.addEventListener('resize', function () { resize(); if (!running) frame(performance.now()); }, { passive: true });
  window.addEventListener('pointermove', function (e) {
    tmx = (e.clientX / window.innerWidth - 0.5) * 2; tmy = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else play(); });
  new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) play(); else stop(); }).observe(canvas);
  frame(performance.now());

  return {
    // p: 0..1 how far the section has arrived; i: which project is in the middle of the screen
    set: function (p, i) {
      openTarget = Math.min(1, Math.max(0, p));
      if (i !== active && i >= 0 && i < textures.length) active = i;
      spinTarget = poses[active % poses.length];
      if (paused) frame(performance.now());
    },
    pause: function (v) { paused = v; if (v) { stop(); frame(performance.now()); } else play(); }
  };
}
