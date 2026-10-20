import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/* Отдельный файл, а не правка site.test.mjs: обещание сроков держится сразу
   на двух местах страницы и на тексте договора, и проверять его надо вместе
   с PDF. Набор на главной живёт своей жизнью, этот тест — своей. */
const pagePath = fileURLToPath(new URL('../index.html', import.meta.url));
const offerPdfPath = fileURLToPath(new URL('../offer/public-offer.pdf', import.meta.url));


test('обещание 3 + 3 недели названо по тарифам и подкреплено Дополнением №3', () => {
  const html = readFileSync(pagePath, 'utf8');
  const pdfText = execFileSync('pdftotext', ['-layout', offerPdfPath, '-'], { encoding: 'utf8' });

  // Пакет сопровождения внедрения оплачен только в «Среднем» и «Продвинутом»:
  // в структуре цены «Старта» (п. 12.6) его нет вовсе. Поэтому и факт на первом
  // экране, и карточка формата обязаны называть тарифы, иначе страница обещает
  // «Старту» три недели работы, за которые он не платил.
  const fact = html.match(/<div><strong>\+3 недели<\/strong>.*?<\/div>/s);
  assert.ok(fact, 'пропал факт про +3 недели на первом экране');
  assert.match(fact[0], /Среднем.*Продвинутом/s,
    'факт про +3 недели не назвал тарифы — «Старт» сопровождения не покупает');

  const card = html.match(/<article class="format-card format-card-support".*?<\/article>/s);
  assert.ok(card, 'пропала карточка про три недели сопровождения');
  assert.match(card[0], /«Средний».*«Продвинутый»/s);
  assert.match(card[0], /«Старте»/,
    'карточка не сказала, что остаётся участнику «Старта»');

  // Оферта в пунктах 2.4, 3.4 и 8.8 держит сопровождение внутри трёх недель
  // Программы. Срок после основной части живёт только в Дополнении №3:
  // уйдёт дополнение — рассыплется обещание на сайте.
  assert.match(pdfText, /ДОПОЛНЕНИЕ\s*№\s*3/i,
    'сайт обещает сопровождение после основной части, а Дополнения №3 в оферте нет');
  assert.match(pdfText, /в\s+течение\s+3\s*\(трёх\)\s*недель,\s*следующих\s+за\s+датой\s+завершения\s+основной\s+части/i);
  assert.match(pdfText, /составляет\s+6\s*\(шесть\)\s*недель/i);
  assert.match(pdfText, /в\s+состав\s+Тарифа\s+«Старт»\s+не\s+входят/i);
});

test('обещание обновлений материалов подкреплено Дополнением №2', () => {
  const html = readFileSync(pagePath, 'utf8');
  const pdfText = execFileSync('pdftotext', ['-layout', offerPdfPath, '-'], { encoding: 'utf8' });

  const banner = html.match(/<aside class="discount-banner".*?<\/aside>/s);
  assert.ok(banner, 'пропал баннер суточного предложения');
  if (!/обновлениями/.test(banner[0])) return;

  // Обновления материалов обещаны Дополнением №2. Без пункта в договоре
  // это было бы обещание, которого Исполнитель на себя не брал.
  assert.match(pdfText, /ДОПОЛНЕНИЕ\s*№\s*2/i,
    'сайт обещает обновления материалов, а Дополнения №2 в оферте нет');
  assert.match(pdfText, /предоставляются\s+обновления\s+Материалов/i);
  assert.match(pdfText, /без\s+дополнительной\s+оплаты/i);
});
