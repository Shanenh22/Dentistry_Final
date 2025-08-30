/* form-submit.js - submit forms to API Gateway (Lambda + SES) */
(function(){
  'use strict';
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    var cfg = window.SITE_CONFIG || {};
    var API = cfg.CONTACT_API_URL;
    if (!API) return;

    // Attach to known forms (expand as needed)
    var forms = Array.from(document.querySelectorAll('form#ask-form, form[data-api="contact"]'));
    forms.forEach(function(form){
      form.addEventListener('submit', async function(e){
        e.preventDefault();
        var btn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (btn) { btn.disabled = true; btn.dataset.prevText = btn.textContent; btn.textContent = 'Sending…'; }

        // Build payload
        var data = {};
        new FormData(form).forEach((v,k) => { data[k]=v; });

        // Turnstile token if enabled
        if (cfg.ENABLE_TURNSTILE) {
          var tokenInput = form.querySelector('input[name="cf-turnstile-response"]');
          if (!tokenInput || !tokenInput.value) {
            alert('Please complete the anti-spam check.');
            if (btn) { btn.disabled=false; btn.textContent = btn.dataset.prevText || 'Submit'; }
            return;
          }
          data.turnstileToken = tokenInput.value;
        }

        // Minimal client-side validation
        if (!data.firstName || !data.lastName || !data.email) {
          alert('Please complete required fields.');
          if (btn) { btn.disabled=false; btn.textContent = btn.dataset.prevText || 'Submit'; }
          return;
        }

        try {
          var res = await fetch(API, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data),
            mode: 'cors',
            credentials: 'omit'
          });
          if (!res.ok) throw new Error('Request failed: ' + res.status);
          var out = await res.json().catch(() => ({}));
          alert(out.message || 'Thanks! We received your message and will get back to you shortly.');
          form.reset();
          // Reset Turnstile if present
          if (window.turnstile && cfg.ENABLE_TURNSTILE) turnstile.reset();
        } catch (err) {
          console.error(err);
          alert('Sorry, something went wrong. Please call our office or try again.');
        } finally {
          if (btn) { btn.disabled=false; btn.textContent = btn.dataset.prevText || 'Submit'; }
        }
      });
    });

    // Render Turnstile widget if enabled and placeholder exists
    if (cfg.ENABLE_TURNSTILE && cfg.TURNSTILE_SITE_KEY) {
      var ph = document.getElementById('cf-turnstile');
      if (ph) {
        var s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        s.async = true; s.defer = true;
        document.head.appendChild(s);
        // The widget auto-renders on div[data-sitekey]
        ph.setAttribute('data-sitekey', cfg.TURNSTILE_SITE_KEY);
        ph.classList.add('cf-turnstile');
      }
    }
  });
})();
