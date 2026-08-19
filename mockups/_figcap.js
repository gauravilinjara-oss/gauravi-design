/* TEMPORARY capture-mode helper for Figma html-to-design capture.
   Only runs when the URL hash contains "figmacapture". Safe to delete. */
(function(){
  if(location.hash.indexOf('figmacapture')<0) return;
  function flatten(){
    // rejoin text that JS split for animation, so Figma gets whole text (not letter/word fragments)
    document.querySelectorAll('.hl .ln > span').forEach(function(s){ if(s.querySelector('.lt')) s.textContent=s.textContent; });
    ['.lede','.proof'].forEach(function(sel){ var el=document.querySelector(sel); if(el && el.querySelector('.wd')) el.textContent=el.textContent; });
  }
  function reveal(){
    try{ flatten(); }catch(e){}
    var sp=document.getElementById('aiSplash'); if(sp) sp.style.display='none';
    if(document.body) document.body.classList.add('splash-done');
    document.querySelectorAll('.ai-rv,.reveal,[class*="reveal"],[class*="-rv"],.case,.ai-case-shot,.stage-card,.mf-line,.mf-eyebrow,.mf-sub').forEach(function(e){
      e.classList.add('in','is-in','visible','is-visible','show','active','revealed','in-view');
      e.style.setProperty('opacity','1','important');
      e.style.setProperty('transform','none','important');
      e.style.setProperty('visibility','visible','important');
    });
  }
  var n=0,iv=setInterval(function(){reveal(); if(++n>=4) clearInterval(iv);},250);
  document.addEventListener('DOMContentLoaded',reveal);
  window.addEventListener('load',reveal);
})();
