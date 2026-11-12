/* DK Solutions immersive background: a 3D corridor of glowing browser-window frames with
   floating low-poly shapes. The camera flies down the corridor as you scroll the page, so every
   section sits somewhere along one continuous 3D journey. Rendered at 1x pixel ratio behind
   a dark scrim, paused when the tab is hidden or motion is paused. */
import * as THREE from 'three';
import { RoomEnvironment } from './../vendor/three/RoomEnvironment.js';

export function start(canvas, opts) {
  opts = opts || {};
  var small = window.matchMedia('(max-width: 760px)').matches;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: 'low-power' }); }
  catch (e) { return null; }
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060c, 0.034);
  var pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  var l1 = new THREE.PointLight(0x3ee6ff, 30, 30); scene.add(l1);
  var l2 = new THREE.PointLight(0x8b6cff, 24, 30); scene.add(l2);

  var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 80);

  /* corridor of rounded browser-window frames */
  var GAP = 7, N = small ? 16 : 24, LEN = GAP * N;
  function frameShape(w, h, r) {
    var s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return new THREE.BufferGeometry().setFromPoints(s.getPoints(6));
  }
  var fw = small ? 9 : 16, fh = small ? 14 : 9.5;
  var frameGeo = frameShape(fw, fh, 0.9);
  var barGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-fw / 2, fh / 2 - 1.1, 0), new THREE.Vector3(fw / 2, fh / 2 - 1.1, 0)]);
  var cA = new THREE.Color(0x3ee6ff), cB = new THREE.Color(0x8b6cff);
  var frames = [];
  for (var i = 0; i < N; i++) {
    var col = cA.clone().lerp(cB, (i % 4) / 3);
    var mat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.85 });
    var g = new THREE.Group();
    g.add(new THREE.LineLoop(frameGeo, mat));
    g.add(new THREE.Line(barGeo, mat));
    g.position.z = -i * GAP;
    g.rotation.z = (i % 2 ? 1 : -1) * 0.04;
    scene.add(g); frames.push(g);
  }

  /* floating low-poly solids along the corridor walls */
  var geos = [new THREE.IcosahedronGeometry(1, 0), new THREE.OctahedronGeometry(1, 0), new THREE.TorusGeometry(0.8, 0.28, 8, 24), new THREE.DodecahedronGeometry(0.9, 0)];
  var mats = [
    new THREE.MeshPhysicalMaterial({ color: 0x1a2140, metalness: 0.9, roughness: 0.25, clearcoat: 1, flatShading: true }),
    new THREE.MeshPhysicalMaterial({ color: 0x0e7490, metalness: 0.6, roughness: 0.2, clearcoat: 1, flatShading: true, emissive: 0x062a33 }),
    new THREE.MeshPhysicalMaterial({ color: 0x4c1d95, metalness: 0.7, roughness: 0.3, clearcoat: 1, flatShading: true, emissive: 0x150833 })
  ];
  var solids = [], S = small ? 10 : 22;
  for (var k = 0; k < S; k++) {
    var m = new THREE.Mesh(geos[k % geos.length], mats[k % mats.length]);
    var side = k % 2 ? 1 : -1;
    m.position.set(side * (fw / 2 + 1.5 + (k * 37 % 30) / 10), ((k * 53 % 70) / 10) - 3.5, -((k + 0.5) / S) * LEN);
    var sc = 0.6 + (k * 29 % 10) / 10; m.scale.setScalar(sc);
    m.userData.spin = new THREE.Vector3(((k * 7) % 5 + 1) * 0.001, ((k * 11) % 5 + 1) * 0.0015, 0);
    m.userData.y0 = m.position.y;
    scene.add(m); solids.push(m);
  }

  /* star dust */
  var P = small ? 160 : 420, pos = new Float32Array(P * 3);
  for (var p = 0; p < P; p++) { pos[p * 3] = (Math.random() - .5) * 40; pos[p * 3 + 1] = (Math.random() - .5) * 26; pos[p * 3 + 2] = -Math.random() * (LEN + 20) + 10; }
  var sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xa9f4ff, size: 0.06, transparent: true, opacity: 0.8, depthWrite: false })));

  /* state */
  var target = 0, cur = 0, mx = 0, my = 0, tmx = 0, tmy = 0;
  var running = false, paused = !!opts.paused, raf = 0, t0 = performance.now();
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  function frame(now) {
    var t = (now - t0) / 1000;
    cur += (target - cur) * (paused ? 1 : 0.06);
    mx += (tmx - mx) * 0.04; my += (tmy - my) * 0.04;
    var z = 6 - cur * (LEN - 14);
    camera.position.set(mx * 1.2 + Math.sin(cur * 6.28) * 1.4, my * 0.7 + Math.cos(cur * 4.2) * 0.6, z);
    camera.rotation.set(-my * 0.04, -mx * 0.06, Math.sin(cur * 3.14) * 0.06);
    l1.position.set(-4, 3, z - 6); l2.position.set(4, -2, z - 14);
    if (!paused) {
      solids.forEach(function (s, i) { s.rotation.x += s.userData.spin.x; s.rotation.y += s.userData.spin.y; s.position.y = s.userData.y0 + Math.sin(t * 0.6 + i) * 0.25; });
      frames.forEach(function (f, i) { f.rotation.z = (i % 2 ? 1 : -1) * 0.04 + Math.sin(t * 0.2 + i) * 0.02; });
    }
    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(frame);
  }
  function play() { if (running || paused || document.hidden) return; running = true; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  resize();
  window.addEventListener('resize', function () { resize(); if (!running) frame(performance.now()); }, { passive: true });
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', function (e) { tmx = (e.clientX / window.innerWidth - .5) * 2; tmy = (e.clientY / window.innerHeight - .5) * 2; }, { passive: true });
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else play(); });
  frame(performance.now()); play();

  return {
    setProgress: function (p) { target = p; if (paused) frame(performance.now()); },
    pause: function (v) { paused = v; if (v) { stop(); frame(performance.now()); } else play(); }
  };
}
