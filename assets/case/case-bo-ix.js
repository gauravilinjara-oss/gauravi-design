/* Business Online - mobile case-study interactions */
(function(){
  function init(){
    // autoplay videos on loop (muted autoplay is allowed); ensure they run
    document.querySelectorAll('.bo-phone video, .bo-vid video, .handoff-vid video').forEach(function(v){
      v.muted=true; v.loop=true;
      var go=function(){ v.play().catch(function(){}); };
      go(); v.addEventListener('canplay',go,{once:true});
    });
    // lightbox
    var lb=document.getElementById('lb');
    if(lb){ var limg=lb.querySelector('img');
      document.querySelectorAll('.lb-open img').forEach(function(i){i.addEventListener('click',function(){limg.src=i.src;lb.classList.add('on');});});
      lb.addEventListener('click',function(){lb.classList.remove('on');}); }
    // before/after slider
    var ba=document.getElementById('ba');
    if(ba){ var set=function(cx){var r=ba.getBoundingClientRect();var p=Math.max(0,Math.min(100,(cx-r.left)/r.width*100));ba.style.setProperty('--x',p+'%');};
      var down=false; ba.addEventListener('pointerdown',function(e){down=true;set(e.clientX);});
      window.addEventListener('pointermove',function(e){if(down)set(e.clientX);});
      window.addEventListener('pointerup',function(){down=false;});
      ba.addEventListener('pointermove',function(e){if(!down&&e.pointerType==='mouse')set(e.clientX);}); }
    // scrollytelling - sticky phone swaps as steps enter
    var steps=document.querySelectorAll('#boSteps .bo-sc-step');
    var shots=document.querySelectorAll('.bo-stickyphone img');
    if(steps.length&&shots.length){
      var show=function(i){
        steps.forEach(function(s){s.classList.toggle('act',+s.dataset.i===i);});
        shots.forEach(function(im){im.classList.toggle('on',+im.dataset.i===i);});
      };
      var sio=new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting) show(+e.target.dataset.i); });
      },{rootMargin:'-45% 0px -45% 0px',threshold:0});
      steps.forEach(function(s){sio.observe(s);});
    }
    // trust hotspots - tap to toggle on touch
    var hots=document.querySelectorAll('.bo-hot');
    hots.forEach(function(h){
      h.addEventListener('click',function(e){
        e.preventDefault();
        var was=h.classList.contains('open');
        hots.forEach(function(o){o.classList.remove('open');});
        if(!was) h.classList.add('open');
      });
    });
    document.addEventListener('click',function(e){
      if(!e.target.closest('.bo-hot')) hots.forEach(function(o){o.classList.remove('open');});
    });
    // annotated before/after - reveal notes + connectors on scroll
    var baa=document.querySelectorAll('.ba-annotated');
    if(baa.length){
      var bo=new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('go'); bo.unobserve(e.target); } });
      },{threshold:.3});
      baa.forEach(function(x){bo.observe(x);});
    }
    // process timeline - light up the node dots in sequence
    var rfl=document.getElementById('roleflow'); if(rfl){ new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('go');}});},{threshold:.3}).observe(rfl); }
    var stp=document.getElementById('stepper');
    if(stp){
      var so=new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('lit'); so.unobserve(e.target); } });
      },{threshold:.25});
      so.observe(stp);
    }
  }
  if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded',init);
})();
