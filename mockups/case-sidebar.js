/* ============================================================
   case-sidebar.js, builds responsive case-study navigation.
   It reads project metadata from the snapshot card and creates
   one shared section model for the desktop rail and mobile select.
   ============================================================ */
(function(){
  if(document.getElementById('caserail') || document.getElementById('caseMobileNav')) return;

  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function fact(name){
    var facts=document.querySelectorAll('.snap-card .snap-fact');
    for(var i=0;i<facts.length;i++){
      var eyebrow=facts[i].querySelector('.eyebrow');
      if(eyebrow && eyebrow.textContent.trim().toLowerCase()===name){
        var p=facts[i].querySelector('p');
        return p?p.textContent.trim():'';
      }
    }
    return '';
  }

  function getSectionEntries(){
    var entries=[];
    var hero=document.querySelector('header.hero');
    if(hero){
      hero.id=hero.id||'overview';
      entries.push({el:hero,num:'',label:hero.dataset.navLabel||'Overview',a:null});
    }
    document.querySelectorAll('section').forEach(function(section,index){
      var eyebrow=section.querySelector('.sec-head .eyebrow');
      if(!eyebrow) return;
      var match=eyebrow.textContent.trim().match(/^(\d+)\s*·\s*(.+)$/);
      section.id=section.id||'chapter-'+(index+1);
      entries.push({
        el:section,
        num:section.dataset.navNumber||(match&&match[1])||'',
        label:section.dataset.navLabel||(match&&match[2])||eyebrow.textContent.trim(),
        a:null
      });
    });
    return entries;
  }

  function scrollToEntry(entry){
    var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    entry.el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
    history.replaceState(null,'','#'+entry.el.id);
  }

  function buildMobileNav(entries){
    var holder=document.createElement('div');
    holder.id='caseMobileNav';
    holder.innerHTML='<label for="caseSectionSelect">In this case study</label><select id="caseSectionSelect" aria-label="Jump to a section"></select>';
    var select=holder.querySelector('select');
    entries.forEach(function(entry,index){
      select.add(new Option((entry.num?entry.num+' · ':'')+entry.label,String(index)));
    });
    var content=document.querySelector('body > main, body > header.hero, body > section');
    content?.before(holder);
    return {holder:holder,select:select};
  }

  var entries=getSectionEntries();
  if(entries.length<2) return;

  var proj=(document.title||'case study').split(/\s*[-–,]\s+/)[0].trim();
  var roleRaw=fact('role'), timeline=fact('timeline');
  var roleParts=roleRaw.split(/\s+[,–·]\s+/);
  var role=roleParts[0]||roleRaw, org=roleParts.slice(1).join(' · ');

  var rail=document.createElement('aside');
  rail.id='caserail';
  rail.setAttribute('aria-label','Case study contents');
  var html='<a class="cr-proj" href="#'+entries[0].el.id+'">'+esc(proj)+'<span class="a">.</span></a>';
  html+='<div class="cr-meta">';
  if(role) html+='<div class="cr-fact"><span>Role</span><p>'+esc(role)+(org?'<span class="org">'+esc(org)+'</span>':'')+'</p></div>';
  if(timeline) html+='<div class="cr-fact"><span>Timeline</span><p>'+esc(timeline)+'</p></div>';
  html+='</div><div class="cr-rule"></div>';
  html+='<div class="cr-navlabel">Contents</div><nav class="cr-nav" id="crNav"></nav>';
  html+='<div class="cr-foot"><div class="cr-prog"><i id="crProgBar"></i></div><div class="cr-pct" id="crPct">0%</div></div>';
  rail.innerHTML=html;
  var content=document.querySelector('body > main, body > header.hero, body > section');
  if(!content) return;
  content.before(rail);

  var navEl=rail.querySelector('#crNav');
  entries.forEach(function(entry){
    var a=document.createElement('a');
    a.href='#'+entry.el.id;
    a.innerHTML='<i>'+entry.num+'</i><span>'+esc(entry.label)+'</span>';
    entry.a=a;
    navEl.appendChild(a);
  });

  var mobile=buildMobileNav(entries);

  function setActive(index){
    entries.forEach(function(entry,entryIndex){
      var on=entryIndex===index;
      entry.a.classList.toggle('on',on);
      if(on) entry.a.setAttribute('aria-current','location');
      else entry.a.removeAttribute('aria-current');
    });
    mobile.select.value=String(index);
  }

  entries.forEach(function(entry,index){
    entry.a.addEventListener('click',function(event){
      event.preventDefault();
      setActive(index);
      scrollToEntry(entry);
    });
  });
  mobile.select.addEventListener('change',function(){
    var index=Number(mobile.select.value);
    setActive(index);
    scrollToEntry(entries[index]);
  });
  setActive(0);

  var spy=new IntersectionObserver(function(changes){
    changes.forEach(function(change){ change.target.__caseVisible=change.isIntersecting; });
    for(var i=0;i<entries.length;i++){
      if(entries[i].el.__caseVisible){
        setActive(i);
        break;
      }
    }
  },{rootMargin:'-12% 0px -70% 0px',threshold:0});
  entries.forEach(function(entry){ spy.observe(entry.el); });

  var bar=rail.querySelector('#crProgBar'), pct=rail.querySelector('#crPct'), ticking=false;
  function paint(){
    ticking=false;
    var root=document.documentElement, max=(root.scrollHeight-root.clientHeight)||1;
    var progress=Math.max(0,Math.min(1,(window.scrollY||root.scrollTop)/max));
    bar.style.width=(progress*100).toFixed(1)+'%';
    pct.textContent=Math.round(progress*100)+'%';
  }
  window.addEventListener('scroll',function(){
    if(!ticking){ ticking=true; requestAnimationFrame(paint); }
  },{passive:true});
  window.addEventListener('resize',paint);
  paint();
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
