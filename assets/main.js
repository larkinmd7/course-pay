const dialog = document.querySelector('#payment-dialog');
const slot = document.querySelector('#payment-slot');
const title = document.querySelector('#payment-title');

const tariffNames = {
  base: 'Тариф «База»',
  middle: 'Тариф «Средний»',
  pro: 'Тариф «Профи»',
};

document.querySelectorAll('[data-open-payment]').forEach((button) => {
  button.addEventListener('click', () => {
    const tariff = button.dataset.openPayment;
    const source = document.querySelector(`[data-payment-form="${tariff}"]`);

    title.textContent = tariffNames[tariff] ?? 'Оплата участия';
    slot.replaceChildren(source.content.cloneNode(true));
    dialog.showModal();
    globalThis.kassaConstructForm?.main?.updateHandlers();
  });
});

document.querySelector('[data-close-payment]').addEventListener('click', () => dialog.close());

dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
