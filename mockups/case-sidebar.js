/* ============================================================
   case-sidebar.js — builds the persistent left rail.
   Zero per-page config: it reads the project name from <title>,
   Role + Timeline from the existing "Case snapshot" card, and the
   section list from every .sec-head eyebrow on the page, then wires
   scroll-spy + smooth-scroll + a reading-progress meter.
   Only meaningful >=1180px (CSS hides it below that).
   ============================================================ */
(function(){
  // bail on small screens — the rail is desktop-only; re-check on resize.
  function active(){ return window.matchMedia('(min-width:1180px)').matches; }
  if(document.getElementById('caserail')) return;

  /* ---- project name from <title> ("FX Online - Gauravi Linjara") ---- */
  var proj=(document.title||'case study').split(/\s*[,\-–—]\s+/)[0].trim();

  /* ---- Role + Timeline from the snapshot card ---- */
  function fact(name){
    var facts=document.querySelectorAll('.snap-card .snap-fact');
    for(var i=0;i<facts.length;i++){
      var eb=facts[i].querySelector('.eyebrow');
      if(eb && eb.textContent.trim().toLowerCase()===name){
        var p=facts[i].querySelector('p'); return p?p.textContent.trim():'';
      }
    }
    return '';
  }
  var roleRaw=fact('role'), timeline=fact('timeline');
  // split "Sr. Product Designer — FX Online, Emirates NBD" into role + org line
  var roleParts=roleRaw.split(/\s+[—–·]\s+/);
  var role=roleParts[0]||roleRaw, org=roleParts.slice(1).join(' · ');

  /* ---- sections: every block with a .sec-head eyebrow ---- */
  var entries=[];
  // overview anchor = the hero
  var hero=document.querySelector('header.hero');
  if(hero){ if(!hero.id) hero.id='top'; entries.push({el:hero,num:'',label:'overview',a:null}); }
  Array.prototype.forEach.call(document.querySelectorAll('section'),function(s){
    var eb=s.querySelector('.sec-head .eyebrow'); if(!eb) return;
    var raw=eb.textContent.trim();
    var m=raw.match(/^(\d+)\s*·\s*(.+)$/);   // "01 · Context"
    var num=m?m[1]:'', label=(m?m[2]:raw).toLowerCase();
    if(!s.id) s.id='sec-'+entries.length;
    entries.push({el:s,num:num,label:label,a:null});
  });
  if(entries.length<2) return;   // not a case-study layout

  /* ---- build the rail ---- */
  var rail=document.createElement('aside');
  rail.id='caserail'; rail.setAttribute('aria-label','Case study contents');

  var html='<a class="cr-proj" href="#'+(hero?hero.id:entries[0].el.id)+'">'+esc(proj)+'<span class="a">.</span></a>';
  html+='<div class="cr-meta">';
  if(role) html+='<div class="cr-fact"><span>Role</span><p>'+esc(role)+(org?'<span class="org">'+esc(org)+'</span>':'')+'</p></div>';
  if(timeline) html+='<div class="cr-fact"><span>Timeline</span><p>'+esc(timeline)+'</p></div>';
  html+='</div><div class="cr-rule"></div>';
  html+='<div class="cr-navlabel">contents</div><nav class="cr-nav" id="crNav"></nav>';
  html+='<div class="cr-foot"><div class="cr-prog"><i id="crProgBar"></i></div><div class="cr-pct" id="crPct">0%</div></div>';
  rail.innerHTML=html;
  document.body.appendChild(rail);

  var navEl=rail.querySelector('#crNav');
  entries.forEach(function(en){
    var a=document.createElement('a');
    a.href='#'+en.el.id;
    a.innerHTML='<i>'+(en.num||'')+'</i><span>'+esc(en.label)+'</span>';
    a.addEventListener('click',function(ev){
      ev.preventDefault();
      en.el.scrollIntoView({behavior:'smooth',block:'start'});
    });
    en.a=a; navEl.appendChild(a);
  });

  /* ---- scroll-spy: highlight the section nearest the top third ---- */
  var spy=new IntersectionObserver(function(es){
    es.forEach(function(e){ e.target.__vis=e.isIntersecting; });
    // pick the topmost visible entry
    var win=null;
    for(var i=0;i<entries.length;i++){ if(entries[i].el.__vis){ win=entries[i]; break; } }
    if(win){ entries.forEach(function(en){
      var on=en===win; en.a.classList.toggle('on',on);
      if(on) en.a.setAttribute('aria-current','true'); else en.a.removeAttribute('aria-current');
    }); }
  },{rootMargin:'-12% 0px -70% 0px',threshold:0});
  entries.forEach(function(en){ spy.observe(en.el); });

  /* ---- reading progress ---- */
  var bar=rail.querySelector('#crProgBar'), pct=rail.querySelector('#crPct'), ticking=false;
  function paint(){
    ticking=false;
    var h=document.documentElement, max=(h.scrollHeight-h.clientHeight)||1;
    var p=Math.max(0,Math.min(1,(window.scrollY||h.scrollTop)/max));
    bar.style.width=(p*100).toFixed(1)+'%';
    pct.textContent=Math.round(p*100)+'%';
  }
  window.addEventListener('scroll',function(){ if(!ticking){ ticking=true; requestAnimationFrame(paint); } },{passive:true});
  window.addEventListener('resize',paint);
  paint();

  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
})();

/* shift blocks: kinetic reveal (rolled out across cases) */
(function(){
  var blocks=document.querySelectorAll('.shiftblk');
  if(!blocks.length) return;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(reduce||!('IntersectionObserver'in window)){blocks.forEach(function(b){b.classList.add('go');});return;}
  var sio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('go');sio.unobserve(e.target);}});},{threshold:.35});
  blocks.forEach(function(b){sio.observe(b);});
})();

/* light up the process-timeline glass dots when the stepper enters view */
(function(){var stp=document.getElementById('stepper');if(stp&&'IntersectionObserver' in window){new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('lit');}});},{threshold:.22}).observe(stp);}})();
