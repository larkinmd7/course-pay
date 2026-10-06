import { getDiscountDeadline, getRemainingSeconds, TARIFF_PRICES } from './discount-timer.mjs';
import { isTelegramSalesPath } from './telegram-sales.mjs';

function formatClock(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

/**
 * Показывает путь к оплате там, где человек находится: строка обратного отсчёта
 * на первом экране и липкая панель с ценой и кнопкой после него.
 * Дедлайн берётся из discount-timer, второго источника истины не появляется.
 */
export function initStickyCta(root = document, pathname = globalThis.location?.pathname ?? '') {
  if (isTelegramSalesPath(pathname)) return undefined;

  const bar = root.querySelector('[data-sticky-cta]');
  const clocks = root.querySelectorAll('[data-deadline-clock]');
  const wraps = root.querySelectorAll('[data-deadline-wrap]');
  const priceNodes = root.querySelectorAll('[data-sticky-price]');
  if (!bar && clocks.length === 0) return undefined;

  let storage;
  try { storage = globalThis.localStorage; } catch { /* без хранилища показываем полные цены */ }
  const deadline = getDiscountDeadline(storage);

  const render = () => {
    const remaining = getRemainingSeconds(deadline);
    const active = remaining > 0;
    const clock = formatClock(remaining);
    clocks.forEach((node) => { node.textContent = clock; });
    wraps.forEach((node) => { node.hidden = !active; });
    priceNodes.forEach((node) => {
      node.textContent = `от ${active ? TARIFF_PRICES.base.discounted : TARIFF_PRICES.base.full}`;
    });
  };

  render();
  const interval = globalThis.setInterval(render, 1000);

  const hero = root.querySelector('.hero');
  if (bar && hero && typeof globalThis.IntersectionObserver === 'function') {
    let heroVisible = true;
    let pricingVisible = false;
    const sync = () => { bar.dataset.visible = !heroVisible && !pricingVisible ? 'true' : 'false'; };
    const pricing = root.querySelector('#pricing');
    const observer = new globalThis.IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === hero) heroVisible = entry.isIntersecting;
        if (entry.target === pricing) pricingVisible = entry.isIntersecting;
      });
      sync();
    });
    observer.observe(hero);
    if (pricing) observer.observe(pricing);
    sync();
  }

  return () => globalThis.clearInterval(interval);
}
