/* Спільний скрипт юридичних сторінок: перемикач мови + рік. */
(() => {
  'use strict';
  const set = l => {
    document.documentElement.lang = l;
    localStorage.setItem('ix_lang', l);
    document.querySelectorAll('.lang button[data-lang]')
      .forEach(b => b.classList.toggle('on', b.dataset.lang === l));
    const t = document.querySelector('title[data-uk]');
    if (t) t.textContent = l === 'uk' ? t.dataset.uk : t.dataset.en;
    const description = document.querySelector('meta[name="description"][data-uk]');
    if (description) description.content = l === 'uk' ? description.dataset.uk : description.dataset.en;
  };
  set(localStorage.getItem('ix_lang') === 'en' ? 'en' : 'uk');
  document.querySelectorAll('.lang button[data-lang]')
    .forEach(b => b.addEventListener('click', () => set(b.dataset.lang)));

  const y = document.getElementById('yr');
  if (y) y.textContent = new Date().getFullYear();

  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    scrollTo({ top: t.getBoundingClientRect().top + scrollY - 92, behavior: 'smooth' });
  }));
})();
