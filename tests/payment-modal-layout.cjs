const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4174/';
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];
const tariffs = ['base', 'middle', 'pro'];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

      for (const tariff of tariffs) {
        await page.locator(`[data-open-payment="${tariff}"]`).click();
        const metrics = await page.locator('#payment-dialog').evaluate((dialog) => {
          const title = dialog.querySelector('[data-payment-title-name]') || dialog.querySelector('#payment-title');
          const dialogBox = dialog.getBoundingClientRect();
          const titleBox = title.getBoundingClientRect();
          const titleStyle = getComputedStyle(title);

          return {
            dialog: { left: dialogBox.left, right: dialogBox.right, top: dialogBox.top, bottom: dialogBox.bottom },
            title: { left: titleBox.left, right: titleBox.right, scrollWidth: title.scrollWidth, clientWidth: title.clientWidth },
            titleFontSize: Number.parseFloat(titleStyle.fontSize),
            viewport: { width: innerWidth, height: innerHeight },
          };
        });

        assert.ok(metrics.dialog.left >= 0 && metrics.dialog.right <= metrics.viewport.width, `${viewport.name}/${tariff}: dialog must fit viewport width`);
        assert.ok(metrics.dialog.top >= 0 && metrics.dialog.bottom <= metrics.viewport.height, `${viewport.name}/${tariff}: dialog must fit viewport height`);
        assert.ok(metrics.title.left >= metrics.dialog.left && metrics.title.right <= metrics.dialog.right, `${viewport.name}/${tariff}: title box must stay inside dialog`);
        assert.ok(metrics.title.scrollWidth <= metrics.title.clientWidth + 1, `${viewport.name}/${tariff}: title text must not overflow`);
        assert.ok(metrics.titleFontSize <= (viewport.name === 'mobile' ? 34 : 48), `${viewport.name}/${tariff}: title is too large (${metrics.titleFontSize}px)`);

        results.push({ viewport: viewport.name, tariff, ...metrics });
        await page.locator('[data-close-payment]').click();
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(results, null, 2));
})().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
