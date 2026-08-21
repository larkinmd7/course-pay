export function calculateCarouselDelta(cardWidth, gap, direction) {
  const sign = direction < 0 ? -1 : 1;
  return (cardWidth + gap) * sign;
}

export function initTestimonialCarousel(root) {
  if (!root) return;

  const track = root.querySelector('[data-testimonial-track]');
  const previous = root.querySelector('[data-testimonial-prev]');
  const next = root.querySelector('[data-testimonial-next]');
  const firstCard = track?.querySelector('.testimonial-card');

  if (!track || !previous || !next || !firstCard) return;

  const updateControls = () => {
    const maximum = Math.max(0, track.scrollWidth - track.clientWidth);
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= maximum - 2;
  };

  const move = (direction) => {
    const styles = globalThis.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    const cardWidth = firstCard.getBoundingClientRect().width;

    track.scrollBy({
      left: calculateCarouselDelta(cardWidth, gap, direction),
      behavior: 'smooth',
    });
  };

  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('scroll', updateControls, { passive: true });

  globalThis.ResizeObserver
    ? new ResizeObserver(updateControls).observe(track)
    : globalThis.addEventListener('resize', updateControls);

  updateControls();
}
