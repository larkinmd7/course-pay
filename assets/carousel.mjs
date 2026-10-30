// Универсальная карусель для секций, которые на узком экране листаются.
// Трек — обычный горизонтальный скролл со snap: свайп работает и без JS,
// стрелки, точки и подгонка высоты — надстройка поверх.
//
// Главное правило файла: во время скролла ничего не измеряем. Любое чтение
// геометрии (getBoundingClientRect, offsetLeft, getComputedStyle) заставляет
// браузер пересчитать раскладку синхронно, и на каждом кадре свайпа это
// превращается в заметные рывки. Все размеры снимаются один раз в measure()
// и дальше только читаются из кэша.

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

  // Карусель включается только там же, где её включает CSS. На десктопе
  // и в альбомной ориентации секция остаётся сеткой, и трогать её нельзя.
  const narrow = globalThis.matchMedia('(max-width: 900px) and (orientation: portrait)');

  // Подгонка высоты — только там, где карточки намеренно разной длины.
  const fits = track.hasAttribute('data-carousel-fit');

  const cache = { step: 0, width: 0, perView: 1, heights: [], offsets: [], clientWidth: 0, maxScroll: 0 };
  let appliedHeight = -1;

  const release = () => {
    track.classList.remove('is-fitted', 'is-easing');
    track.style.height = '';
    appliedHeight = -1;
  };

  const measure = () => {
    const styles = globalThis.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;

    if (fits && narrow.matches) {
      const keep = track.style.height;
      track.style.height = 'auto';
      cache.heights = cards.map((card) => card.getBoundingClientRect().height);
      track.style.height = keep;
    } else {
      cache.heights = [];
    }

    cache.width = cards[0].getBoundingClientRect().width;
    cache.step = cache.width + gap;
    cache.clientWidth = track.clientWidth;
    cache.maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    cache.perView = visibleCardCount(cache.clientWidth, cache.width, gap);
    cache.offsets = cards.map((card) => card.offsetLeft - cards[0].offsetLeft);
  };

  const dots = cards.map((_, i) => {
    if (!dotsBox) return null;
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Карточка ${i + 1} из ${cards.length}`);
    dot.addEventListener('click', () => {
      track.scrollTo({ left: cache.offsets[i] ?? cache.step * i, behavior: 'smooth' });
    });
    dotsBox.append(dot);
    return dot;
  });

  const windowHeight = (i) => {
    const from = Math.max(0, Math.min(i, cards.length - 1));
    const to = Math.min(cards.length, from + cache.perView);
    return Math.max(...cache.heights.slice(from, to));
  };

  // Высота трека НЕ пересчитывается во время свайпа. Запись height перекладывает
  // всю страницу ниже, и на каждом кадре жеста это главный источник рывков.
  // Поэтому: на старте жеста один раз разжимаем трек до самой высокой карточки,
  // а когда скролл остановился — плавно сжимаем до той, что осталась в кадре.
  const setHeight = (value, animate) => {
    const next = Math.ceil(value);
    if (next <= 0 || next === appliedHeight) return;
    appliedHeight = next;
    track.classList.add('is-fitted');
    track.classList.toggle('is-easing', Boolean(animate));
    track.style.height = `${next}px`;
  };

  const expand = () => {
    if (!fits || !narrow.matches || !cache.heights.length || !cache.step) return;
    // Разжимаем до пары, между которыми сейчас идёт скролл, а не до самой
    // высокой карточки в наборе: иначе трек подскакивает на пару сотен
    // пикселей в момент касания. scrollLeft читать дёшево — раскладка
    // от этого не пересчитывается, в отличие от записи height.
    const index = Math.floor(track.scrollLeft / cache.step);
    const pair = Math.max(windowHeight(index), windowHeight(index + 1));
    // Без анимации: пока высота едет, карточка выше текущей обрезается
    // и в кадре виден срезанный низ.
    if (pair > appliedHeight) setHeight(pair, false);
  };

  const settle = () => {
    if (!narrow.matches) { release(); return; }
    if (!fits || !cache.heights.length || !cache.step) return;

    const left = track.scrollLeft;
    let index;
    if (left >= cache.maxScroll - 2) {
      // В крайнем правом положении скролл упирается в край и перестаёт быть
      // кратным шагу: берём последнее окно, иначе высота промахивается.
      index = cards.length - cache.perView;
    } else {
      const offsets = cache.offsets;
      index = 0;
      while (index < offsets.length - 1 && offsets[index + 1] <= left + cache.step / 2) index += 1;
    }
    setHeight(windowHeight(index), true);
  };

  const paint = () => {
    const left = track.scrollLeft;

    if (prev) prev.disabled = left <= 2;
    if (next) next.disabled = left >= cache.maxScroll - 2;

    const active = cache.step ? Math.round(left / cache.step) : 0;
    dots.forEach((dot, i) => {
      if (!dot) return;
      // Точка гаснет, если её карточка уже целиком в кадре: иначе на широком
      // экране половина точек выглядит недостижимой.
      const shown = i >= active && i < active + cache.perView;
      dot.classList.toggle('is-active', shown);
      dot.hidden = cards.length <= cache.perView;
      if (shown) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });

    root.classList.toggle('is-static', cards.length <= cache.perView && cache.maxScroll < 2);
  };

  // Один кадр — одна отрисовка. Без этого обработчик скролла срабатывает
  // чаще кадров и работа делается впустую.
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; paint(); });
  };

  const move = (direction) => {
    track.scrollBy({ left: cache.step * direction, behavior: 'smooth' });
  };

  prev?.addEventListener('click', () => move(-1));
  next?.addEventListener('click', () => move(1));
  // Пока палец ведёт — только стрелки и точки, ни одной записи в геометрию.
  // Конец жеста ловим таймером: scrollend есть не везде.
  let settleTimer = 0;
  track.addEventListener('scroll', () => {
    expand();
    schedule();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 140);
  }, { passive: true });

  const remeasure = () => { measure(); paint(); settle(); };

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
  narrow.addEventListener('change', () => { lastWidth = 0; appliedHeight = -1; remeasure(); });

  // Шрифты и ленивые картинки меняют высоту уже после первого замера.
  document.fonts?.ready.then(remeasure).catch(() => {});
  globalThis.addEventListener('load', remeasure, { once: true });

  remeasure();
}

export function initCarousels(doc) {
  doc.querySelectorAll('[data-carousel]').forEach(initCarousel);
}
