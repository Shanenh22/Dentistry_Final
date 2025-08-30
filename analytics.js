/* analytics.js - toggled analytics loader */
(function(){
  var cfg = (window.SITE_CONFIG && window.SITE_CONFIG.ANALYTICS) || {};
  if (!cfg.ENABLE_PLAUSIBLE || !cfg.DOMAIN) return;
  var s = document.createElement('script');
  s.setAttribute('defer','');
  s.setAttribute('data-domain', cfg.DOMAIN);
  s.src = 'https://plausible.io/js/plausible.js';
  document.head.appendChild(s);
})();
