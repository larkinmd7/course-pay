import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pagePath = fileURLToPath(new URL('../index.html', import.meta.url));
const cssPath = fileURLToPath(new URL('../assets/styles.css', import.meta.url));
const jsPath = fileURLToPath(new URL('../assets/main.js', import.meta.url));
const dockerfilePath = fileURLToPath(new URL('../Dockerfile', import.meta.url));
const nginxPath = fileURLToPath(new URL('../nginx.conf', import.meta.url));

test('главная страница существует', () => {
  assert.equal(existsSync(pagePath), true, 'site/index.html должен существовать');
});

test('главная показывает утверждённый продукт и тарифы', () => {
  const html = readFileSync(pagePath, 'utf8');
  const required = [
    'ИИ для экспертов: личная операционная система и AI-инструменты под свою нишу',
    '1 октября 2026',
    'База',
    '29 900 ₽',
    'Средний',
    '49 900 ₽',
    'Профи',
    '89 900 ₽',
    'Проверка домашних работ не входит',
  ];

  for (const value of required) assert.match(html, new RegExp(value));
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
  assert.equal((html.match(/name="shopId" value="1275315"/g) ?? []).length, 3);
  assert.match(html, /name="sum"[^>]*value="29900"/);
  assert.match(html, /name="sum"[^>]*value="49900"/);
  assert.match(html, /name="sum"[^>]*value="89900"/);
  assert.equal((html.match(/name="cps_email"[^>]*required/g) ?? []).length, 3);
  assert.equal((html.match(/name="custName"[^>]*required/g) ?? []).length, 3);
  assert.match(js, /kassaConstructForm\?\.main\?\.updateHandlers/);
  assert.doesNotMatch(html, /PLACEHOLDER_VALUE|example\.com|javascript:/i);
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
  assert.match(css, /h1,\s*h2,\s*h3\s*\{[^}]*overflow-wrap:\s*anywhere/s);
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
