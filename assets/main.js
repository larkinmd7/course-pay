import { improveVisibleTypography } from './typography.mjs';
import { initHeroOrbit } from './hero-orbit.mjs';
import { initTestimonialCarousel } from './testimonial-carousel.mjs';
import { initTelegramSalesMode } from './telegram-sales.mjs';
import { initMetrikaForPage } from './metrika.mjs';

improveVisibleTypography();
initHeroOrbit(document.querySelector('[data-hero-orbit]'));
initTestimonialCarousel(document.querySelector('[data-testimonial-carousel]'));

initTelegramSalesMode(document, globalThis.location.pathname);
initMetrikaForPage(document, globalThis.location.pathname);
