import { initDiscountTimer } from './discount-timer.mjs?v=20261014-payment';
import { improveVisibleTypography } from './typography.mjs';
import { initTestimonialCarousel } from './testimonial-carousel.mjs';
import { initTelegramSalesMode } from './telegram-sales.mjs?v=20261020-term';
import { initMetrikaForPage } from './metrika.mjs';
import { initStickyCta } from './sticky-cta.mjs?v=20261014-payment';
import { initMotion, initDemoVideos } from './motion.mjs';
import { initThemeToggle } from './theme.mjs';
import { initNavMenu } from './nav-menu.mjs';
import { initCarousels } from './carousel.mjs';

initThemeToggle(document);
initNavMenu(document);
initCarousels(document);
improveVisibleTypography();
initTestimonialCarousel(document.querySelector('[data-testimonial-carousel]'));

initTelegramSalesMode(document, globalThis.location.pathname);
initDiscountTimer(document, globalThis.location.pathname);
initStickyCta(document, globalThis.location.pathname);
initMetrikaForPage(document, globalThis.location.pathname);
initMotion(document);
initDemoVideos(document);
