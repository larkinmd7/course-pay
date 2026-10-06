import { initDiscountTimer } from './discount-timer.mjs';
import { improveVisibleTypography } from './typography.mjs';
import { initHeroOrbit } from './hero-orbit.mjs';
import { initTestimonialCarousel } from './testimonial-carousel.mjs';
import { initTelegramSalesMode } from './telegram-sales.mjs';
import { initMetrikaForPage } from './metrika.mjs';
import { initStickyCta } from './sticky-cta.mjs';
import { initMotion, initDemoVideos } from './motion.mjs';
import { initThemeToggle } from './theme.mjs';

initThemeToggle(document);
improveVisibleTypography();
initHeroOrbit(document.querySelector('[data-hero-orbit]'));
initTestimonialCarousel(document.querySelector('[data-testimonial-carousel]'));

initTelegramSalesMode(document, globalThis.location.pathname);
initDiscountTimer(document, globalThis.location.pathname);
initStickyCta(document, globalThis.location.pathname);
initMetrikaForPage(document, globalThis.location.pathname);
initMotion(document);
initDemoVideos(document);
