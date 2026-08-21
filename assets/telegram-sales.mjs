const TELEGRAM_USERNAME = 'starsevast';

const tariffNames = {
  base: 'Старт',
  middle: 'Средний',
  pro: 'Продвинутый',
};

export function isTelegramSalesPath(pathname = '') {
  return /^\/tg(?:\/|$)/.test(pathname);
}

export function getTariffQuestion(tariff) {
  const tariffName = tariffNames[tariff];
  if (!tariffName) return 'У меня вопрос по курсу «ИИ для экспертов»: ';
  return `У меня вопрос по тарифу «${tariffName}» в курсе «ИИ для экспертов»: `;
}

export function buildTelegramContactUrl(message, username = TELEGRAM_USERNAME) {
  const url = new URL(`https://t.me/${username}`);
  url.searchParams.set('text', message);
  return url.href;
}

function createContactLink(button, tariff, root) {
  const link = root.createElement('a');
  link.className = `${button.className} telegram-contact-button`;
  link.href = buildTelegramContactUrl(getTariffQuestion(tariff));
  link.target = '_blank';
  link.rel = 'noopener';
  link.dataset.telegramTariff = tariff;
  link.setAttribute('aria-label', `Узнать стоимость тарифа «${tariffNames[tariff]}» у @${TELEGRAM_USERNAME}`);

  const label = root.createElement('span');
  label.textContent = 'Узнать стоимость';
  const username = root.createElement('small');
  username.textContent = `@${TELEGRAM_USERNAME}`;
  link.append(label, username);
  return link;
}

export function initTelegramSalesMode(root = document, pathname = globalThis.location?.pathname ?? '') {
  if (!isTelegramSalesPath(pathname)) return false;

  root.documentElement?.classList.add('telegram-sales-mode');
  root.querySelectorAll('.price').forEach((price) => price.remove());

  root.querySelectorAll('[data-open-payment]').forEach((button) => {
    const tariff = button.dataset.openPayment;
    if (!tariffNames[tariff]) return;
    button.replaceWith(createContactLink(button, tariff, root));
  });

  const generalContact = root.querySelector('[data-telegram-general]');
  if (generalContact) {
    generalContact.href = buildTelegramContactUrl(getTariffQuestion());
    generalContact.hidden = false;
  }

  root.querySelector('[data-telegram-questions]')?.removeAttribute('hidden');
  root.querySelector('#payment-dialog')?.remove();
  return true;
}
