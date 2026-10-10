import { initDiscountTimer } from './discount-timer.mjs?v=20261010';
import { improveVisibleTypography } from './typography.mjs';
import { initTestimonialCarousel } from './testimonial-carousel.mjs';
import { initTelegramSalesMode } from './telegram-sales.mjs';
import { initMetrikaForPage } from './metrika.mjs';
import { initStickyCta } from './sticky-cta.mjs?v=20261010';
import { initMotion, initDemoVideos } from './motion.mjs';
import { initThemeToggle } from './theme.mjs';

initThemeToggle(document);
improveVisibleTypography();
initTestimonialCarousel(document.querySelector('[data-testimonial-carousel]'));

initTelegramSalesMode(document, globalThis.location.pathname);
initDiscountTimer(document, globalThis.location.pathname);
initStickyCta(document, globalThis.location.pathname);
initMetrikaForPage(document, globalThis.location.pathname);
initMotion(document);
initDemoVideos(document);
