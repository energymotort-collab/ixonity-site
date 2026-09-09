(() => {
  'use strict';
  document.querySelectorAll('video[data-src]').forEach(video => {
    const load = () => {
      if (!video.dataset.src) return;
      video.src = video.dataset.src;
      video.removeAttribute('data-src');
      video.load();
    };
    new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      load();
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) video.play().catch(() => {});
    }, { rootMargin:'320px' }).observe(video);
  });
  document.querySelectorAll('[data-year]').forEach(node => { node.textContent = new Date().getFullYear(); });
})();
