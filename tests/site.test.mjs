import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const pagePath = fileURLToPath(new URL('../index.html', import.meta.url));
const cssPath = fileURLToPath(new URL('../assets/styles.css', import.meta.url));
const jsPath = fileURLToPath(new URL('../assets/main.js', import.meta.url));
const dockerfilePath = fileURLToPath(new URL('../Dockerfile', import.meta.url));
const nginxPath = fileURLToPath(new URL('../nginx.conf', import.meta.url));
const offerPagePath = fileURLToPath(new URL('../offer/index.html', import.meta.url));
const offerPdfPath = fileURLToPath(new URL('../offer/public-offer.pdf', import.meta.url));
const authorPhotoPath = fileURLToPath(new URL('../assets/mikhail-larkin.jpg', import.meta.url));
const aiAdoptionImagePath = fileURLToPath(new URL('../assets/ai-adoption-visual.jpg', import.meta.url));
const typographyUrl = new URL('../assets/typography.mjs', import.meta.url);
const typographyPath = fileURLToPath(typographyUrl);
const orbitUrl = new URL('../assets/hero-orbit.mjs', import.meta.url);
const orbitPath = fileURLToPath(orbitUrl);

test('главная страница существует', () => {
  assert.equal(existsSync(pagePath), true, 'site/index.html должен существовать');
});

test('локальный file-preview загружает собственные стили, скрипт и фото', () => {
  const html = readFileSync(pagePath, 'utf8');
  const pageUrl = pathToFileURL(pagePath);
  const assetReferences = [
    ['стили', html.match(/<link rel="stylesheet" href="([^"]*assets\/styles\.css(?:\?[^\"]+)?)"/)?.[1]],
    ['скрипт', html.match(/<script src="([^"]*assets\/main\.js(?:\?[^\"]+)?)"/)?.[1]],
    ['фото', html.match(/<img src="([^"]*assets\/mikhail-larkin\.jpg)"/)?.[1]],
  ];

  for (const [label, reference] of assetReferences) {
    assert.ok(reference, `в HTML должна быть ссылка на локальный ассет: ${label}`);
    const resolvedPath = fileURLToPath(new URL(reference, pageUrl));
    assert.equal(existsSync(resolvedPath), true, `file-preview должен находить ассет: ${label}`);
  }
});

test('mutable CSS и JavaScript получают новую версию без недельного immutable-кэша', () => {
  const html = readFileSync(pagePath, 'utf8');
  const nginx = readFileSync(nginxPath, 'utf8');

  assert.match(html, /assets\/styles\.css\?v=[a-z0-9.-]+/i);
  assert.match(html, /assets\/main\.js\?v=[a-z0-9.-]+/i);
  assert.doesNotMatch(nginx, /\.(?:css\|js)[^}]*immutable/s);
  assert.match(nginx, /max-age=300, must-revalidate/);
});

test('главная показывает утверждённый продукт и тарифы', () => {
  const html = readFileSync(pagePath, 'utf8');
  const required = [
    'ИИ для экспертов: личная операционная система и AI-инструменты под свою нишу',
    '30 августа 2026',
    'Самостоятельный',
    '29 900 ₽',
    'С внедрением',
    '49 900 ₽',
    'Персональный',
    '89 900 ₽',
  ];

  for (const value of required) assert.match(html, new RegExp(value));
  assert.doesNotMatch(html, /1 октября 2026/);
  assert.doesNotMatch(html, /домашн/i);
  assert.doesNotMatch(html, /Личный канал на время программы/);
  assert.doesNotMatch(html, /Персональный технический аудит итогового проекта/);
});

test('интерактивная орбита ограничивает смещение относительно указателя', async () => {
  assert.equal(existsSync(orbitPath), true, 'должен существовать модуль интерактивной орбиты');
  const { calculatePointerParallax } = await import(orbitUrl.href);
  const rect = { left: 100, top: 50, width: 400, height: 200 };

  assert.deepEqual(calculatePointerParallax({ clientX: 300, clientY: 150 }, rect, 28), { x: 0, y: 0 });
  assert.deepEqual(calculatePointerParallax({ clientX: 100, clientY: 50 }, rect, 28), { x: -28, y: -28 });
  assert.deepEqual(calculatePointerParallax({ clientX: 900, clientY: 500 }, rect, 28), { x: 28, y: 28 });
});

test('первый экран выделяет ключевой результат цветом', () => {
  const html = readFileSync(pagePath, 'utf8');
  const heroStart = html.indexOf('<section class="hero" id="top">');
  const heroEnd = html.indexOf('</section>', heroStart);
  const hero = html.slice(heroStart, heroEnd);

  assert.match(hero, /<span class="hero-accent">AI-систему<\/span>/);
  assert.match(hero, /<span class="hero-accent-underline">под свою работу<\/span>/);
});

test('блок «Что изменится» повторяет левую композицию программы', () => {
  const html = readFileSync(pagePath, 'utf8');
  const introStart = html.indexOf('<section class="section intro">');
  const introEnd = html.indexOf('</section>', introStart);
  const intro = html.slice(introStart, introEnd);

  assert.match(intro, /<div class="section-head intro-head">/);
  assert.match(intro, /<p class="eyebrow section-label">Что изменится<\/p>[\s\S]*<h2 class="section-subtitle">От отдельных чатов — к рабочей системе<\/h2>/);
});

test('программа подробно раскрывает каждый из шести модулей', () => {
  const html = readFileSync(pagePath, 'utf8');

  assert.equal((html.match(/class="module(?:\s|"[^>]*>)/g) ?? []).length, 6);
  assert.equal((html.match(/class="module-goal"/g) ?? []).length, 6);
  assert.equal((html.match(/class="module-topics"/g) ?? []).length, 6);
  assert.equal((html.match(/class="module-practice"/g) ?? []).length, 6);
  assert.equal((html.match(/class="module-result"/g) ?? []).length, 6);
  assert.match(html, /До старта/);
  assert.match(html, /Программировать не нужно/);
  assert.match(html, /личная AI-(?:операционная )?система/i);
  assert.match(html, /собственный AI-инструмент/i);
  assert.match(html, /сайты, презентации, креативы и интерфейсы/i);
  assert.match(html, /публичный продукт для пользователей/i);
  assert.match(html, /постоянно работающий агент/i);
  assert.doesNotMatch(html, /домашн/i);
});

