import test from 'node:test';
import assert from 'node:assert/strict';
import { DISCOUNT_KEY, DISCOUNT_DURATION, getDiscountDeadline, getRemainingSeconds } from '../assets/discount-timer.mjs';
const storage = () => {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
};
test('first visit starts 24 hours and return visit preserves original deadline', () => {
  const store = storage();
  const deadline = getDiscountDeadline(store, 1000);
  assert.equal(deadline, 1000 + DISCOUNT_DURATION);
  assert.equal(getDiscountDeadline(store, 5000), deadline);
});
test('expired offer never restarts on return visit', () => {
  const store = storage();
  const deadline = getDiscountDeadline(store, 1000);
  assert.equal(getDiscountDeadline(store, deadline + 1), deadline);
  assert.equal(getRemainingSeconds(deadline, deadline), 0);
  assert.equal(getRemainingSeconds(deadline, deadline + 1), 0);
});
test('missing storage, invalid deadline and excessive future deadline use full price', () => {
  assert.equal(getDiscountDeadline(undefined, 1000), 0);
  for (const value of ['bad', '-1', 'Infinity', String(DISCOUNT_DURATION + 2000)]) {
    const store = storage(); store.setItem(DISCOUNT_KEY, value);
    assert.equal(getDiscountDeadline(store, 1000), 0);
  }
});
test('remaining time includes final second', () => {
  assert.equal(getRemainingSeconds(2000, 1001), 1);
  assert.equal(getRemainingSeconds(2000, 2000), 0);
});
