export const METRIKA_COUNTER_ID = 101476340;

export const METRIKA_GOALS = Object.freeze({
  base: 'tg_tariff_start_click',
  middle: 'tg_tariff_middle_click',
  pro: 'tg_tariff_advanced_click',
});

export function shouldInitMetrika(pathname = '') {
  return /^\/tg(?:\/|$)/.test(pathname) || /^\/success(?:\/|$)/.test(pathname);
}

export function getMetrikaGoalForTariff(tariff) {
  return METRIKA_GOALS[tariff] ?? null;
}

function ensureMetrikaQueue(runtime) {
  runtime.ym = runtime.ym || function metrikaQueue(...args) {
    (runtime.ym.a = runtime.ym.a || []).push(args);
  };
  runtime.ym.l = runtime.ym.l || Date.now();
}

function loadMetrikaTag(root, runtime) {
  if (root.querySelector('script[data-course-metrika]')) return;

  const script = root.createElement('script');
  script.async = true;
  script.src = 'https://mc.yandex.ru/metrika/tag.js';
  script.dataset.courseMetrika = String(METRIKA_COUNTER_ID);
  root.head.append(script);

  runtime.ym(METRIKA_COUNTER_ID, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  });
}

function scheduleMetrikaTag(root, runtime) {
  const load = () => {
    if (typeof runtime.requestIdleCallback === 'function') {
      runtime.requestIdleCallback(() => loadMetrikaTag(root, runtime), { timeout: 1500 });
      return;
    }
    runtime.setTimeout?.(() => loadMetrikaTag(root, runtime), 0);
  };

  if (root.readyState === 'complete') load();
  else if (typeof runtime.addEventListener === 'function') runtime.addEventListener('load', load, { once: true });
  else loadMetrikaTag(root, runtime);
}

function bindTariffGoals(root, runtime) {
  root.querySelectorAll('[data-telegram-tariff]').forEach((link) => {
    if (link.dataset.metrikaBound === 'true') return;
    const goal = getMetrikaGoalForTariff(link.dataset.telegramTariff);
    if (!goal) return;

    link.dataset.metrikaBound = 'true';
    link.addEventListener('click', () => {
      runtime.ym(METRIKA_COUNTER_ID, 'reachGoal', goal);
    });
  });
}

export function initMetrikaForPage(
  root = document,
  pathname = globalThis.location?.pathname ?? '',
  runtime = globalThis,
) {
  if (!shouldInitMetrika(pathname)) return false;

  ensureMetrikaQueue(runtime);
  scheduleMetrikaTag(root, runtime);
  if (/^\/tg(?:\/|$)/.test(pathname)) bindTariffGoals(root, runtime);
  return true;
}
