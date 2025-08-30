/* nav.js – production (surgical patch) */
(function(){
  'use strict';
  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const on = (el,ev,fn)=>el&&el.addEventListener(ev,fn,{passive:false});
  const ready = f => (document.readyState!=='loading') ? f() : document.addEventListener('DOMContentLoaded', f);

  ready(() => {
    // --- Minimal, backward-compatible adjustments ---
    // 1) Fallback selectors for blog templates
    const toggle  = $('#nav-toggle') || $('.hamburger');
    const nav     = $('#site-nav')   || $('nav.site-nav');
    let overlay   = $('#nav-overlay');

    // 2) Guarantee overlay exists (some blog pages omit it)
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'nav-overlay';
      overlay.hidden = true;
      document.body.appendChild(overlay);
    }

    if (!toggle || !nav || !overlay) return;

    // Initial state (kept from original behavior)
    nav.classList.remove('is-open');
    overlay.classList.remove('is-open');
    nav.hidden = true;
    overlay.hidden = true;
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-controls', nav.id || 'site-nav');

    // Scroll lock helpers (unchanged semantics)
    let scrollLocked = false;
    const lockScroll = (onLock)=>{
      if (onLock && !scrollLocked){
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        scrollLocked = true;
      } else if (!onLock && scrollLocked){
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        scrollLocked = false;
      }
    };

    // Optional inert/focus management (compatible with original intent)
    const setInert = (inert)=>{
      // Keep it lightweight: only apply aria-hidden when open to reduce tab stops behind nav
      const main = $('main') || $('#main-content');
      if (main){
        if (inert) main.setAttribute('aria-hidden','true');
        else main.removeAttribute('aria-hidden');
      }
    };

    let prevFocus = null;

    const open = ()=>{
      prevFocus = document.activeElement;
      nav.hidden = false; overlay.hidden = false;
      nav.classList.add('is-open'); overlay.classList.add('is-open');
      toggle.setAttribute('aria-expanded','true');
      lockScroll(true); setInert(true);
      const first = $('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])', nav);
      first && first.focus && first.focus();
    };

    const close = ()=>{
      nav.classList.remove('is-open'); overlay.classList.remove('is-open');
      nav.hidden = true; overlay.hidden = true;
      toggle.setAttribute('aria-expanded','false');
      lockScroll(false); setInert(false);
      prevFocus && prevFocus.focus && prevFocus.focus();
    };

    // Keep document-level delegated click (original pattern), just tighten the target
    document.addEventListener('click', function(e){
      const t = e.target.closest && e.target.closest('#nav-toggle, .hamburger');
      if (t){ e.preventDefault(); nav.classList.contains('is-open') ? close() : open(); }
    }, {capture:true});

    // Close on overlay click and on any nav link click
    on(overlay,'click', ()=> close());
    $$('#site-nav a, nav.site-nav a').forEach(a => on(a,'click', ()=> close()));

    // Escape to close
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && nav.classList.contains('is-open')) close();
    });

    // Trap focus while open (Tab/Shift+Tab)
    document.addEventListener('keydown', function(e){
      if (e.key !== 'Tab' || !nav.classList.contains('is-open')) return;
      const f = $$('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])', nav).filter(el => !el.disabled && el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length-1], a=document.activeElement;
      if (e.shiftKey && a===first){ last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && a===last){ first.focus(); e.preventDefault(); }
    });

    // Close when switching to desktop (unchanged)
    const mq = window.matchMedia('(min-width: 1201px)');
    (mq.addEventListener ? mq.addEventListener('change', e=> e.matches && close()) : mq.addListener(e=> e.matches && close()));
  });

  /*
   * GA4 event tracking
   *
   * Capture click-to-call, booking CTA clicks and form submissions across the site.
   * Instead of embedding the logic in every HTML page, we wire up listeners
   * centrally here. When a user clicks on a telephone link, a primary CTA
   * button, or submits a form, a corresponding GA4 event is fired. If GA4 is
   * not present, the calls silently fail. See audit for details.
   */
  document.addEventListener('DOMContentLoaded', function () {
    // Click events
    document.addEventListener('click', function(ev){
      var el = ev.target;
      var closest = el.closest ? el.closest('a[href^="tel:"], .button-primary, .cta, a[href*="appointment"], a[href*="contact"]') : null;
      if (!closest) return;
      // Phone call
      if (closest.matches('a[href^="tel:"]')) {
        if (typeof gtag === 'function') {
          gtag('event', 'click_to_call', { event_category: 'engagement' });
        }
        return;
      }
      // Booking CTA
      if (closest.matches('.button-primary, .cta, a[href*="appointment"], a[href*="contact"]')) {
        if (typeof gtag === 'function') {
          gtag('event', 'book_appointment_click', { event_category: 'engagement' });
        }
        return;
      }
    }, false);
    // Form submissions
    document.addEventListener('submit', function(ev){
      var form = ev.target;
      if (!form || form.tagName.toLowerCase() !== 'form') return;
      if (typeof gtag === 'function') {
        gtag('event', 'form_submit', { event_category: 'engagement', form_id: form.id || '' });
      }
    }, false);
  });

})();