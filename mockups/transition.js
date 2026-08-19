/* ───────────────────────────────────────────────────────────
   transition.js, drives the shared page transition (see transition.css)
   - on load: ink recedes (reveal), fire `pgx:revealed`
   - on internal-link click: ink spreads to cover, then navigate
   Real <a href> links keep working if this script ever fails to load.
   ─────────────────────────────────────────────────────────── */
(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pgx = document.getElementById('pgx');

  function fireRevealed(){ try{ document.dispatchEvent(new Event('pgx:revealed')); }catch(_){} }

  if(!pgx || reduce){ if(pgx) pgx.style.display='none'; fireRevealed(); return; }

  /* one inked line per transition, carried across the navigation (sessionStorage) so the
     SAME line shows from cover (leaving) through reveal (arriving), never mid-transition flicker */
  var PHRASES=['be right there','one sec','brewing coffee','mid-run idea','rolling fresh pasta',
    'almost at the top','shaping the clay','ink still wet','sketching it up','onward!',
    'chasing the light','good things load','tiny detour','catch you there','deep breath, go'];
  var wm = pgx.querySelector('.wm');
  function writeMsg(m){ if(wm) wm.innerHTML=m+'<span class="dot">.</span>'; }
  function randMsg(){ return PHRASES[(Math.random()*PHRASES.length)|0]; }
  (function(){ var m=null; try{ m=sessionStorage.getItem('pgxMsg'); sessionStorage.removeItem('pgxMsg'); }catch(_){}
    writeMsg(m || randMsg()); })();

  /* reveal on load, hold the covered state briefly so the line is felt, then ink recedes */
  setTimeout(function(){
    pgx.classList.add('reveal');
    setTimeout(fireRevealed, 1080);
  }, 420);

  /* cover on internal navigation */
  var leaving = false;
  document.addEventListener('click', function(e){
    if(leaving || e.defaultPrevented || e.button!==0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a') : null;
    if(!a) return;
    var href = a.getAttribute('href');
    if(!href) return;
    if(href.charAt(0)==='#' || /^(mailto:|tel:|javascript:)/i.test(href)) return;
    if(a.hasAttribute('download')) return;
    if(a.target && a.target !== '_self') return;
    if(/^https?:\/\//i.test(href) && href.indexOf(location.host) === -1) return; // external

    e.preventDefault();
    leaving = true;
    var msg=randMsg();                        // one line for this whole transition
    try{ sessionStorage.setItem('pgxMsg', msg); }catch(_){}
    writeMsg(msg);
    pgx.style.display = '';
    pgx.classList.remove('reveal');           // ink spreads back in to cover
    setTimeout(function(){ window.location.href = href; }, 1180);
  });

  /* if returning via back/forward cache, make sure the page is shown */
  window.addEventListener('pageshow', function(ev){
    if(ev.persisted){ leaving = false; pgx.classList.add('reveal'); }
  });
})();
