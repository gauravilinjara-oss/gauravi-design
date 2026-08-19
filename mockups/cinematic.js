/* ═══════════════════════════════════════════════════════════════════
   cinematic.js — shared cinematic-motion layer for the whole portfolio.
   Hand-written, no build step. Pairs with cinematic.css.

   Opt-in per page via <body data-cine="…"> space-separated flags:
     hero      → choreographed GSAP hero entrance (waits for the ink wipe)
                 · h1 gets a masked line/word split unless the container
                   opts out with data-cine-hero="noh1"
     parallax  → scroll-scrubbed depth on [data-prlx] + auto-tagged media
                 (.hero-stage, .visual img, .media .cover) — subtle drift
     tilt      → cursor-tracked 3D tilt + specular light sheen on
                 [data-tilt] and auto targets (.case .media, .wcard …)
     magnet    → magnetic pull on .ink-btn / [data-magnet]
     grain     → fixed WebGL film-grain + drifting light shader overlay
                 (skipped automatically if the page runs its own fixed GL)
     motes     → Three.js dust-mote field with real depth, inside the
                 element marked [data-motes] (or fixed if data-motes="fixed")
     reveals   → GSAP-staggered reveal for [data-rv] groups (pages that
                 have no reveal system of their own, e.g. blog)

   Everything respects prefers-reduced-motion (module bails out — nothing
   is ever hidden by CSS, all initial states are set at runtime), and
   pointer-driven effects skip coarse pointers. GSAP + ScrollTrigger are
   expected on the page (CDN tags) — the module fails soft without them.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var body = document.body;
  var flags = (body.getAttribute('data-cine') || '').split(/[\s,]+/).filter(Boolean);
  if (!flags.length) return;
  function has(f) { return flags.indexOf(f) !== -1; }

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = matchMedia('(pointer: coarse)').matches;
  var isCaseStudy = body.classList.contains('case-study');
  if (reduce) return;                       // content is never pre-hidden, so this is safe

  var gsap = window.gsap, ST = window.ScrollTrigger;
  if (!gsap) return;                        // fail soft — page works untouched
  if (ST) gsap.registerPlugin(ST);

  var EASE = 'cubic-bezier(.22,1,.36,1)';   // tokens.css --ease
  var EXPO = 'expo.out';

  /* keep ScrollTrigger in lockstep with Lenis if smooth-scroll.js beat us here */
  if (ST && window.__lenis && !window.__cineLenisBridged) {
    window.__cineLenisBridged = true;
    window.__lenis.on('scroll', ST.update);
  }

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.defer = true; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  /* ── when to start the hero: after the ink wipe if present ─────────── */
  function onRevealed(fn) {
    var fired = false;
    function go() { if (fired) return; fired = true; fn(); }
    if (document.getElementById('pgx')) {
      document.addEventListener('pgx:revealed', go, { once: true });
      setTimeout(go, 2400);                 // safety if transition.js ever fails
    } else if (document.readyState === 'complete' || document.readyState === 'interactive') {
      requestAnimationFrame(go);
    } else {
      document.addEventListener('DOMContentLoaded', function () { requestAnimationFrame(go); });
    }
  }

  /* ── masked word split (preserves inline elements like .accent/.a) ─── */
  function splitWords(el) {
    if (!el || el.dataset.cineSplit) return [];
    el.dataset.cineSplit = '1';
    el.setAttribute('data-split', '1');     // tells page-level splitters to skip
    var tokens = [];
    function wrapToken(node) {
      var mask = document.createElement('span'); mask.className = 'cn-m';
      var word = document.createElement('span'); word.className = 'cn-w';
      mask.appendChild(word); word.appendChild(node);
      tokens.push(word);
      return mask;
    }
    function walk(parent) {
      var kids = [].slice.call(parent.childNodes);
      kids.forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); }
            else { frag.appendChild(wrapToken(document.createTextNode(p))); }
          });
          parent.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !/^(BR)$/.test(n.tagName)) {
          /* keep accent spans whole — they animate as one token */
          if (n.childElementCount === 0 && n.textContent.trim().split(/\s+/).length <= 3) {
            parent.replaceChild(wrapToken(n.cloneNode(true)), n);
          } else { walk(n); }
        }
      });
    }
    walk(el);
    return tokens;
  }

  /* ═══ HERO — choreographed entrance ══════════════════════════════════ */
  if (has('hero')) (function () {
    var host = document.querySelector('[data-cine-hero]');
    if (!host) return;
    var opts = host.getAttribute('data-cine-hero') || '';
    var noH1 = /noh1/.test(opts);

    var SEQ = 'h1,h2,.eyebrow,.kick,.kicker-row,.lede,.bintro,.count,.proof,.cta-row,.metrics,.hero-stage,.qsub,p';
    var seen = [], els = [];
    [].forEach.call(host.querySelectorAll(SEQ), function (el) {
      if (els.length >= 9) return;
      if (noH1 && /^H1$/.test(el.tagName)) return;
      /* skip elements nested inside an element we already track */
      for (var i = 0; i < els.length; i++) if (els[i].contains(el)) return;
      if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return;
      els.push(el);
    });
    if (!els.length) return;

    var h1 = noH1 ? null : els.filter(function (e) { return /^H[12]$/.test(e.tagName); })[0];
    var words = h1 ? splitWords(h1) : [];
    var rest = els.filter(function (e) { return e !== h1; });

    /* set initial states NOW (runtime, not CSS) so nothing flashes */
    if (words.length) gsap.set(words, { yPercent: 112, rotate: 2.2, transformOrigin: '0% 100%' });
    if (rest.length) gsap.set(rest, { autoAlpha: 0, y: 26 });

    onRevealed(function () {
      var tl = gsap.timeline({ defaults: { ease: EXPO } });
      if (words.length) tl.to(words, { yPercent: 0, rotate: 0, duration: 1.1, stagger: 0.05 }, 0.05);
      if (rest.length) tl.to(rest, {
        autoAlpha: 1, y: 0, duration: 0.9,
        stagger: 0.09, clearProps: 'visibility'
      }, words.length ? 0.38 : 0.08);
    });
  })();

  /* ═══ PARALLAX — scroll-scrubbed depth ═══════════════════════════════ */
  if (has('parallax') && ST) (function () {
    /* explicit: <el data-prlx="0.2"> → drifts yPercent = depth·60 over its scroll life */
    [].forEach.call(document.querySelectorAll('[data-prlx]'), function (el) {
      var d = parseFloat(el.getAttribute('data-prlx')) || 0.15;
      gsap.fromTo(el, { yPercent: d * 30 }, {
        yPercent: d * -30, ease: 'none',
        scrollTrigger: { trigger: el.parentElement || el, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      });
    });

    /* auto: media breathes inside its clipped frame — gentle Ken-Burns drift */
    var imgs = document.querySelectorAll('.visual img:not([data-prlx])');
    [].forEach.call(imgs, function (img) {
      var frame = img.closest('.visual') || img.parentElement;
      if (!frame || img.closest('[data-no-prlx]')) return;
      gsap.set(frame, { overflow: 'hidden' });
      gsap.fromTo(img, { yPercent: -3.5, scale: 1.07 }, {
        yPercent: 3.5, scale: 1.07, ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 0.7 }
      });
    });

    /* case hero device stage rises slightly slower than the page (depth) */
    var stage = document.querySelector('.hero-stage:not([data-prlx])');
    if (stage) {
      gsap.to(stage, {
        yPercent: -9, ease: 'none',
        scrollTrigger: { trigger: stage.closest('.hero') || stage, start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
    }
  })();

  /* ═══ TILT — cursor 3D tilt + specular sheen (dynamic light) ═════════ */
  if (has('tilt') && !coarse && !isCaseStudy) (function () {
    var AUTO = '.case .media, .wcard, .snap-card, [data-tilt]';
    var els = document.querySelectorAll(AUTO);
    [].forEach.call(els, function (el) {
      if (el.dataset.cineTilt) return; el.dataset.cineTilt = '1';
      el.classList.add('cn-tilt');
      var max = parseFloat(el.getAttribute('data-tilt-max')) || 2.6;
      gsap.set(el, { transformPerspective: 1100 });
      var rx = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3.out' });
      var ry = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3.out' });
      var lift = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        rx((0.5 - py) * max * 2); ry((px - 0.5) * max * 2); lift(-3);
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () { rx(0); ry(0); lift(0); });
    });
  })();

  /* ═══ MAGNET — buttons lean toward the cursor ════════════════════════ */
  if (has('magnet') && !coarse) (function () {
    var els = document.querySelectorAll('.ink-btn, [data-magnet]');
    [].forEach.call(els, function (el) {
      if (el.dataset.cineMag || el.closest('[data-no-magnet]')) return;
      el.dataset.cineMag = '1';
      var qx = gsap.quickTo(el, 'x', { duration: 0.9, ease: 'elastic.out(1,0.55)' });
      var qy = gsap.quickTo(el, 'y', { duration: 0.9, ease: 'elastic.out(1,0.55)' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * 0.22);
        qy((e.clientY - (r.top + r.height / 2)) * 0.30);
      });
      el.addEventListener('pointerleave', function () { qx(0); qy(0); });
    });
  })();

  /* ═══ REVEALS — staggered scroll-in for pages without their own ══════ */
  if (has('reveals') && ST) (function () {
    var els = document.querySelectorAll('[data-rv]');
    if (!els.length) return;
    gsap.set(els, { autoAlpha: 0, y: 30 });
    ST.batch(els, {
      start: 'top 88%', once: true,
      onEnter: function (batch) {
        gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.95, ease: EXPO, stagger: 0.1, clearProps: 'visibility' });
      }
    });
  })();

  /* ═══ GRAIN — WebGL film grain + drifting warm light overlay ═════════ */
  if (has('grain')) (function () {
    if (document.getElementById('cf-gl') || document.getElementById('fx')) return; // page runs its own GL
    var cv = document.createElement('canvas');
    cv.className = 'cn-grain'; cv.setAttribute('aria-hidden', 'true');
    body.appendChild(cv);
    var gl = cv.getContext('webgl', { alpha: true, antialias: false, depth: false });
    if (!gl) { cv.remove(); return; }

    var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var FS = [
      'precision mediump float;',
      'uniform vec2 u_res;uniform float u_t;uniform vec2 u_light;',
      'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'void main(){',
      '  vec2 uv=gl_FragCoord.xy/u_res;',
      '  float g=hash(gl_FragCoord.xy+fract(u_t)*vec2(17.0,29.0));',       // animated grain
      '  float grain=(g-0.5)*0.16;',
      '  float d=distance(uv,u_light);',                                    // drifting warm light
      '  float light=smoothstep(0.85,0.0,d)*0.05;',
      '  float vig=smoothstep(1.25,0.55,distance(uv,vec2(0.5)))*0.03;',
      '  gl_FragColor=vec4(vec3(0.5+grain)+vec3(1.0,0.87,0.68)*light, 0.5+light-vig+grain);',
      '}'
    ].join('\n');
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.remove(); return; }
    gl.useProgram(pr);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(pr, 'u_res'), uT = gl.getUniformLocation(pr, 'u_t'), uL = gl.getUniformLocation(pr, 'u_light');

    function size() { cv.width = innerWidth; cv.height = innerHeight; gl.viewport(0, 0, cv.width, cv.height); }
    size(); addEventListener('resize', size);

    var mx = 0.72, my = 0.2, tx = 0.72, ty = 0.2;
    if (!coarse) addEventListener('pointermove', function (e) {
      tx = e.clientX / innerWidth; ty = 1 - e.clientY / innerHeight;
    }, { passive: true });

    var run = true;
    document.addEventListener('visibilitychange', function () { run = !document.hidden; if (run) requestAnimationFrame(frame); });
    var last = 0;
    function frame(t) {
      if (!run) return;
      requestAnimationFrame(frame);
      if (t - last < 33) return; last = t;                    // 30fps is plenty for grain
      var drift = t * 0.00002;
      mx += (tx - mx) * 0.03; my += (ty - my) * 0.03;
      var sc = (window.pageYOffset || 0) / Math.max(1, body.scrollHeight - innerHeight);
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uT, t * 0.001);
      gl.uniform2f(uL, mx + Math.sin(drift * 7.0) * 0.08, my + 0.15 - sc * 0.3);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    requestAnimationFrame(frame);
  })();

  /* ═══ MOTES — Three.js dust catching the light (real depth) ══════════ */
  if (has('motes') && !coarse) (function () {
    var host = document.querySelector('[data-motes]');
    if (!host) return;
    var fixed = host.getAttribute('data-motes') === 'fixed';

    loadScript('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js').then(function () {
      var THREE = window.THREE; if (!THREE) return;
      var cv = document.createElement('canvas');
      cv.className = fixed ? 'cn-motes cn-motes-fixed' : 'cn-motes';
      cv.setAttribute('aria-hidden', 'true');
      if (fixed) { body.appendChild(cv); } else {
        if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
        host.appendChild(cv);
      }

      var renderer;
      try { renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: false }); }
      catch (e) { cv.remove(); return; }
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));

      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60);
      camera.position.z = 12;

      var N = fixed ? 80 : 64;
      var pos = new Float32Array(N * 3), sz = new Float32Array(N), ph = new Float32Array(N), warm = new Float32Array(N);
      for (var i = 0; i < N; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 26;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
        pos[i * 3 + 2] = Math.random() * -22;                  // depth spread
        sz[i] = 0.3 + Math.random() * 1.05;
        ph[i] = Math.random() * Math.PI * 2;
        warm[i] = Math.random();
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
      geo.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
      geo.setAttribute('aWarm', new THREE.BufferAttribute(warm, 1));

      var mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uT: { value: 0 } },
        vertexShader: [
          'attribute float aSize;attribute float aPhase;attribute float aWarm;',
          'uniform float uT;varying float vA;varying float vW;',
          'void main(){',
          '  vec3 p=position;',
          '  p.y+=sin(uT*0.35+aPhase)*0.6;',                   // slow float
          '  p.x+=cos(uT*0.22+aPhase*1.7)*0.8;',
          '  vec4 mv=modelViewMatrix*vec4(p,1.0);',
          '  gl_PointSize=aSize*120.0/-mv.z;',                 // size attenuation = depth
          '  vA=0.11+0.22*(0.5+0.5*sin(uT*0.6+aPhase*3.0));',  // twinkle
          '  vW=aWarm;gl_Position=projectionMatrix*mv;',
          '}'
        ].join('\n'),
        fragmentShader: [
          'precision mediump float;varying float vA;varying float vW;',
          'void main(){',
          '  float d=length(gl_PointCoord-vec2(0.5));',
          '  float a=smoothstep(0.5,0.05,d)*vA;',              // soft round sprite
          '  vec3 warm=vec3(1.0,0.85,0.62);vec3 cool=vec3(0.81,0.89,0.97);',
          '  gl_FragColor=vec4(mix(cool,warm,vW),a);',
          '}'
        ].join('\n')
      });
      scene.add(new THREE.Points(geo, mat));

      var tx = 0, ty = 0, cx = 0, cy = 0;
      addEventListener('pointermove', function (e) {
        tx = (e.clientX / innerWidth - 0.5) * 1.6;             // immersive cursor parallax
        ty = (e.clientY / innerHeight - 0.5) * 1.0;
      }, { passive: true });

      function size() {
        var w = fixed ? innerWidth : host.clientWidth;
        var h = fixed ? innerHeight : host.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
      }
      size(); addEventListener('resize', size);

      /* fade the field away past the hero so it never distracts mid-page */
      if (ST) {
        gsap.to(cv, {
          autoAlpha: 0, ease: 'none',
          scrollTrigger: { trigger: fixed ? body : host, start: fixed ? '4% top' : 'bottom 85%', end: fixed ? '38% top' : 'bottom 30%', scrub: 0.5 }
        });
      }

      var run = true;
      document.addEventListener('visibilitychange', function () { run = !document.hidden; if (run) requestAnimationFrame(tick); });
      var io = new IntersectionObserver(function (en) { run = en[0].isIntersecting && !document.hidden; if (run) requestAnimationFrame(tick); }, { threshold: 0 });
      io.observe(cv);

      function tick(t) {
        if (!run) return;
        requestAnimationFrame(tick);
        mat.uniforms.uT.value = t * 0.001;
        cx += (tx - cx) * 0.04; cy += (ty - cy) * 0.04;
        camera.position.x = cx; camera.position.y = -cy;
        camera.lookAt(0, 0, -8);
        renderer.render(scene, camera);
      }
      requestAnimationFrame(tick);
    }).catch(function () { /* CDN blocked — page is fine without motes */ });
  })();
})();
