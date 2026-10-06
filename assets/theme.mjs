const STORAGE_KEY = 'ai-prime-theme';

/** Читает сохранённый выбор. Приватный режим и запрет хранилища не должны ронять страницу. */
export function readStoredTheme(storage) {
  try {
    const value = storage?.getItem(STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

/**
 * Выбор человека важнее системной настройки, системная — важнее умолчания.
 * @returns {'light'|'dark'}
 */
export function resolveTheme(stored, prefersDark) {
  if (stored === 'dark' || stored === 'light') return stored;
  return prefersDark ? 'dark' : 'light';
}

/**
 * Переключатель темы.
 * Тему на <html> ставит инлайн-скрипт в <head> до первой отрисовки — иначе
 * тёмная тема моргает белым на долю секунды. Здесь только кнопка и хранилище.
 */
export function initThemeToggle(root = document, storage = globalThis.localStorage) {
  const button = root.querySelector('[data-theme-toggle]');
  const html = root.documentElement;
  if (!button || !html) return undefined;

  const media = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
  let stored = readStoredTheme(storage);

  const apply = (theme) => {
    html.dataset.theme = theme;
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.setAttribute('aria-label', theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
  };

  apply(resolveTheme(stored, media?.matches === true));

  const onClick = () => {
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    stored = next;
    try { storage?.setItem(STORAGE_KEY, next); } catch { /* без хранилища выбор живёт до перезагрузки */ }
    apply(next);
  };
  // Пока человек не выбрал сам, следуем за системной настройкой на лету
  const onSystem = (event) => { if (stored === null) apply(event.matches ? 'dark' : 'light'); };

  button.addEventListener('click', onClick);
  media?.addEventListener?.('change', onSystem);

  return () => {
    button.removeEventListener('click', onClick);
    media?.removeEventListener?.('change', onSystem);
  };
}
