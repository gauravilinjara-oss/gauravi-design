/* ============================================================================
   PORTFOLIO CHAT WIDGET, self-contained, no dependencies
   ----------------------------------------------------------------------------
   Renders a launcher + chat panel, streams from /api/chat (SSE), and keeps a
   short rolling history. Drop on any page with: assistant.css + this script.
   Edit the bot's voice/facts in api/_prompt.js (server side), not here.
   ============================================================================ */
(function () {
  'use strict';

  // ---- config knobs ----
  var ENDPOINT     = '/api/chat';     // same-origin (works under `vercel dev`)
  var MAX_HISTORY  = 12;              // turns sent to the server
  var STARTERS = [
    "What's her strongest project?",
    "Tell me about the AI-voice work",
    "What's her design process?",
    "How do I reach her?"
  ];
  var GENERAL_FOLLOW = ["What's her design process?", "Where has she worked?", "How do I reach her?"];
  var CASES = [
    { href: 'case-fxonline.html', title: 'exchange currency without the fear', meta: '16,265 live deals · Emirates NBD FX',
      re: /\bfx\b|foreign[- ]?exchange|exchange currency|currency deal|rm.{0,8}trader|trader desk|treasury/i,
      follow: ['How does the RM⇄Trader system work?', 'What was the 90-second rate window?'] },
    { href: 'case-business.html', title: 'corporate banking, in your pocket', meta: 'approve on the go · Emirates NBD',
      re: /business online|approve on the go|corporate banking|authoris(e|ation)|payment approval/i,
      follow: ['What problem did Business Online solve?'] },
    { href: 'case-mashreq.html', title: 'great help, one click away', meta: '4 clicks → 1 · Mashreq Bank',
      re: /mashreq|customer care|4 clicks|help cent(re|er)/i,
      follow: ['What changed in the customer-care redesign?'] },
    { href: 'case-podonos.html', title: 'the intelligent layer for global voice', meta: 'ai voice · Podonos (NDA)',
      re: /podonos|ai[- ]?voice|tts|text[- ]?to[- ]?speech|voice (eval|model)/i,
      follow: ['Tell me more about the AI-voice work'] }
  ];

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var history = [];        // [{role, content}]
  var busy = false;
  var voiceOn = false;     // when true, the assistant reads replies aloud

  // ---- build DOM ----
  var root = document.createElement('div');
  root.id = 'gachat';
  root.innerHTML =
    '<button class="gachat-launch" type="button" aria-label="Ask about Gauravi">' +
      '<span class="dot"></span><b>ask about gauravi</b>' +
    '</button>' +
    '<div class="gachat-panel" role="dialog" aria-label="Chat about Gauravi" aria-modal="false">' +
      '<div class="gachat-head">' +
        '<div class="gachat-av"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 6l2.4 5.4L12 18l-2.4-6.6z" fill="#fff" stroke="none"/></svg></div>' +
        '<div class="gc-htxt"><div class="ttl">ask about <span class="a">gauravi</span></div>' +
        '<div class="sub"><span class="live"></span>online · replies instantly</div></div>' +
        '<button class="gachat-iconbtn gc-voice" type="button" aria-pressed="false" aria-label="Voice mode, read replies aloud" title="Voice mode (read replies aloud)">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M19 5a9 9 0 0 1 0 14"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>' +
        '</button>' +
        '<button class="gachat-iconbtn gc-reset" type="button" aria-label="Clear conversation" title="Clear">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>' +
        '</button>' +
        '<button class="gachat-iconbtn gc-close" type="button" aria-label="Close chat" title="Close">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="gachat-log" aria-live="polite"></div>' +
      '<form class="gachat-form">' +
        '<div class="gachat-inwrap"><textarea rows="1" placeholder="ask me something…" aria-label="Your message" maxlength="600"></textarea></div>' +
        '<button class="gachat-mic" type="button" aria-label="Speak your question" title="Tap to speak">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>' +
        '</button>' +
        '<button class="gachat-send" type="submit" aria-label="Send" disabled>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>' +
        '</button>' +
      '</form>' +
      '<div class="gachat-foot">grounded in gauravi’s real work · portfolio assistant</div>' +
    '</div>';
  document.body.appendChild(root);

  var launch = root.querySelector('.gachat-launch');
  var panel  = root.querySelector('.gachat-panel');
  var log    = root.querySelector('.gachat-log');
  var form   = root.querySelector('.gachat-form');
  var input  = form.querySelector('textarea');
  var sendBtn= form.querySelector('.gachat-send');

  // ---- protect host page (e.g. the journey's custom scroll engine) ----
  // stop wheel/drag/touch inside the widget from feeding the page scroll engine.
  ['wheel', 'pointerdown', 'touchstart', 'mousedown'].forEach(function (ev) {
    root.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
  });

  // ---- open / close ----
  function open() {
    root.classList.add('open');
    if (!history.length) renderIntro();
    setTimeout(function () { input.focus(); }, reduce ? 0 : 250);
  }
  function close() { root.classList.remove('open'); stopSpeaking(); launch.focus(); }
  launch.addEventListener('click', open);
  root.querySelector('.gc-close').addEventListener('click', close);
  root.querySelector('.gc-reset').addEventListener('click', function () {
    history = []; log.innerHTML = ''; stopSpeaking(); renderIntro(); input.focus();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('open')) close();
  });

  // ---- empty-state greeting + starter chips ----
  function renderIntro() {
    var wrap = document.createElement('div');
    wrap.className = 'gachat-intro';
    var p = document.createElement('p');
    p.textContent = "Hi! I can tell you about Gauravi’s work, background, and how she designs. Ask me anything, or start here:";
    wrap.appendChild(p);
    var chips = document.createElement('div');
    chips.className = 'gachat-chips';
    STARTERS.forEach(function (q) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'gachat-chip'; b.textContent = q;
      b.addEventListener('click', function () { send(q); });
      chips.appendChild(b);
    });
    wrap.appendChild(chips);
    log.appendChild(wrap);
  }
  function clearIntro() { var i = log.querySelector('.gachat-intro'); if (i) i.remove(); }

  // ---- render helpers ----
  function addMsg(role, text) {
    var row = document.createElement('div');
    row.className = 'gachat-row ' + role;
    if (role === 'bot') {
      var av = document.createElement('div');
      av.className = 'gachat-botav';
      av.innerHTML = '<svg viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M12 5l2.5 6L12 19l-2.5-8z"/></svg>';
      row.appendChild(av);
    }
    var el = document.createElement('div');
    el.className = 'gachat-msg ' + role;
    el.textContent = text || '';
    row.appendChild(el);
    log.appendChild(row);
    scroll();
    return el;
  }
  function addTyping() {
    var t = document.createElement('div');
    t.className = 'gachat-typing';
    t.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(t); scroll();
    return t;
  }
  function scroll() { log.scrollTop = log.scrollHeight; }

  // ---- rich text: clickable links + bold (run after a reply finishes streaming) ----
  function escapeHtml(s) { return s.replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function renderRich(el, text) {
    el.innerHTML = escapeHtml(text)
      .replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]])/g, function (u) {
        return '<a href="' + u + '" target="_blank" rel="noopener">' + u.replace(/^https?:\/\/(www\.)?/, '') + '</a>';
      })
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  // ---- inline content cards + follow-up chips (award-style enrichment) ----
  function actionCard(href, ttl, meta, go) {
    var a = document.createElement('a'); a.className = 'gachat-card'; a.href = href; a.setAttribute('download', '');
    a.innerHTML = '<span class="gachat-card-ttl"></span><span class="gachat-card-meta"></span><span class="gachat-card-go">' + go + '</span>';
    a.querySelector('.gachat-card-ttl').textContent = ttl;
    a.querySelector('.gachat-card-meta').textContent = meta;
    return a;
  }
  function caseCard(c) {
    var a = document.createElement('a');
    a.className = 'gachat-card'; a.href = c.href;
    a.innerHTML = '<span class="gachat-card-ttl"></span><span class="gachat-card-meta"></span><span class="gachat-card-go">read the case →</span>';
    a.querySelector('.gachat-card-ttl').textContent = c.title;
    a.querySelector('.gachat-card-meta').textContent = c.meta;
    return a;
  }
  function followChips(qs) {
    if (!qs.length) return;
    var w = document.createElement('div'); w.className = 'gachat-follow';
    qs.forEach(function (q) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'gachat-chip sm';
      b.textContent = q; b.addEventListener('click', function () { send(q); });
      w.appendChild(b);
    });
    log.appendChild(w);
  }
  function clearFollow() {
    Array.prototype.forEach.call(log.querySelectorAll('.gachat-follow'), function (n) { n.remove(); });
  }
  function enrich(text) {
    if (!text) return;
    var matched = [];
    CASES.forEach(function (c) { if (matched.length < 2 && c.re.test(text)) matched.push(c); });
    matched.forEach(function (c) { log.appendChild(caseCard(c)); });
    if (/\b(resume|résumé|cv|hire|hiring|reach|contact|connect|email|get in touch|work with)\b/i.test(text)) {
      log.appendChild(actionCard('/assets/files/Gauravi_Linjara_Resume.pdf', 'gauravi’s résumé', 'pdf · download', 'download →'));
    }
    var qs = [];
    matched.forEach(function (c) { (c.follow || []).forEach(function (f) { if (qs.length < 3 && qs.indexOf(f) < 0) qs.push(f); }); });
    GENERAL_FOLLOW.forEach(function (f) { if (qs.length < 3 && qs.indexOf(f) < 0) qs.push(f); });
    followChips(qs);
    scroll();
  }

  // ---- input wiring ----
  input.addEventListener('input', function () {
    sendBtn.disabled = !input.value.trim() || busy;
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); send(input.value); });

  // ============================================================================
  //  VOICE MODE, speak to ask (Web Speech: SpeechRecognition) + hear replies
  //  (SpeechSynthesis). Progressive enhancement: controls hide if unsupported.
  //  Fitting for a portfolio whose owner designs AI-voice experiences.
  // ============================================================================
  var micBtn   = form.querySelector('.gachat-mic');
  var voiceBtn = root.querySelector('.gc-voice');
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var synth = window.speechSynthesis || null;
  var recog = null, listening = false;

  // If neither capability exists, remove the controls cleanly.
  if (!SR && micBtn) micBtn.remove();
  if (!synth && voiceBtn) voiceBtn.remove();

  // ---- speak a reply aloud (strip markdown/urls so it reads naturally) ----
  function speakable(t) {
    return (t || '')
      .replace(/https?:\/\/[^\s)]+/g, 'the link')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/[•·→↳]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function pickVoice() {
    if (!synth) return null;
    var vs = synth.getVoices() || [];
    // prefer a natural english voice
    return vs.find(function (v) { return /en[-_]?(US|GB)/i.test(v.lang) && /natural|google|samantha|female/i.test(v.name); })
        || vs.find(function (v) { return /^en/i.test(v.lang); })
        || vs[0] || null;
  }
  function speak(text) {
    if (!synth || !voiceOn) return;
    var clean = speakable(text);
    if (!clean) return;
    try {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(clean);
      var v = pickVoice(); if (v) u.voice = v;
      u.rate = 1.02; u.pitch = 1.0;
      synth.speak(u);
    } catch (_) {}
  }
  function stopSpeaking() { if (synth) { try { synth.cancel(); } catch (_) {} } }
  if (synth && typeof synth.onvoiceschanged !== 'undefined') {
    synth.onvoiceschanged = pickVoice; // warm the voice list
  }

  // ---- voice-mode toggle (read replies aloud) ----
  if (voiceBtn) {
    voiceBtn.addEventListener('click', function () {
      voiceOn = !voiceOn;
      voiceBtn.classList.toggle('on', voiceOn);
      voiceBtn.setAttribute('aria-pressed', voiceOn ? 'true' : 'false');
      if (!voiceOn) stopSpeaking();
      else if (synth) speak('Voice mode on. Ask me anything about Gauravi.');
    });
  }

  // ---- mic: speech-to-text into the composer ----
  function buildRecog() {
    var r = new SR();
    r.lang = 'en-US'; r.interimResults = true; r.maxAlternatives = 1; r.continuous = false;
    r.onstart = function () { listening = true; if (micBtn) micBtn.classList.add('listening'); stopSpeaking(); };
    r.onerror = function () { listening = false; if (micBtn) micBtn.classList.remove('listening'); };
    r.onend   = function () {
      listening = false; if (micBtn) micBtn.classList.remove('listening');
      // In voice mode, a finished utterance auto-sends (hands-free conversation).
      if (voiceOn && input.value.trim()) form.requestSubmit();
    };
    r.onresult = function (e) {
      var txt = '';
      for (var i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
      input.value = txt;
      input.dispatchEvent(new Event('input'));
    };
    return r;
  }
  if (micBtn && SR) {
    micBtn.addEventListener('click', function () {
      if (listening && recog) { recog.stop(); return; }
      if (!root.classList.contains('open')) open();
      try { recog = buildRecog(); recog.start(); } catch (_) { listening = false; micBtn.classList.remove('listening'); }
    });
  }

  // ---- send + stream ----
  async function send(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    busy = true; sendBtn.disabled = true;
    clearIntro(); clearFollow();

    addMsg('user', text);
    history.push({ role: 'user', content: text });
    input.value = ''; input.style.height = 'auto';

    var typing = addTyping();
    var bot = null;
    var acc = '';

    try {
      var resp = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-MAX_HISTORY) })
      });
      if (!resp.ok || !resp.body) {
        var msg = resp.status === 429
          ? "That’s a lot of questions! Give it a minute, then ask again."
          : "I couldn’t reach the assistant. Make sure the server is running, then try again.";
        typing.remove(); var e1 = addMsg('bot', msg); e1.classList.add('err');
        finish(); return;
      }

      var reader = resp.body.getReader();
      var decoder = new TextDecoder();
      var buf = '';
      while (true) {
        var chunk = await reader.read();
        if (chunk.done) break;
        buf += decoder.decode(chunk.value, { stream: true });
        var parts = buf.split('\n\n');
        buf = parts.pop();                     // keep incomplete frame
        for (var i = 0; i < parts.length; i++) {
          var line = parts[i].trim();
          if (line.slice(0, 6) !== 'data: ') continue;   // SSE frames look like "data: {...}"
          var payload = line.slice(6);
          if (payload === '[DONE]') continue;
          var data; try { data = JSON.parse(payload); } catch (_) { continue; }
          if (data.error) {
            typing.remove();
            if (!bot) { bot = addMsg('bot', ''); bot.classList.add('err'); }
            bot.classList.add('err'); bot.textContent = data.error;
            continue;
          }
          if (data.text) {
            if (!bot) { typing.remove(); bot = addMsg('bot', ''); }
            acc += data.text; bot.textContent = acc; scroll();
          }
        }
      }
      if (typing.parentNode) typing.remove();
      if (acc) { if (bot) renderRich(bot, acc); history.push({ role: 'assistant', content: acc }); enrich(acc); speak(acc); }
    } catch (err) {
      if (typing.parentNode) typing.remove();
      if (!bot) { var e2 = addMsg('bot', "Something went wrong reaching the assistant. Please try again."); e2.classList.add('err'); }
    }
    finish();
  }

  function finish() {
    busy = false;
    sendBtn.disabled = !input.value.trim();
    input.focus();
  }
})();
