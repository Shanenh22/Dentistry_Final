
/*! faq-accordion.js — accessible FAQ accordion
    - Supports <details>/<summary> and .faq-item/.faq-question/.faq-answer
    - Keeps collapsible behavior on all screen sizes
    - No external dependencies
*/
(function(){
  'use strict';
  var ready = function (fn){ (document.readyState !== 'loading') ? fn() : document.addEventListener('DOMContentLoaded', fn); };
  var $all = function(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); };

  function initDivAccordion(root){
    $all('.faq-item', root).forEach(function(item){
      var q = item.querySelector('.faq-question');
      var a = item.querySelector('.faq-answer');
      if(!q || !a) return;

      // IDs & ARIA
      if(!a.id){ a.id = 'faq_' + Math.random().toString(36).slice(2); }
      q.setAttribute('role','button');
      q.setAttribute('aria-controls', a.id);
      // Determine initial open state
      var initiallyOpen = item.classList.contains('open') || a.classList.contains('show');
      q.setAttribute('aria-expanded', initiallyOpen ? 'true' : 'false');
      a.setAttribute('aria-hidden', initiallyOpen ? 'false' : 'true');
      q.tabIndex = q.tabIndex || 0;

      function toggle(){
        var willOpen = !item.classList.contains('open');
        item.classList.toggle('open', willOpen);
        a.classList.toggle('show', willOpen);
        q.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        a.setAttribute('aria-hidden', willOpen ? 'false' : 'true');
      }

      q.addEventListener('click', function(e){ e.preventDefault(); toggle(); }, {passive:false});
      q.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          toggle();
        }
      }, {passive:false});
    });
  }

  function initDetailsAccordion(root){
    // Progressive enhancement: update aria-expanded on summary
    $all('#faq details summary, .faq-accordion details summary', root).forEach(function(sum){
      var det = sum.parentElement;
      sum.setAttribute('role','button');
      sum.setAttribute('aria-expanded', det.hasAttribute('open') ? 'true' : 'false');
      sum.addEventListener('click', function(){
        // delay until the toggle completes
        setTimeout(function(){ sum.setAttribute('aria-expanded', det.hasAttribute('open') ? 'true' : 'false'); }, 0);
      }, {passive:true});
      sum.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          sum.click();
        }
      }, {passive:false});
    });
  }

  ready(function(){
    initDivAccordion(document);
    initDetailsAccordion(document);
  });
})();
