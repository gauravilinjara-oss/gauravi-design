/* smartTRADE case-study real-screen interactions */
(function(){
  function init(){
    /* ---- scrollytelling: swap the sticky screen as each caption enters view ---- */
    var stage=document.getElementById('stStage');
    if(stage){
      var imgs=stage.querySelectorAll('img');
      var steps=document.querySelectorAll('#stSteps .st-step');
      var io=new IntersectionObserver(function(es){
        es.forEach(function(e){
          if(e.isIntersecting){
            var i=e.target.getAttribute('data-i');
            imgs.forEach(function(m){ m.classList.toggle('on', m.getAttribute('data-i')===i); });
            steps.forEach(function(s){ s.classList.toggle('act', s.getAttribute('data-i')===i); });
          }
        });
      },{threshold:.55,rootMargin:'-8% 0px -32% 0px'});
      steps.forEach(function(s){ io.observe(s); });
    }

    /* ---- hotspot pins: hover on desktop, tap-to-toggle on touch ---- */
    document.querySelectorAll('.ix-pin').forEach(function(p){
      p.addEventListener('click',function(e){
        e.stopPropagation();
        document.querySelectorAll('.ix-pin.open').forEach(function(o){ if(o!==p) o.classList.remove('open'); });
        p.classList.toggle('open');
      });
    });
    document.addEventListener('click',function(){ document.querySelectorAll('.ix-pin.open').forEach(function(o){ o.classList.remove('open'); }); });

    /* ---- lightbox: click a gallery cell to zoom; tall images scroll inside the overlay ---- */
    var lb=document.getElementById('stlb');
    if(lb){
      var limg=lb.querySelector('img');
      document.querySelectorAll('[data-zoom]').forEach(function(el){
        el.addEventListener('click',function(){
          limg.src=el.getAttribute('data-zoom');
          limg.alt=el.getAttribute('data-alt')||'';
          lb.scrollTop=0;
          lb.classList.add('on');
          document.body.style.overflow='hidden';
        });
      });
      function close(){ lb.classList.remove('on'); document.body.style.overflow=''; }
      lb.addEventListener('click',close);
      document.addEventListener('keydown',function(e){ if(e.key==='Escape' && lb.classList.contains('on')) close(); });
    }
  }
  if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded',init);
})();
