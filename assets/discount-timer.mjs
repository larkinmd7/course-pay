import { isTelegramSalesPath, buildTelegramContactUrl } from './telegram-sales.mjs';

export const DISCOUNT_KEY = 'course-pay-discount-deadline-20261010';
export const DISCOUNT_DURATION = 24 * 60 * 60 * 1000;
export const TARIFF_PRICES = {
  base: { name: 'Старт', full: '49 900 ₽', discounted: '39 900 ₽' },
  middle: { name: 'Средний', full: '69 900 ₽', discounted: '59 900 ₽' },
  pro: { name: 'Продвинутый', full: '139 900 ₽', discounted: '109 900 ₽' },
};

export function getDiscountDeadline(storage, now = Date.now()) {
  try {
    const stored = storage.getItem(DISCOUNT_KEY);
    if (stored !== null) {
      const deadline = Number(stored);
      return Number.isFinite(deadline) && deadline > 0 && deadline <= now + DISCOUNT_DURATION ? deadline : 0;
    }
    const deadline = now + DISCOUNT_DURATION;
    storage.setItem(DISCOUNT_KEY, String(deadline));
    return deadline;
  } catch {
    return 0;
  }
}

export function getRemainingSeconds(deadline, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function initDiscountTimer(root = document, pathname = globalThis.location?.pathname ?? '') {
  if (isTelegramSalesPath(pathname)) return;
  const banner = root.querySelector('[data-discount-banner]');
  if (!banner) return;
  let storage;
  try { storage = globalThis.localStorage; } catch { /* Full prices without persistent storage. */ }
  let deadline = getDiscountDeadline(storage);
  let previousActive;
  const render = () => {
    const remaining = getRemainingSeconds(deadline);
    const active = remaining > 0;
    banner.hidden = !active;
    if (active !== previousActive) {
      root.querySelectorAll('[data-pay-link]').forEach((button) => {
        const tariff = TARIFF_PRICES[button.dataset.payLink];
        if (!tariff) return;
        const card = button.closest('.price-card');
        const price = active ? tariff.discounted : tariff.full;
        card.querySelector('.price-before').hidden = !active;
        card.querySelector('.price-current').textContent = price;
        card.querySelector('.price-condition').textContent = active ? 'цена по вашему предложению' : 'полная стоимость';
        button.href = buildTelegramContactUrl(`Хочу оформить тариф «${tariff.name}» практикума «ИИ для экспертов» за ${price}.`);
      });
      previousActive = active;
    }
    const values = [Math.floor(remaining / 3600), Math.floor(remaining % 3600 / 60), remaining % 60];
    root.querySelectorAll('[data-discount-digit]').forEach((digit, index) => {
      digit.textContent = String(values[index]).padStart(2, '0');
    });
  };
  render();
  const interval = globalThis.setInterval(render, 1000);
  root.addEventListener('visibilitychange', render);
  globalThis.addEventListener('storage', (event) => {
    if (event.key !== DISCOUNT_KEY) return;
    deadline = Number(event.newValue) || 0;
    render();
  });
  return () => globalThis.clearInterval(interval);
}
