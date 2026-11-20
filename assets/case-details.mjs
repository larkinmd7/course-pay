const NARROW = '(max-width: 900px) and (orientation: portrait)';

/* Сжатая карточка кейса и поп-ап с подробностями — надстройка над общей
   каруселью, а не её замена. Свайп, залипание и подгонку высоты трека делает
   carousel.mjs; здесь только прячем длинную часть карточки и показываем её
   по кнопке. Высоту пересчитывать не нужно: карусель следит за треком через
   ResizeObserver и сама подхватит новый размер.

   Зачем вообще: полный текст кейса растягивал карточку на два экрана. Видно
   должно быть главное — роль, результат, лицо и имя. Остальное по запросу. */
export function initCaseDetails(root = document) {
  const track = root.querySelector('#cases [data-carousel-track]');
  if (!track) return false;

  const cards = [...track.children];
  if (!cards.length) return false;

  const view = root.defaultView || globalThis;

  const dialog = root.createElement('dialog');
  dialog.className = 'case-dialog';
  dialog.innerHTML =
    '<div class="case-dialog-head"><strong data-dialog-title></strong>'
    + '<button class="case-dialog-close" type="button" aria-label="Закрыть">✕</button></div>'
    + '<div class="case-dialog-body" data-dialog-body></div>';
  root.body.append(dialog);

  const title = dialog.querySelector('[data-dialog-title]');
  const body = dialog.querySelector('[data-dialog-body]');
  dialog.querySelector('.case-dialog-close').addEventListener('click', () => dialog.close());
  /* У dialog попадание в подложку приходит на сам элемент. */
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  function openCard(card) {
    title.textContent = card.querySelector('h3')?.textContent ?? 'Кейс участника';
    body.replaceChildren();
    [...card.children].forEach((node) => {
      /* Кнопка в поп-апе бессмысленна, заголовок уже в шапке. */
      if (node.classList.contains('case-more') || node.tagName === 'H3') return;
      body.append(node.cloneNode(true));
    });
    dialog.showModal();
  }

  cards.forEach((card) => {
    const more = root.createElement('button');
    more.type = 'button';
    more.className = 'case-more';
    more.textContent = 'Подробнее';
    const name = card.querySelector('h3')?.textContent;
    if (name) more.setAttribute('aria-label', `Подробнее о кейсе «${name}»`);
    more.addEventListener('click', () => openCard(card));
    card.append(more);
  });

  const narrow = view.matchMedia(NARROW);
  const apply = () => {
    root.body.classList.toggle('cases-compact', narrow.matches);
    if (!narrow.matches && dialog.open) dialog.close();
  };
  narrow.addEventListener('change', apply);
  apply();
  return true;
}
