export function calculatePointerParallax(pointer, rect, maxOffset = 28) {
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  const normalizedX = ((pointer.clientX - rect.left) / width) * 2 - 1;
  const normalizedY = ((pointer.clientY - rect.top) / height) * 2 - 1;
  const clamp = (value) => Math.max(-1, Math.min(1, value));

  return {
    x: Math.round(clamp(normalizedX) * maxOffset),
    y: Math.round(clamp(normalizedY) * maxOffset),
  };
}

export function initHeroOrbit(orbit, surface = orbit?.closest('.hero')) {
  if (!orbit || !surface) return () => {};

  const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const finePointer = globalThis.matchMedia?.('(pointer: fine)').matches ?? true;
  if (reducedMotion || !finePointer) return () => {};

  let frame = 0;
  const setDepth = (x, y) => {
    orbit.style.setProperty('--orbit-far-x', `${x * 0.35}px`);
    orbit.style.setProperty('--orbit-far-y', `${y * 0.35}px`);
    orbit.style.setProperty('--orbit-mid-x', `${x * 0.65}px`);
    orbit.style.setProperty('--orbit-mid-y', `${y * 0.65}px`);
    orbit.style.setProperty('--orbit-near-x', `${x}px`);
    orbit.style.setProperty('--orbit-near-y', `${y}px`);
  };

  const onPointerMove = (event) => {
    const offset = calculatePointerParallax(event, surface.getBoundingClientRect());
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => setDepth(offset.x, offset.y));
  };

  const onPointerLeave = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => setDepth(0, 0));
  };

  surface.addEventListener('pointermove', onPointerMove, { passive: true });
  surface.addEventListener('pointerleave', onPointerLeave, { passive: true });

  return () => {
    cancelAnimationFrame(frame);
    surface.removeEventListener('pointermove', onPointerMove);
    surface.removeEventListener('pointerleave', onPointerLeave);
  };
}
