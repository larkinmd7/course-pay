const TELEGRAM_USERNAME = 'starsevast';

const tariffNames = {
  base: 'Старт',
  middle: 'Средний',
  pro: 'Продвинутый',
};

export function isTelegramSalesPath(pathname = '') {
  return /^\/tg(?:\/|$)/.test(pathname);
}

/* Сообщение подставляется в поле ввода готовым, его остаётся отправить.
   Раньше здесь было «У меня вопрос по тарифу…: » с двоеточием — человек должен
   был сам придумать вопрос, и часть людей на этом месте закрывала телеграм.
   Теперь это заявленное намерение плюс конкретный запрос, на который легко
   ответить первым сообщением. Отправить за человека нельзя: Telegram
   намеренно не даёт сайту слать сообщения от его имени. */
export function getTariffMessage(tariff) {
  const tariffName = tariffNames[tariff];
  if (!tariffName) return 'Хочу на практикум «ИИ для экспертов». Подскажите тарифы и условия.';
  return `Хочу на тариф «${tariffName}» практикума «ИИ для экспертов». Подскажите стоимость и условия.`;
}

export function buildTelegramContactUrl(message, username = TELEGRAM_USERNAME) {
  const url = new URL(`https://t.me/${username}`);
  return `${url.href}?text=${encodeURIComponent(message)}`;
}

function createContactLink(button, tariff, root) {
  const link = root.createElement('a');
  link.className = `${button.className} telegram-contact-button`;
  link.href = buildTelegramContactUrl(getTariffMessage(tariff));
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

  root.querySelectorAll('[data-pay-link]').forEach((button) => {
    const tariff = button.dataset.payLink;
    if (!tariffNames[tariff]) return;
    button.replaceWith(createContactLink(button, tariff, root));
  });

  const generalContact = root.querySelector('[data-telegram-general]');
  if (generalContact) {
    generalContact.href = buildTelegramContactUrl(getTariffMessage());
    generalContact.hidden = false;
  }

  root.querySelector('[data-telegram-questions]')?.removeAttribute('hidden');
  return true;
}
