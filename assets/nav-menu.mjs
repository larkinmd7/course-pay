// Мобильное меню: до 900px основная навигация скрыта, вместо неё — бургер.
export function initNavMenu(doc) {
  const toggle = doc.querySelector('[data-nav-toggle]');
  const panel = doc.querySelector('[data-nav-panel]');
  if (!toggle || !panel) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    panel.hidden = !open;
    doc.documentElement.classList.toggle('nav-open', open);
  };

  setOpen(false);

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  // Клик по ссылке — закрываем, иначе панель перекрывает цель перехода.
  panel.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  // Возврат на десктоп при открытой панели оставлял её висеть поверх контента.
  const wide = globalThis.matchMedia('(min-width: 901px)');
  wide.addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}
