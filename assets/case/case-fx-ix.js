/* FX case-study real-screen interactions */
(function(){
  function init(){
    // before/after slider
    var ba=document.getElementById('ba');
    if(ba){ var set=function(cx){var r=ba.getBoundingClientRect();var p=Math.max(0,Math.min(100,(cx-r.left)/r.width*100));ba.style.setProperty('--x',p+'%');};
      var down=false; ba.addEventListener('pointerdown',function(e){down=true;set(e.clientX);});
      window.addEventListener('pointermove',function(e){if(down)set(e.clientX);});
      window.addEventListener('pointerup',function(){down=false;});
      ba.addEventListener('pointermove',function(e){if(!down&&e.pointerType==='mouse')set(e.clientX);}); }
    // sticky scrollytelling
    var sticky=document.getElementById('sticky');
    if(sticky){ var imgs=sticky.querySelectorAll('img'); var steps=document.querySelectorAll('#steps .ix-step');
      var sio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var i=e.target.getAttribute('data-i');
        imgs.forEach(function(m){m.classList.toggle('on',m.getAttribute('data-i')===i);});
        steps.forEach(function(s){s.classList.toggle('act',s.getAttribute('data-i')===i);});}});},{threshold:.6});
      steps.forEach(function(s){sio.observe(s);}); }
    // lightbox for bento
    var lb=document.getElementById('lb');
    if(lb){ var limg=lb.querySelector('img');
      document.querySelectorAll('#bento .cell img').forEach(function(i){i.addEventListener('click',function(){limg.src=i.src;lb.classList.add('on');});});
      lb.addEventListener('click',function(){lb.classList.remove('on');}); }
  }
  if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded',init);
})();

/* click-to-zoom lightbox for the ix-scrolly stage */
(function(){
  var lb=document.getElementById('lb'), sticky=document.getElementById('sticky');
  if(!lb||!sticky) return;
  var limg=lb.querySelector('img');
  sticky.addEventListener('click',function(){
    var cur=sticky.querySelector('img.on')||sticky.querySelector('img');
    if(cur){ limg.src=cur.src; lb.classList.add('on'); }
  });
  lb.addEventListener('click',function(){ lb.classList.remove('on'); });
})();
