// FAQ Quick-Nav (Option A) — single-active pill + scrollspy
// Works with the current .faq-categories markup in faq.html

(function () {
  const container = document.querySelector('.faq-categories');
  if (!container) return;

  const pills = Array.from(container.querySelectorAll('.faq-category'));
  const sectionIds = ['general-care', 'treatments', 'comfort', 'costs', 'post-op'];

  // Map each pill to a section id (by order, unless a data-target already exists)
  pills.forEach((pill, i) => {
    if (!pill.dataset.target) pill.dataset.target = sectionIds[i] || '';
    pill.setAttribute('role', 'tab');
    pill.setAttribute('tabindex', '0');
    pill.setAttribute('aria-controls', pill.dataset.target);
  });
  container.setAttribute('role', 'tablist');

  // Ensure only ONE pill is active
  function setActiveById(id) {
    pills.forEach(p => {
      const on = p.dataset.target === id;
      // remove both possible class names to avoid legacy collisions
      p.classList.toggle('is-active', on);
      p.classList.toggle('active', on);
      p.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  // Click + keyboard
  let pendingClickId = null;
  let pendingTimer = null;

  function handleActivate(id) {
    if (!id) return;
    setActiveById(id);
    if (typeof scrollToSection === 'function') {
      pendingClickId = id;
      clearTimeout(pendingTimer);
      scrollToSection(id);
      // allow the smooth scroll to settle before scrollspy can override
      pendingTimer = setTimeout(() => (pendingClickId = null), 1000);
    }
  }

  pills.forEach(pill => {
    pill.addEventListener('click', () => handleActivate(pill.dataset.target));
    pill.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleActivate(pill.dataset.target);
      }
    });
  });

  // Measure sticky header + pills to offset the scrollspy correctly
  function measureTopOffset() {
    const header = document.querySelector('.site-header');
    const pillsBar = container;
    const headerH = header ? header.getBoundingClientRect().height : 0;
    const pillsH = pillsBar ? pillsBar.getBoundingClientRect().height : 0;
    return Math.round(headerH + pillsH + 16); // small cushion
  }

  const topOffset = measureTopOffset();
  // Also make anchor jumps land with room to breathe
  document.querySelectorAll('.faq-section').forEach(sec => {
    sec.style.scrollMarginTop = (topOffset + 8) + 'px';
  });

  // Scrollspy: highlights the section nearest the top (below the sticky bar)
  const sections = sectionIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const io = new IntersectionObserver(entries => {
    // choose the first section intersecting closest to the top
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

    if (!visible.length) return;

    const id = visible[0].target.id;
    if (pendingClickId && id !== pendingClickId) return; // don't fight a recent click
    setActiveById(id);
  }, {
    // start "view" below the sticky header + pills bar
    rootMargin: `-${topOffset}px 0px -60% 0px`,
    threshold: [0.05, 0.25, 0.5]
  });

  sections.forEach(sec => io.observe(sec));

  // Initial state: from hash if present, otherwise first section
  const initial = location.hash && sectionIds.includes(location.hash.slice(1))
    ? location.hash.slice(1)
    : (sections[0] && sections[0].id);
  setActiveById(initial);
})();
