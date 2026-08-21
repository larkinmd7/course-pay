import { improveVisibleTypography } from './typography.mjs';
import { initHeroOrbit } from './hero-orbit.mjs';
import { initTestimonialCarousel } from './testimonial-carousel.mjs';

improveVisibleTypography();
initHeroOrbit(document.querySelector('[data-hero-orbit]'));
initTestimonialCarousel(document.querySelector('[data-testimonial-carousel]'));

const dialog = document.querySelector('#payment-dialog');
const slot = document.querySelector('#payment-slot');
const titleLabel = document.querySelector('[data-payment-title-label]');
const titleName = document.querySelector('[data-payment-title-name]');

const tariffNames = {
  test: 'Тестовая оплата',
  base: 'Старт',
  middle: 'Средний',
  pro: 'Продвинутый',
};

document.querySelectorAll('[data-open-payment]').forEach((button) => {
  button.addEventListener('click', () => {
    const tariff = button.dataset.openPayment;
    const source = document.querySelector(`[data-payment-form="${tariff}"]`);

    titleLabel.textContent = tariff === 'test' ? 'Проверка' : 'Тариф';
    titleName.textContent = tariffNames[tariff] ?? 'Участие в программе';
    slot.replaceChildren(source.content.cloneNode(true));
    dialog.showModal();
    globalThis.kassaConstructForm?.main?.updateHandlers();
  });
});

document.querySelector('[data-close-payment]').addEventListener('click', () => dialog.close());

dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
