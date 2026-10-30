// Универсальная карусель для секций, которые раньше были сеткой.
// Трек — обычный горизонтальный скролл со snap: на мобильном работает свайпом
// без JS, стрелки и точки — только надстройка для десктопа и клавиатуры.

export function visibleCardCount(trackWidth, cardWidth, gap) {
  if (!cardWidth) return 1;
  return Math.max(1, Math.round((trackWidth + gap) / (cardWidth + gap)));
}

export function initCarousel(root) {
  if (!root) return;

  const track = root.querySelector('[data-carousel-track]');
  if (!track) return;

  const cards = [...track.children];
  if (cards.length < 2) return;

  const prev = root.querySelector('[data-carousel-prev]');
  const next = root.querySelector('[data-carousel-next]');
  const dotsBox = root.querySelector('[data-carousel-dots]');

  const metrics = () => {
    const styles = globalThis.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    const width = cards[0].getBoundingClientRect().width;
    return { gap, width, step: width + gap };
  };

  const dots = cards.map((_, i) => {
    if (!dotsBox) return null;
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Карточка ${i + 1} из ${cards.length}`);
    dot.addEventListener('click', () => {
      track.scrollTo({ left: metrics().step * i, behavior: 'smooth' });
    });
    dotsBox.append(dot);
    return dot;
  });

  // Высота трека под то, что сейчас в кадре. Короткая карточка не должна
  // тянуться до самой длинной — иначе под текстом висит пустое поле.
  let heights = [];
  const measure = () => {
    if (!track.hasAttribute('data-carousel-fit') || !narrow.matches) return;
    const keep = track.style.height;
    track.style.height = 'auto';
    heights = cards.map((card) => card.getBoundingClientRect().height);
    track.style.height = keep;
  };

  // Карусель включается только там же, где её включает CSS. На десктопе
  // и в альбомной ориентации секция остаётся сеткой, и трогать её нельзя.
  const narrow = globalThis.matchMedia('(max-width: 900px) and (orientation: portrait)');

  // Подгонка высоты — только там, где карточки намеренно разной длины.
  const fits = track.hasAttribute('data-carousel-fit');

  const release = () => {
    track.classList.remove('is-fitted');
    track.style.height = '';
  };

  const fitHeight = () => {
    if (!narrow.matches) { release(); return; }
    if (!fits || !heights.length) return;
    const { width, gap } = metrics();
    const perView = visibleCardCount(track.clientWidth, width, gap);

    const windowHeight = (i) => {
      const from = Math.max(0, Math.min(i, cards.length - 1));
      const to = Math.min(cards.length, from + perView);
      return Math.max(...heights.slice(from, to));
    };

    // Считаем по реальным позициям карточек, а не по шагу: в конце трека
    // скролл упирается в край и перестаёт быть кратным шагу — от этого
    // последняя карточка получала чужую высоту и обрезалась.
    const offsets = cards.map((card) => card.offsetLeft - cards[0].offsetLeft);
    const left = track.scrollLeft;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);

    let value;
    if (left >= maxScroll - 2) {
      // В крайнем правом положении скролл упирается в край и перестаёт быть
      // кратным шагу: считаем по последнему окну, иначе под карточкой
      // оставалось пустое поле, а сама она обрезалась.
      value = windowHeight(cards.length - perView);
    } else {
      let index = 0;
      while (index < offsets.length - 1 && offsets[index + 1] <= left + 1) index += 1;
      const span = (offsets[index + 1] ?? offsets[index]) - offsets[index];
      const progress = span > 0 ? Math.min(1, Math.max(0, (left - offsets[index]) / span)) : 0;
      value = windowHeight(index) + (windowHeight(index + 1) - windowHeight(index)) * progress;
    }

    if (value > 0) {
      track.classList.add('is-fitted');
      track.style.height = `${Math.ceil(value)}px`;
    }
  };

  const sync = () => {
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    if (prev) prev.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft >= max - 2;

    const { step, width, gap } = metrics();
    const active = step ? Math.round(track.scrollLeft / step) : 0;
    const perView = visibleCardCount(track.clientWidth, width, gap);

    dots.forEach((dot, i) => {
      if (!dot) return;
      // Точка гаснет, если её карточка уже целиком в кадре: иначе на широком
      // экране половина точек выглядит недостижимой.
      const shown = i >= active && i < active + perView;
      dot.classList.toggle('is-active', shown);
      dot.hidden = cards.length <= perView;
      if (shown) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });

    root.classList.toggle('is-static', cards.length <= perView && max < 2);
    fitHeight();
  };

  const move = (direction) => {
    track.scrollBy({ left: metrics().step * direction, behavior: 'smooth' });
  };

  prev?.addEventListener('click', () => move(-1));
  next?.addEventListener('click', () => move(1));
  track.addEventListener('scroll', sync, { passive: true });

  const remeasure = () => { measure(); sync(); };

  // Наблюдаем только ширину: высоту трека меняем сами, и реакция на неё
  // уводила бы наблюдатель в бесконечный цикл.
  let lastWidth = 0;
  const onResize = () => {
    const width = track.clientWidth;
    if (width === lastWidth) return;
    lastWidth = width;
    remeasure();
  };

  globalThis.ResizeObserver
    ? new ResizeObserver(onResize).observe(track)
    : globalThis.addEventListener('resize', onResize);

  // Поворот экрана и переход через брейкпоинт: вернуть сетку или собрать трек.
  narrow.addEventListener('change', () => { lastWidth = 0; remeasure(); });

  // Шрифты и ленивые картинки меняют высоту уже после первого замера.
  document.fonts?.ready.then(remeasure).catch(() => {});
  globalThis.addEventListener('load', remeasure, { once: true });

  remeasure();
}

export function initCarousels(doc) {
  doc.querySelectorAll('[data-carousel]').forEach(initCarousel);
}
