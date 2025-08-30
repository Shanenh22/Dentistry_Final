// Smooth-scroll with dynamic sticky offset (site-wide)
(function () {
  // Compute height of sticky things so we don't scroll too far
  function getStickyOffset() {
    let offset = 16; // small breathing room
    const header = document.querySelector('.site-header');
    if (header) offset += header.getBoundingClientRect().height;

    // Include any other sticky bars you use (adjust selectors as needed)
    document.querySelectorAll('.faq-categories, .sticky-quicknav, .faq-pills').forEach(el => {
      const pos = getComputedStyle(el).position;
      if (pos === 'sticky' || pos === 'fixed') {
        offset += el.getBoundingClientRect().height;
      }
    });
    return offset;
  }

  // Intercept clicks on in-page anchor links
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href^="#"]:not([data-no-offset])');
    if (!a) return;

    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;

    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.pageYOffset - getStickyOffset();
    window.scrollTo({ top, behavior: 'smooth' });
    history.pushState(null, '', '#' + id);
  });
})();
