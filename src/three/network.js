import * as THREE from 'three';
import { createKit } from './kit.js';
import { measure, eased, mqMobile, reduceMotion as reduce } from '../lib/route.js';
import { clamp01, hash, outBack, outCubic } from '../lib/math.js';

// Les couleurs de la scène sont données telles quelles (mêmes valeurs que le CSS).
THREE.ColorManagement.enabled = false;

/* Lance la scène 3D du réseau dans le canvas fourni.
   Renvoie une fonction d'arrêt, ou null si WebGL n'est pas disponible. */
export function startNetwork(canvas) {
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

  // Écouteurs enregistrés pour pouvoir tout retirer à l'arrêt
  var listeners = [], alive = true, raf = 0;
  function on(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    listeners.push(function () { target.removeEventListener(type, fn, opts); });
  }

  /* ------------------------------------------------------------------
     Matériaux et couleurs de la scène (thème sombre)
  ------------------------------------------------------------------ */
  var THEMES = {
    dark:  { bg: 0x0B1020, body: 0x1C2644, hi: 0x36446F, edge: 0xA6B6DC, dot: 0x46537F, link: 0x3A4772,
             amber: 0xFFB224, alert: 0xFF5A4F, sky: 0xC8D6FF, ground: 0x0B1020, hemi: 0.95, sun: 0.75 }
  };
  var M = {
    body:  new THREE.MeshLambertMaterial(),
    hi:    new THREE.MeshLambertMaterial(),
    amber: new THREE.MeshBasicMaterial(),
    alert: new THREE.MeshBasicMaterial(),
    edge:  new THREE.LineBasicMaterial(),
    dot:   new THREE.PointsMaterial({ size: 2, sizeAttenuation: false })
  };
  var amberClones = [];                  // matériaux ambre transparents (ondes RA)
  var cLink = new THREE.Color(), cAmber = new THREE.Color();

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 10, 50);
  var camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
  var hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
  var sun = new THREE.DirectionalLight(0xffffff, 0.7);
  sun.position.set(6, 10, 8);
  scene.add(hemi, sun);

  function applyTheme() {
    var T = THEMES.dark;
    renderer.setClearColor(T.bg, 1);
    scene.fog.color.setHex(T.bg);
    M.body.color.setHex(T.body); M.hi.color.setHex(T.hi);
    M.amber.color.setHex(T.amber); M.alert.color.setHex(T.alert);
    M.edge.color.setHex(T.edge); M.dot.color.setHex(T.dot);
    amberClones.forEach(function (m) { m.color.setHex(T.amber); });
    cLink.setHex(T.link); cAmber.setHex(T.amber);
    hemi.color.setHex(T.sky); hemi.groundColor.setHex(T.ground);
    // × π : les versions récentes de three.js mesurent l'intensité en unités physiques
    hemi.intensity = T.hemi * Math.PI; sun.intensity = T.sun * Math.PI;
  }

  var kit = createKit(M), Kit = kit.Kit, piece = kit.piece, inner = kit.inner;

  /* ------------------------------------------------------------------
     Le réseau : un commutateur central, cinq machines, cinq câbles
  ------------------------------------------------------------------ */
  var NODES = [[-9, 2], [-3, -8], [6, -11], [12, -2], [5, 7]];
  var CABLES = [
    [[-1.6, 0.2], [-9, 0.2], [-9, 2]],
    [[-0.8, -0.5], [-0.8, -8], [-3, -8]],
    [[0.8, -0.5], [0.8, -11], [6, -11]],
    [[1.6, -0.2], [12, -0.2], [12, -2]],
    [[0.4, 0.5], [0.4, 7], [5, 7]]
  ];
  var updaters = [];                      // animations propres à chaque machine

  // Sol : grille de points
  (function () {
    var R = 40, pts = [];
    for (var x = -R; x <= R; x++) for (var z = -R; z <= R; z++) pts.push(x, 0, z);
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    scene.add(new THREE.Points(g, M.dot));
  })();

  // Commutateur
  var gSwitch = new THREE.Group(); scene.add(gSwitch);
  var leds = [];
  (function () {
    var k = new Kit();
    k.box(3.2, 0.5, 1.0, 'body', 0, 0.25, 0);
    for (var i = 0; i < 8; i++) k.box(0.24, 0.2, 0.04, 'hi', -1.26 + i * 0.36, 0.19, 0.51);
    k.build(gSwitch);
    var lg = new THREE.BoxGeometry(0.1, 0.05, 0.03);
    for (var j = 0; j < 8; j++) {
      var led = new THREE.Mesh(lg, M.amber);
      led.position.set(-1.26 + j * 0.36, 0.39, 0.51);
      gSwitch.add(led); leds.push(led);
    }
  })();

  // Câbles et paquets
  var cables = CABLES.map(function (path, ci) {
    var mat = new THREE.MeshBasicMaterial();
    var segs = [], total = 0;
    for (var i = 0; i < path.length - 1; i++) {
      var a = path[i], b = path[i + 1];
      var dx = b[0] - a[0], dz = b[1] - a[1], len = Math.sqrt(dx * dx + dz * dz);
      var geo = new THREE.BoxGeometry(1, 0.03, 0.08); geo.translate(0.5, 0, 0);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(a[0], 0.02, a[1]);
      mesh.rotation.y = Math.atan2(-dz, dx);
      mesh.scale.x = 0.0001;
      scene.add(mesh);
      segs.push({ a: a, dx: dx, dz: dz, len: len, cum: total, mesh: mesh });
      total += len;
    }
    var packets = [0, 1].map(function (j) {
      var p = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.17), M.amber);
      p.visible = false; scene.add(p);
      return { mesh: p, u: hash(ci * 7 + j), dir: j ? -1 : 1 };
    });
    return { mat: mat, segs: segs, total: total, packets: packets };
  });
  function cablePoint(c, u, out) {
    var d = u * c.total;
    for (var i = 0; i < c.segs.length; i++) {
      var s = c.segs[i];
      if (d <= s.cum + s.len || i === c.segs.length - 1) {
        var f = (d - s.cum) / s.len;
        out.set(s.a[0] + s.dx * f, 0.12, s.a[1] + s.dz * f);
        return;
      }
    }
  }

  var nodes = NODES.map(function (p) {
    var g = new THREE.Group(); g.position.set(p[0], 0, p[1]); g.scale.setScalar(0.0001);
    scene.add(g); return g;
  });

  // 1. Serveur Linux autogéré : une tour recyclée, sa passerelle, le service hébergé
  (function (g) {
    var k = new Kit();
    k.box(1.1, 2.3, 2.1, 'body', -0.7, 1.15, -0.2);
    k.box(0.8, 0.26, 0.05, 'hi', -0.7, 1.92, 0.86);
    k.box(0.8, 0.26, 0.05, 'hi', -0.7, 1.58, 0.86);
    for (var i = 0; i < 6; i++) k.box(0.8, 0.045, 0.04, 'hi', -0.7, 0.3 + i * 0.13, 0.86, null, false);
    k.box(0.09, 0.09, 0.04, 'amber', -0.38, 2.15, 0.86, null, false);
    k.box(1.15, 0.26, 0.78, 'body', 1.25, 0.13, 0.5);
    k.cyl(0.035, 0.8, 'hi', 0.82, 0.62, 0.2, 8);
    k.cyl(0.035, 0.8, 'hi', 1.68, 0.62, 0.2, 8);
    for (var j = 0; j < 3; j++) k.box(0.07, 0.05, 0.03, 'amber', 0.95 + j * 0.16, 0.15, 0.9, null, false);
    k.ribbon(-0.15, 0.5, 0.68, 0.5);
    g = inner(g, -1.0, -0.4);                 // la passerelle se pose sur l'arrivée du câble
    k.build(g);
    var cube = piece(new THREE.BoxGeometry(0.58, 0.58, 0.58), M.body, true);
    g.add(cube);
    updaters.push(function (t) {
      cube.position.set(-0.7, 3.15 + Math.sin(t * 1.4) * 0.1, -0.2);
      cube.rotation.set(t * 0.5, t * 0.8, 0);
    });
  })(nodes[0]);

  // 2. Infrastructure PXE : un serveur déploie le système sur quatre postes sans disque
  (function (g) {
    g = inner(g, 0, 1.3);                     // le serveur se pose sur l'arrivée du câble
    var k = new Kit(), sz = -1.3;
    for (var u = 0; u < 3; u++) {
      k.box(2.4, 0.42, 1.3, 'body', 0, 0.21 + u * 0.46, sz);
      k.box(1.5, 0.2, 0.04, 'hi', -0.3, 0.21 + u * 0.46, sz + 0.66);
      k.box(0.08, 0.08, 0.04, 'amber', 0.95, 0.21 + u * 0.46, sz + 0.66, null, false);
    }
    var bars = [], pk = [], bg = new THREE.BoxGeometry(0.7, 0.07, 0.02); bg.translate(0.35, 0, 0);
    [-54, -18, 18, 54].forEach(function (deg, i) {
      var a = deg * Math.PI / 180, cx = Math.sin(a) * 2.4, cz = -0.9 + Math.cos(a) * 2.4;
      k.ribbon(0, sz + 0.65, cx, cz);
      var mk = new Kit();
      mk.box(0.5, 0.04, 0.3, 'body', 0, 0.02, 0);
      mk.box(0.07, 0.42, 0.07, 'body', 0, 0.23, -0.02);
      mk.box(0.98, 0.64, 0.06, 'body', 0, 0.76, 0);
      mk.box(0.84, 0.5, 0.02, 'hi', 0, 0.76, 0.035, null, false);
      var mg = mk.build(g); mg.position.set(cx, 0, cz); mg.rotation.y = a;
      var bar = new THREE.Mesh(bg, M.amber); bar.position.set(-0.35, 0.62, 0.055); mg.add(bar); bars.push(bar);
      var p = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), M.amber); g.add(p);
      pk.push({ mesh: p, x: cx, z: cz });
    });
    k.build(g);
    updaters.push(function (t) {
      var c = t % 9;
      for (var i = 0; i < 4; i++) {
        var f = clamp01((c - i * 1.6) / 1.6);
        bars[i].scale.x = Math.max(0.0001, c > 8.4 ? 0.0001 : f);
        var p = pk[i], on = f > 0 && f < 1, m = (f * 3) % 1;
        p.mesh.visible = on;
        if (on) p.mesh.position.set(p.x * m, 0.12, (sz + 0.65) + (p.z - (sz + 0.65)) * m);
      }
    });
  })(nodes[1]);

  // 3. Maquette IPv6 : quatre routeurs maillés, annonces RA en ondes
  (function (g) {
    var k = new Kit(), R = 1.9, pos = [[R, 0], [0, R], [-R, 0], [0, -R]];
    pos.forEach(function (p) {
      k.cyl(0.72, 0.36, 'body', p[0], 0.18, p[1], 36);
      k.box(1.0, 0.03, 0.12, 'hi', p[0], 0.375, p[1], null, false);
      k.box(0.12, 0.03, 1.0, 'hi', p[0], 0.375, p[1], null, false);
      k.box(0.09, 0.07, 0.03, 'amber', p[0], 0.2, p[1] + 0.725, null, false);
    });
    var links = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]];
    links.forEach(function (l) { k.ribbon(pos[l[0]][0], pos[l[0]][1], pos[l[1]][0], pos[l[1]][1]); });
    k.build(g);
    var pk = links.map(function (l, i) {
      var p = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), M.amber); g.add(p);
      var L = Math.sqrt(Math.pow(pos[l[0]][0] - pos[l[1]][0], 2) + Math.pow(pos[l[0]][1] - pos[l[1]][1], 2));
      return { mesh: p, a: pos[l[0]], b: pos[l[1]], ph: hash(i + 40), sp: 0.22 + hash(i + 50) * 0.12, m: 0.8 / L };
    });
    var rg = new THREE.RingGeometry(0.76, 0.82, 56); rg.rotateX(-Math.PI / 2);
    var rings = pos.map(function (p, i) {
      var mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false });
      amberClones.push(mat);
      var r = new THREE.Mesh(rg, mat); r.position.set(p[0], 0.04, p[1]); g.add(r);
      return { mesh: r, mat: mat, ph: i * 0.25 };
    });
    updaters.push(function (t) {
      pk.forEach(function (p) {
        var u = (t * p.sp + p.ph) % 1;
        p.mesh.position.set(p.a[0] + (p.b[0] - p.a[0]) * u, 0.12, p.a[1] + (p.b[1] - p.a[1]) * u);
        p.mesh.visible = u > p.m && u < 1 - p.m;      // masqué à l'intérieur des routeurs
      });
      rings.forEach(function (r) {
        var u = (t * 0.35 + r.ph) % 1;
        r.mesh.scale.setScalar(1 + u * 0.95);
        r.mat.opacity = (1 - u) * 0.75;
      });
    });
  })(nodes[2]);

  // 4. Lab sécurité : un hôte derrière son pare-feu, un seul port ouvert
  (function (g) {
    var k = new Kit(), wz = 1.2;
    k.box(1.4, 1.4, 1.4, 'body', 0, 0.7, -1.0);
    k.box(1.0, 0.5, 0.04, 'hi', 0, 0.9, -0.29);
    k.box(0.09, 0.09, 0.04, 'amber', 0.45, 0.3, -0.29, null, false);
    for (var r = 0; r < 5; r++) {
      var odd = r % 2, n = odd ? 6 : 7, x0 = odd ? -1.55 : -1.86;
      for (var c = 0; c < n; c++) {
        if (r === 2 && c === 3) continue;                    // le port autorisé
        k.box(0.6, 0.28, 0.3, 'hi', x0 + c * 0.62, 0.15 + r * 0.3, wz);
      }
    }
    k.build(g);
    var pg = new THREE.BoxGeometry(0.17, 0.17, 0.17), T = 3.4;
    var pk = [0, 1, 2, 3, 4, 5].map(function (i) {
      var p = new THREE.Mesh(pg, M.amber); g.add(p); return p;
    });
    updaters.push(function (t) {
      pk.forEach(function (p, i) {
        var tt = t + i * (T / 6), c = Math.floor(tt / T), u = (tt % T) / T;
        var pass = (i + c) % 3 === 0;
        var xt = pass ? 0 : (hash(i * 13 + c) * 3.2 - 1.6), yt = pass ? 0.75 : 0.25 + hash(i * 29 + c * 3) * 1.1;
        if (!pass && Math.abs(xt) < 0.45 && Math.abs(yt - 0.75) < 0.3) xt += 0.8;
        var s = 1;
        if (u < 0.55) {
          var a = u / 0.55;
          p.material = M.amber;
          p.position.set(xt * (1.35 - 0.35 * a), yt + (1 - a) * 0.4, 4.6 + (wz + 0.26 - 4.6) * a);
          s = clamp01(a * 6);
        } else if (pass) {
          var b = (u - 0.55) / 0.45;
          p.material = M.amber;
          p.position.set(0, 0.75, (wz + 0.26) + (-0.35 - (wz + 0.26)) * clamp01(b / 0.7));
          s = 1 - clamp01((b - 0.7) / 0.3);
        } else {
          var v = (u - 0.55) / 0.45;
          p.material = M.alert;
          p.position.set(xt, Math.max(0.09, yt - v * v * 3.2), wz + 0.26 + Math.sin(clamp01(v * 2) * Math.PI / 2) * 0.55);
          s = 1 - clamp01((v - 0.6) / 0.4);
        }
        p.scale.setScalar(Math.max(0.0001, s));
      });
    });
  })(nodes[3]);

  // 5. Analyseur de logs : un balayage ligne à ligne, les lignes suspectes sont extraites
  (function (g) {
    var base = new Kit();
    base.box(1.5, 0.1, 0.8, 'body', 0, 0.05, 0);
    base.box(0.14, 0.5, 0.14, 'body', 0, 0.3, -0.05);
    base.build(g);
    var tilt = new THREE.Group(); tilt.position.set(0, 0.5, 0); tilt.rotation.x = -0.13; g.add(tilt);
    var k = new Kit();
    k.box(2.6, 3.0, 0.1, 'body', 0, 1.5, 0);
    var W = [1.9, 1.3, 2.1, 1.6, 0.9, 2.0, 1.4, 1.8, 1.1, 2.2, 1.5, 1.7, 1.0], bad = { 2: 1, 6: 1, 9: 1 }, sus = [];
    W.forEach(function (w, r) {
      var y = 2.72 - r * 0.2;
      if (bad[r]) {
        var m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.09, 0.04), M.hi);
        m.position.set(-1.12 + w / 2, y, 0.07); tilt.add(m); sus.push({ mesh: m, y: y, z: 0.07 });
      } else {
        k.box(w, 0.08, 0.03, 'hi', -1.12 + w / 2, y, 0.065, null, false);
      }
    });
    k.build(tilt);
    var scan = new THREE.Mesh(new THREE.BoxGeometry(2.74, 0.035, 0.05), M.amber); tilt.add(scan);
    updaters.push(function (t, dt) {
      var c = t % 6.5, u = clamp01(c / 4.2), y = 2.92 - u * 2.84;
      scan.position.set(0, y, 0.1); scan.visible = c < 4.2;
      sus.forEach(function (s) {
        var hit = c < 6.1 && y < s.y;
        s.mesh.material = hit ? M.alert : M.hi;
        s.z += ((hit ? 0.5 : 0.07) - s.z) * Math.min(1, dt * 7);
        s.mesh.position.z = s.z;
      });
    });
  })(nodes[4]);

  /* ------------------------------------------------------------------
     Caméra : une image clé par étape. R = rayon à cadrer [large, étroit],
     s = décalage de l'objet à l'écran pour laisser la place au texte.
  ------------------------------------------------------------------ */
  function V(x, y, z) { return new THREE.Vector3(x, y, z); }
  function at(i, x, y, z) { return V(NODES[i][0] + x, y, NODES[i][1] + z); }
  var KF = [
    { tg: V(1.2, 0.3, -1.6),   dir: V(0.36, 0.36, 0.86),  R: [8.6, 6.8], sx: [0.17, 0.03], sy: [-0.2, -0.3] },
    { tg: at(0, -0.8, 1.45, -0.4), dir: V(0.56, 0.3, 0.77), R: [3.1, 2.9], sx: [0.17, 0], sy: [0.02, -0.2] },
    { tg: at(1, 0, 0.7, 1.2),  dir: V(-0.34, 0.44, 0.83), R: [3.2, 3.0], sx: [0.17, 0],  sy: [0, -0.2] },
    { tg: at(2, 0, 0.2, 0),    dir: V(0.26, 0.6, 0.76),   R: [3.7, 3.1], sx: [0.19, 0],  sy: [0, -0.2] },
    { tg: at(3, 0, 0.75, 1.0), dir: V(0.3, 0.48, 0.82),   R: [3.5, 3.2], sx: [0.17, 0],  sy: [0, -0.2] },
    { tg: at(4, 0, 1.9, 0),    dir: V(0.4, 0.22, 0.89),   R: [2.7, 2.5], sx: [0.18, 0],  sy: [0, -0.2] },
    { tg: V(0.5, 0.4, -0.5),   dir: V(-0.5, 0.34, 0.8),   R: [8.2, 5.4], sx: [0.27, 0],  sy: [0.09, -0.18] }
  ];
  KF.forEach(function (k) { k.dir.normalize(); });

  var W = 0, H = 0, aspect = 1, mobile = false;
  var des = { tg: V(0, 0, 0), dir: V(0, 0, 1), dist: 20, sx: 0, sy: 0, R: 5 };
  var cur = null;
  function desired(e) {
    var A = KF[e.i], B = KF[e.i + 1] || A, f = e.f, m = mobile ? 1 : 0;
    var ux = mobile ? 0.92 : 0.5, uy = mobile ? 0.44 : 0.78;
    var k = Math.tan(camera.fov * Math.PI / 360) * Math.min(uy, aspect * ux);
    var R = A.R[m] + (B.R[m] - A.R[m]) * f;
    des.tg.lerpVectors(A.tg, B.tg, f);
    des.dir.lerpVectors(A.dir, B.dir, f).normalize();
    des.R = R;
    des.dist = R / k + Math.sin(Math.PI * f) * (mobile ? 7 : 5);
    des.sx = A.sx[m] + (B.sx[m] - A.sx[m]) * f;
    des.sy = A.sy[m] + (B.sy[m] - A.sy[m]) * f;
  }

  // Sur téléphone, l'accueil cadre le réseau dans l'espace libre entre le menu et le titre
  var heroTitle = document.querySelector('.hero h1');
  function fitHero() {
    if (!mobile || !heroTitle || !H) return;
    var navH = 56, top = heroTitle.getBoundingClientRect().top + window.scrollY;
    var free = Math.max(80, top - navH);
    KF[0].sy[1] = (navH + free / 2) / H - 0.5;
    KF[0].R[1] = 5.4 * Math.min(1.7, Math.max(1, 0.44 / (free / H * 0.9)));
  }

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (w === W && h === H) return;
    W = w; H = h; aspect = w / h; mobile = mqMobile.matches;
    var pr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    M.dot.size = 1.6 * pr;
    camera.fov = mobile ? 42 : 35;
    camera.aspect = aspect;
    measure();
    fitHero();
  }

  // Parallaxe : souris sur ordinateur, inclinaison du téléphone quand elle est disponible
  var px = 0, py = 0, spx = 0, spy = 0, tilt0 = null;
  on(window, 'pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    px = (e.clientX / window.innerWidth) * 2 - 1;
    py = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  if (!reduce) {
    on(window, 'deviceorientation', function (e) {
      if (e.gamma == null || e.beta == null) return;
      if (!tilt0) tilt0 = { g: e.gamma, b: e.beta };
      px = Math.max(-1, Math.min(1, (e.gamma - tilt0.g) / 25));
      py = Math.max(-1, Math.min(1, (e.beta - tilt0.b) / 25));
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Boucle de rendu
  ------------------------------------------------------------------ */
  var last = performance.now(), time = 0, boot = reduce ? 99 : 0, v3 = new THREE.Vector3();
  var camPos = new THREE.Vector3();

  function frame() {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    resize();
    var now = performance.now(), dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!reduce) { time += dt; boot += dt; } else { time = 3.1; }

    var e = eased();
    desired(e);
    if (!cur) cur = { tg: des.tg.clone(), dir: des.dir.clone(), dist: des.dist, sx: des.sx, sy: des.sy, R: des.R };
    var k = reduce ? 1 : 1 - Math.exp(-dt * 4.5);
    cur.tg.lerp(des.tg, k); cur.dir.lerp(des.dir, k).normalize();
    cur.dist += (des.dist - cur.dist) * k; cur.R += (des.R - cur.R) * k;
    cur.sx += (des.sx - cur.sx) * k; cur.sy += (des.sy - cur.sy) * k;

    var kp = 1 - Math.exp(-dt * 3);
    spx += (px - spx) * kp; spy += (py - spy) * kp;
    var sway = reduce ? 0 : Math.sin(time * 0.35) * 0.035;
    var theta = Math.atan2(cur.dir.x, cur.dir.z) + spx * 0.1 + sway;
    var phi = Math.asin(cur.dir.y) + spy * 0.05;
    phi = Math.max(0.08, Math.min(1.3, phi));
    camPos.set(Math.cos(phi) * Math.sin(theta), Math.sin(phi), Math.cos(phi) * Math.cos(theta))
      .multiplyScalar(cur.dist).add(cur.tg);
    camera.position.copy(camPos);
    camera.lookAt(cur.tg);
    camera.setViewOffset(W, H, -cur.sx * W, -cur.sy * H, W, H);
    scene.fog.near = cur.dist + cur.R * 0.5;
    scene.fog.far = scene.fog.near + 36;

    // Démarrage : le commutateur, puis les câbles, puis les machines
    gSwitch.scale.setScalar(Math.max(0.0001, outBack((boot - 0.15) / 0.6)));
    var online = boot > 2.5;
    cables.forEach(function (c, i) {
      var prog = outCubic((boot - 0.6 - i * 0.09) / 0.95) * c.total;
      c.segs.forEach(function (s) { s.mesh.scale.x = Math.max(0.0001, clamp01((prog - s.cum) / s.len) * s.len); });
      nodes[i].scale.setScalar(Math.max(0.0001, outBack((boot - 1.35 - i * 0.14) / 0.6)));
      // Le câble du projet en cours s'allume ; au contact, tout le réseau est actif
      var w = Math.max(clamp01(1 - Math.abs(e.v - (i + 1))), clamp01(e.v - 5));
      c.mat.color.copy(cLink).lerp(cAmber, w);
      c.packets.forEach(function (p) {
        p.mesh.visible = online;
        p.u = (p.u + dt * (1.6 + w * 2.6) / c.total) % 1;
        cablePoint(c, p.dir > 0 ? p.u : 1 - p.u, v3);
        p.mesh.position.copy(v3);
      });
    });
    leds.forEach(function (l, i) { l.visible = Math.sin(time * (3 + i * 0.7) + i * 2.1) > -0.35; });
    for (var u = 0; u < updaters.length; u++) updaters[u](time, dt);

    renderer.render(scene, camera);
  }

  applyTheme();
  on(window, 'resize', resize);
  on(window, 'load', fitHero);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (alive) fitHero(); });
  resize();
  frame();

  return function stop() {
    alive = false;
    cancelAnimationFrame(raf);
    listeners.forEach(function (off) { off(); });
    renderer.dispose();
  };
}
