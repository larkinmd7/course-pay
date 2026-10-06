/**
 * Движение страницы: появление блоков при скролле и счёт крупных чисел.
 *
 * Три правила, которых держимся:
 * 1. Сначала контент, потом анимация. Разметка видна и без JS — класс состояния
 *    вешается скриптом, поэтому при отключённом JS ничего не прячется.
 * 2. prefers-reduced-motion выключает всё. Это не настройка «для галочки»:
 *    у части людей движение вызывает тошноту и головную боль.
 * 3. Анимация играет один раз. Повторный проигрыш при каждом проскролле
 *    превращает страницу в мигалку.
 */

const REVEAL_SELECTOR = [
  '.section-head',
  '.module',
  '.example-card',
  '.case-card',
  '.format-card',
  '.price-card',
  '.factory-steps li',
  '.factory-shots figure',
  '.outcomes-cards article',
  '.product-proof article',
  '.education-card',
  '.facts div',
  '.section-cta',
  '.factory-result',
].join(',');

function prefersReducedMotion() {
  try {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  } catch {
    return false;
  }
}

/**
 * Разбивает число на части, чтобы анимировать только цифры и не трогать «₽», «+», «часов».
 * Группа цифр обязана начинаться и заканчиваться цифрой — иначе пробел-разделитель
 * уедет из текста и «200 млн ₽» склеится в «200млн ₽».
 * Диапазоны вроде «20–30 часов» и «с 900 до 13 700» отбрасываются: досчитывать
 * до одного из двух чисел бессмысленно, а до обоих — нечитаемо.
 */
function parseNumeric(text) {
  const match = text.match(/^(\D*?)(\d(?:[\d\s ]*\d)?)(\D*)$/s);
  if (!match) return null;
  const digits = match[2].replace(/[\s ]/g, '');
  if (digits.length === 0 || digits.length > 9) return null;
  const value = Number(digits);
  if (!Number.isFinite(value) || value < 10) return null;
  const grouped = /[\s ]/.test(match[2]);
  return { prefix: match[1], value, suffix: match[3], grouped };
}

function formatValue(value, grouped) {
  const text = String(Math.round(value));
  return grouped ? text.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : text;
}

function countUp(node, parsed) {
  const duration = 900;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    // easeOutCubic: быстрый старт, мягкая остановка — читается как «досчитало», а не «оборвалось»
    const eased = 1 - (1 - progress) ** 3;
    node.textContent = parsed.prefix + formatValue(parsed.value * eased, parsed.grouped) + parsed.suffix;
    if (progress < 1) globalThis.requestAnimationFrame(step);
  };
  globalThis.requestAnimationFrame(step);
}

/**
 * Включает появление блоков и счётчики чисел.
 * @param {ParentNode} root
 * @returns {undefined | (() => void)} функция отключения наблюдателя
 */
export function initMotion(root = document) {
  if (typeof globalThis.IntersectionObserver !== 'function') return undefined;
  if (prefersReducedMotion()) return undefined;

  const revealed = [...root.querySelectorAll(REVEAL_SELECTOR)];
  const counters = [...root.querySelectorAll('[data-count-up]')]
    .map((node) => ({ node, parsed: parseNumeric(node.textContent ?? '') }))
    .filter((item) => item.parsed !== null);

  if (revealed.length === 0 && counters.length === 0) return undefined;

  revealed.forEach((node) => { node.dataset.reveal = 'idle'; });
  counters.forEach(({ node, parsed }) => {
    // Резервируем ширину заранее, иначе соседний текст прыгает по мере роста числа.
    node.style.minWidth = `${node.getBoundingClientRect().width}px`;
    node.style.display = 'inline-block';
    node.textContent = parsed.prefix + formatValue(0, parsed.grouped) + parsed.suffix;
  });

  const counterByNode = new Map(counters.map((item) => [item.node, item.parsed]));

  const observer = new globalThis.IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const node = entry.target;
      if (node.dataset.reveal === 'idle') node.dataset.reveal = 'in';
      const parsed = counterByNode.get(node);
      if (parsed) countUp(node, parsed);
      observer.unobserve(node);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });

  revealed.forEach((node) => observer.observe(node));
  counters.forEach(({ node }) => observer.observe(node));

  return () => observer.disconnect();
}