test('программа ведёт от контекста до собственного продукта и сохраняет воздух между практикой и результатом', () => {
  const html = readFileSync(pagePath, 'utf8');
  const css = readFileSync(cssPath, 'utf8');

  assert.match(html, /От контекста до своего продукта/);
  assert.match(css, /\.module-topics\s*\{[^}]*flex:\s*1/s);
  assert.match(css, /\.module-result\s*\{[^}]*margin:\s*2[0-9]px\s+0\s+0/s);
});

test('отдельный блок объясняет формат занятий и сопровождения', () => {
  const html = readFileSync(pagePath, 'utf8');
  const formatStart = html.indexOf('<section class="section format"');
  const formatEnd = html.indexOf('</section>', formatStart);
  const format = html.slice(formatStart, formatEnd);

  assert.match(html, /id="format"/);
  assert.match(html, /Шесть живых занятий/);
  assert.match(html, /вопросы заранее/);
  assert.match(html, /вопросы по ходу/);
  assert.match(html, /30 августа 2026/);
  assert.equal((format.match(/class="format-card/g) ?? []).length, 5);
  assert.match(format, /Две личные консультации/);
  assert.match(format, /сложност[а-яё]+ других участников/i);
  assert.match(format, /до того, как столкнётесь с ними сами/i);
});

test('календарь показывает день 0 и шесть занятий по понедельникам и четвергам', () => {
  const html = readFileSync(pagePath, 'utf8');
  const scheduleStart = html.indexOf('<section class="schedule-calendar"');
  const scheduleEnd = html.indexOf('</section>', scheduleStart);
  const schedule = html.slice(scheduleStart, scheduleEnd);
  const datetimes = [...schedule.matchAll(/<time datetime="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(datetimes, [
    '2026-08-30',
    '2026-08-31T18:00:00+03:00',
    '2026-09-03T18:00:00+03:00',
    '2026-09-07T18:00:00+03:00',
    '2026-09-10T18:00:00+03:00',
    '2026-09-14T18:00:00+03:00',
    '2026-09-17T18:00:00+03:00',
  ]);
  assert.match(schedule, /День 0/);
  assert.equal((schedule.match(/class="schedule-event(?:\s[^"]*)?"/g) ?? []).length, 6);
  assert.equal((schedule.match(/<span>18:00 МСК<\/span>/g) ?? []).length, 6);
  assert.match(schedule, /Понедельник/);
  assert.match(schedule, /Четверг/);
});

test('результаты объясняют переход от чат-ботов к созданию продуктов через локальный визуал', () => {
  const html = readFileSync(pagePath, 'utf8');

  assert.equal(existsSync(aiAdoptionImagePath), true, 'визуал про уровни использования AI должен храниться локально');
  assert.match(html, /src="assets\/ai-adoption-visual\.jpg"/);
  assert.match(html, /class="ai-adoption-visual"/);
  assert.match(html, /созданию собственных продуктов/i);
  assert.match(html, /Красная точка/);
  assert.match(html, /linkedin\.com\/posts\/stevenbartlett/);
});

test('важные названия секций визуально главнее поясняющих заголовков', () => {
  const html = readFileSync(pagePath, 'utf8');
  const css = readFileSync(cssPath, 'utf8');

  for (const label of ['Что изменится', 'Программа', 'Что будет на выходе', 'Как устроена программа', 'Примеры результатов', 'Практический опыт', 'Тарифы']) {
    assert.match(html, new RegExp(`<p class="eyebrow section-label">${label}</p>`));
  }
  assert.match(css, /\.section-label\s*\{[^}]*font-size:\s*clamp\(/s);
  assert.match(css, /\.section-subtitle\s*\{[^}]*font-size:\s*clamp\(/s);
});

test('результаты программы раскрывают личную AI-систему через рабочий сценарий', () => {
  const html = readFileSync(pagePath, 'utf8');
  const start = html.indexOf('class="program-outcomes"');
  const end = html.indexOf('</section>', start);
  const outcomes = html.slice(start, end);

  assert.match(outcomes, /звонки и переписки/);
  assert.match(outcomes, /коммерческое предложение/);
  assert.match(outcomes, /брендбук/);
  assert.match(outcomes, /Работающий AI-продукт/);
  assert.doesNotMatch(outcomes, /не учебн/i);
});

test('заголовочный блок программы выровнен по левому краю', () => {
  const html = readFileSync(pagePath, 'utf8');
  const programStart = html.indexOf('<section class="section program" id="program">');
  const firstModule = html.indexOf('<aside class="prep-card">', programStart);
  const programIntro = html.slice(programStart, firstModule);

  assert.match(programIntro, /<div class="section-head">/);
  assert.doesNotMatch(programIntro, /section-head-right/);
});

test('страница показывает примеры инструментов под разные профессии', () => {
  const html = readFileSync(pagePath, 'utf8');

  assert.match(html, /id="examples"/);
  assert.ok((html.match(/class="example-card/g) ?? []).length >= 6);
  for (const value of ['Эксперт', 'Консультант', 'Маркетолог', 'Предприниматель', 'HR', 'Преподаватель']) {
    assert.match(html, new RegExp(value));
  }
  for (const value of ['Конвейер контента и исследований', 'Панель бизнес-решений', 'Учебный AI-ассистент']) {
    assert.match(html, new RegExp(value));
  }
  assert.match(html, /Свой проект вы собираете сами/);
});

test('блок автора содержит фото и подтверждённые факты', () => {
  const html = readFileSync(pagePath, 'utf8');

  assert.equal(existsSync(authorPhotoPath), true, 'должно быть локальное фото Михаила');
  assert.match(html, /src="assets\/mikhail-larkin\.jpg"/);
  assert.match(html, /alt="Михаил Ларькин"/);
  assert.match(html, /35\+ подтверждённых проектов/);
  assert.doesNotMatch(html, /120 компаний/);
  assert.match(html, /2 000\+ участников/);
  assert.match(html, /ВШЭ/);
  assert.match(html, /РАНХиГС/);
  assert.match(html, /VocalAI/);
  assert.match(html, /1 200\+ менеджеров/);
  assert.match(html, /5 000\+[\s\S]{0,100}звонков в день/);
  assert.match(html, /НейроКонсультант/);
  assert.match(html, /10 000\+ пользователей/);
  assert.match(html, /200 млн ₽[\s\S]{0,100}дополнительной выручки в год/);
  assert.match(html, /SynergyGPT/);
  assert.match(html, /1–2 дня[\s\S]{0,100}вместо 2–3 недель/);

  for (const company of ['Сбер', 'СберУниверситет', 'Газпром нефть', 'ВТБ', 'S7', 'Ростелеком', 'Ozon', 'СИБУР', 'GOOD WOOD', 'Деловая среда']) {
    assert.match(html, new RegExp(company));
  }

  assert.match(html, /Речевая аналитика для контроля качества продаж/);
  assert.match(html, /AI-консультант на сайте для повышения конверсии/);
  assert.match(html, /Внутренняя low-code платформа/);
  assert.match(html, /Благодарность от Сбера/);
  assert.match(html, /Подтверждение от S7 Group/);
  assert.match(html, /Благодарность от СКБ Контур/);
  assert.doesNotMatch(html, /Альфа-Банк/);
  assert.ok((html.match(/class="company-logo/g) ?? []).length >= 10, 'компании должны показываться визуальными логотипами');
  assert.equal((html.match(/class="testimonial-logo/g) ?? []).length, 3, 'каждый отзыв должен начинаться с логотипа компании');
  assert.equal((html.match(/class="product-metric"/g) ?? []).length, 3, 'каждый продукт должен иметь отдельную колонку с результатом');

  const productsPosition = html.indexOf('class="product-proof"');
  const educationPosition = html.indexOf('class="author-education"');
  assert.ok(productsPosition > -1 && educationPosition > productsPosition, 'практические кейсы должны идти раньше преподавательского опыта');
});

test('блок компаний показывает десять локальных логотипов без сломанных ассетов', () => {
  const html = readFileSync(pagePath, 'utf8');
  const blockStart = html.indexOf('<section class="company-proof"');
  const blockEnd = html.indexOf('</section>', blockStart);
  const block = html.slice(blockStart, blockEnd);
  const logos = [...block.matchAll(/<img src="([^"]+)" alt="([^"]+)"/g)];

  assert.equal(logos.length, 10);
  assert.deepEqual(logos.map(([, , alt]) => alt), [
    'Сбер',
    'СберУниверситет',
    'Газпром нефть',
    'ВТБ',
    'S7 Airlines',
    'Ростелеком',
    'Ozon',
    'СИБУР',
    'GOOD WOOD',
    'Деловая среда',
  ]);
  for (const [, source] of logos) {
    assert.equal(existsSync(fileURLToPath(new URL(`../${source}`, import.meta.url))), true, `логотип ${source} должен храниться вместе с сайтом`);
  }
});

test('благодарности показывают три настоящих документа с основного сайта', () => {
  const html = readFileSync(pagePath, 'utf8');
  const blockStart = html.indexOf('<section class="author-testimonials"');
  const blockEnd = html.indexOf('</section>', blockStart);
  const block = html.slice(blockStart, blockEnd);
  const documents = [...block.matchAll(/<a class="testimonial-document" href="([^"]+)"[\s\S]*?<img src="([^"]+)" alt="([^"]+)"/g)];

  assert.equal(documents.length, 3);
  assert.deepEqual(documents.map(([, , , alt]) => alt), [
    'Благодарственное письмо Сбера Михаилу Ларькину',
    'Подтверждение проведения занятий для S7 Group',
    'Благодарственное письмо СКБ Контур Михаилу Ларькину',
  ]);
  for (const [, href, source] of documents) {
    assert.equal(href, source, 'превью должно открывать полный локальный документ');
    assert.equal(existsSync(fileURLToPath(new URL(`../${source}`, import.meta.url))), true, `документ ${source} должен храниться вместе с сайтом`);
  }
});

test('преподавательский опыт показывает логотипы РАНХиГС и ВШЭ', () => {
  const html = readFileSync(pagePath, 'utf8');
  const blockStart = html.indexOf('<div class="author-education">');
  const blockEnd = html.indexOf('<div class="license">', blockStart);
  const block = html.slice(blockStart, blockEnd);
  const logos = [...block.matchAll(/<img src="([^"]+)" alt="([^"]+)"/g)];

  assert.deepEqual(logos.map(([, , alt]) => alt), ['РАНХиГС', 'ВШЭ — Высшая школа экономики']);
  for (const [, source] of logos) {
    assert.equal(existsSync(fileURLToPath(new URL(`../${source}`, import.meta.url))), true, `логотип ${source} должен храниться вместе с сайтом`);
  }
});

test('тарифы равной ширины и каждый содержит общий бонус', () => {
  const html = readFileSync(pagePath, 'utf8');
  const css = readFileSync(cssPath, 'utf8');
  const pricingStart = html.indexOf('<section class="section pricing"');
  const pricingEnd = html.indexOf('</section>', pricingStart);
  const pricing = html.slice(pricingStart, pricingEnd);

  assert.match(css, /\.pricing-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s);
  assert.equal((pricing.match(/Как дать AI-агенту управлять личными WhatsApp и Telegram/g) ?? []).length, 3);
  assert.match(pricing, /До старта: разбор проекта, ТЗ и целей/);
  assert.match(pricing, /В середине или конце: консультация и докрутка решения/);
});

test('типограф связывает короткие слова и не разрывает составные слова', async () => {
  assert.equal(existsSync(typographyPath), true, 'должен существовать модуль русской типографики');
  const { protectRussianTypography } = await import(typographyUrl.href);

  assert.equal(
    protectRussianTypography('И это в работе: AI-инструмент для эксперта и команды.'),
    'И\u00a0это в\u00a0работе: AI\u2011инструмент для\u00a0эксперта и\u00a0команды.',
  );
  assert.equal(
    protectRussianTypography('не в пустом чате, а с актуальной информацией; ни в один тариф'),
    'не\u00a0в\u00a0пустом чате, а\u00a0с\u00a0актуальной информацией; ни\u00a0в\u00a0один тариф',
  );
});

test('платёжные описания используют актуальные названия тарифов', () => {
  const html = readFileSync(pagePath, 'utf8');

  for (const tariff of ['Самостоятельный', 'С внедрением', 'Персональный']) {
    assert.match(html, new RegExp(`тариф «${tariff}»`));
  }

  assert.doesNotMatch(html, /тариф «(?:База|Средний|Профи)»/);
});

test('главная содержит юридические ссылки и три платёжных контейнера', () => {
  const html = readFileSync(pagePath, 'utf8');

  assert.match(html, /href="\/offer\/"/);
  assert.match(html, /href="\/privacy\/"/);
  assert.match(html, /href="\/personal-data-consent\/"/);
  assert.equal((html.match(/data-payment-form=/g) ?? []).length, 3);
});

test('три тарифа подключены к официальной форме ЮKassa', () => {
  const html = readFileSync(pagePath, 'utf8');
  const js = readFileSync(jsPath, 'utf8');

  assert.equal((html.match(/action="https:\/\/yookassa\.ru\/integration\/simplepay\/payment"/g) ?? []).length, 3);
  assert.equal((html.match(/name="shopId" value="1436088"/g) ?? []).length, 3);
  assert.match(html, /name="sum"[^>]*value="29900"/);
  assert.match(html, /name="sum"[^>]*value="49900"/);
  assert.match(html, /name="sum"[^>]*value="89900"/);
  assert.equal((html.match(/name="cps_email"[^>]*required/g) ?? []).length, 3);
  assert.equal((html.match(/name="custName"[^>]*required/g) ?? []).length, 3);
  assert.match(js, /kassaConstructForm\?\.main\?\.updateHandlers/);
  assert.doesNotMatch(html, /PLACEHOLDER_VALUE|example\.com|javascript:/i);
});

test('каждая платёжная форма требует отдельного согласия на обработку персональных данных', () => {
  const html = readFileSync(pagePath, 'utf8');
  const forms = [...html.matchAll(/<form target="_blank" class="yoomoney-payment-form"[\s\S]*?<\/form>/g)].map((match) => match[0]);

  assert.equal(forms.length, 3);
  for (const form of forms) {
    assert.match(form, /type="checkbox" name="personalDataConsent" required/);
    assert.match(form, /href="\/personal-data-consent\/"/);
    assert.doesNotMatch(form, /type="checkbox"[^>]*\schecked(?:\s|>)/);
  }
});

for (const path of ['offer/index.html', 'privacy/index.html', 'personal-data-consent/index.html']) {
  test(`${path} содержит реквизиты исполнителя`, () => {
    const legalPath = fileURLToPath(new URL(`../${path}`, import.meta.url));
    assert.equal(existsSync(legalPath), true, `${path} должен существовать`);
    const page = readFileSync(legalPath, 'utf8');
    assert.match(page, /ИП Ларькин Михаил Дмитриевич/);
    assert.match(page, /332899538451/);
    assert.match(page, /href="\/"/);
  });
}

test('опубликованная оферта совпадает с актуальными тарифами и не обещает удалённые услуги', () => {
  assert.equal(existsSync(offerPdfPath), true, 'offer/public-offer.pdf должен существовать');

  const page = readFileSync(offerPagePath, 'utf8');
  const pdfText = execFileSync('pdftotext', [offerPdfPath, '-'], { encoding: 'utf8' });

  assert.match(page, /Редакция от 20 августа 2026 года/);
  assert.match(page, /href="\/offer\/public-offer\.pdf"/);
  for (const tariff of ['Самостоятельный', 'С внедрением', 'Персональный']) {
    assert.match(pdfText, new RegExp(`Тариф «${tariff}»`));
  }
  const personalTariff = pdfText.match(/5\.3\. Тариф «Персональный»[\s\S]*?5\.4\./)?.[0] ?? '';
  assert.match(personalTariff, /два персональных онлайн-созвона/i);
  assert.doesNotMatch(personalTariff, /проверка практических работ|персональный канал связи|персональный технический аудит/i);
});

for (const path of ['success/index.html', 'error/index.html']) {
  test(`${path} содержит возврат на страницу программы`, () => {
    const resultPath = fileURLToPath(new URL(`../${path}`, import.meta.url));
    assert.equal(existsSync(resultPath), true, `${path} должен существовать`);
    const page = readFileSync(resultPath, 'utf8');
    assert.match(page, /href="\/"/);
  });
}

test('мобильная сетка ограничивает ширину дочерних блоков', () => {
  const css = readFileSync(cssPath, 'utf8');
  assert.match(css, /\.limits\s*>\s*\*\s*\{[^}]*min-width:\s*0/s);
  assert.match(css, /h1,\s*h2,\s*h3\s*\{[^}]*overflow-wrap:\s*normal[^}]*word-break:\s*normal[^}]*text-wrap:\s*balance/s);
  assert.match(css, /p,\s*li\s*\{[^}]*text-wrap:\s*pretty/s);
  assert.match(css, /@media \(max-width:\s*580px\)[\s\S]*h1\s*\{[^}]*font-size:\s*clamp\(42px,\s*12vw,\s*52px\)/s);
});

test('статический контейнер имеет healthcheck и не публикует внутренний порт сам', () => {
  assert.equal(existsSync(dockerfilePath), true, 'Dockerfile должен существовать');
  assert.equal(existsSync(nginxPath), true, 'nginx.conf должен существовать');

  const dockerfile = readFileSync(dockerfilePath, 'utf8');
  const nginx = readFileSync(nginxPath, 'utf8');
  assert.match(dockerfile, /HEALTHCHECK/);
  assert.match(nginx, /location = \/health/);
  assert.match(nginx, /try_files \$uri \$uri\/ =404/);
});

test('nginx отдаёт ES-модули .mjs с JavaScript MIME при включённом nosniff', () => {
  const nginx = readFileSync(nginxPath, 'utf8');

  assert.match(nginx, /types\s*\{[^}]*application\/javascript\s+mjs;[^}]*\}/s);
  assert.match(nginx, /X-Content-Type-Options\s+nosniff/);
});
