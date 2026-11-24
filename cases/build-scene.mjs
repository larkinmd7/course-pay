import { mkdirSync, writeFileSync } from 'node:fs';
import { branches } from './content.mjs';

const colors = {
  paper: '#F3F5FA',
  white: '#FFFFFF',
  ink: '#111D39',
  muted: '#425274',
  line: '#C8D3E7',
  navy: '#142551',
  blue: '#3054CA',
  blueLight: '#E6EDFF',
  green: '#246453',
  greenLight: '#E2F3EC',
};
const elements = [];
const targets = { overview: ['map-overview'] };

function element(id, type, x, y, width, height, props) {
  elements.push({
    id, type, x, y, width, height, angle: 0,
    strokeColor: colors.line, backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100, groupIds: [], frameId: null,
    index: null, roundness: null, seed: elements.length + 41,
    version: 1, versionNonce: elements.length + 2001, isDeleted: false,
    boundElements: null, updated: 1, link: null, locked: false,
    ...props,
  });
}

function panel(id, x, y, width, height, backgroundColor, strokeColor = colors.line) {
  element(id, 'rectangle', x, y, width, height, {
    backgroundColor, strokeColor, strokeWidth: 1.5,
    roundness: { type: 3, value: 20 },
  });
}

function text(id, x, y, content, fontSize, width, strokeColor = colors.ink, textAlign = 'left') {
  element(id, 'text', x, y, width, fontSize * 1.25 * content.split('\n').length, {
    text: content, originalText: content, fontSize, fontFamily: 2,
    strokeColor, textAlign, verticalAlign: 'top', containerId: null,
    autoResize: true, lineHeight: 1.25,
  });
}

function line(id, x, y, points, strokeColor = colors.line) {
  element(id, 'line', x, y, Math.max(...points.map(([a]) => a)), Math.max(...points.map(([, b]) => b)), {
    points, strokeColor, strokeWidth: 2.5, startBinding: null, endBinding: null,
    startArrowhead: null, endArrowhead: null, lastCommittedPoint: null,
  });
}

function wrap(value, limit) {
  const rows = [''];
  for (const word of value.split(' ')) {
    const prior = rows.at(-1);
    if (prior && prior.length + word.length + 1 > limit) rows.push(word);
    else rows[rows.length - 1] = prior ? `${prior} ${word}` : word;
  }
  return rows.join('\n');
}

const columnWidth = 620;
const branchY = 210;
const tileStart = 430;
const tileStep = 66;
const overviewWidth = 1360;
const overviewHeight = 934;

panel('map-overview', 0, 0, overviewWidth, overviewHeight, colors.paper, colors.paper);
panel('course', 394, 32, 572, 115, colors.navy, colors.navy);
text('course-title', 444, 48, 'AI Prime', 45, 472, colors.white, 'center');
text('course-subtitle', 417, 105, 'Что можно собрать после курса', 23, 526, '#DCE7FF', 'center');
line('root-stem', 680, 148, [[0, 0], [0, 28]]);
line('root-fork', 348, 176, [[0, 0], [664, 0]]);

branches.forEach((branch, column) => {
  const x = column === 0 ? 38 : 702;
  const accent = column === 0 ? colors.blue : colors.green;
  const fill = column === 0 ? colors.blueLight : colors.greenLight;
  line(`${branch.id}-stem`, x + columnWidth / 2, 176, [[0, 0], [0, 34]]);
  panel(`${branch.id}-heading`, x, branchY, columnWidth, 182, fill, fill);
  text(`${branch.id}-range`, x + 24, branchY + 16, branch.range, 18, 560, accent);
  text(`${branch.id}-title`, x + 24, branchY + 43, branch.title, 35, 560);
  text(`${branch.id}-lessons`, x + 24, branchY + 93, branch.lessons.join('\n'), 21, 576, colors.muted);

  const trunkX = x + 20;
  const lastTileCenter = tileStart + (branch.categories.length - 1) * tileStep + 25;
  line(`${branch.id}-trunk`, trunkX, branchY + 182, [[0, 0], [0, lastTileCenter - branchY - 182]], accent);
  targets[branch.id] = [`${branch.id}-heading`];

  let detailY = overviewHeight + 72;
  branch.categories.forEach((category, index) => {
    const y = tileStart + index * tileStep;
    const tileX = x + 44;
    line(`${category.id}-stem`, trunkX, y + 25, [[0, 0], [tileX - trunkX, 0]], accent);
    panel(`${category.id}-tile`, tileX, y, columnWidth - 44, 51, colors.white);
    text(`${category.id}-tile-label`, tileX + 17, y + 11, category.title, 24, 525);
    text(`${category.id}-tile-open`, tileX + columnWidth - 90, y + 10, '→', 25, 24, accent);
    targets[branch.id].push(`${category.id}-tile`);

    const detailX = column === 0 ? -110 : 1380;
    const detailWidth = 620;
    const detailId = `${category.id}-detail`;
    const facts = category.examples
      ? category.examples.map((example) => `• ${wrap(example, 44)}`)
      : [wrap(category.note, 44)];
    if (category.practice) facts.push(`Практикум: ${wrap(category.practice.replace('На занятии собрали ', ''), 41)}`);
    const factsText = facts.join('\n');
    const ideasText = category.ideas.map((idea) => `• ${wrap(idea, 42)}`).join('\n');
    const description = wrap(category.description, 48);
    const factsLabelY = 91 + description.split('\n').length * 27.5 + 13;
    const factsY = factsLabelY + 25;
    const ideasY = factsY + factsText.split('\n').length * 27.5 + 32;
    const height = Math.ceil(ideasY + 28 + ideasText.split('\n').length * 30 + 24);
    panel(detailId, detailX, detailY, detailWidth, height, colors.white);
    text(`${category.id}-range`, detailX + 24, detailY + 17, branch.range, 17, 550, accent);
    text(`${category.id}-title`, detailX + 24, detailY + 45, category.title, 33, 572);
    text(`${category.id}-description`, detailX + 24, detailY + 91, description, 22, 565, colors.muted);
    text(`${category.id}-facts-label`, detailX + 24, detailY + factsLabelY,
      category.examples ? 'СДЕЛАЛИ УЧАСТНИКИ' : 'ИДЕЯ УЧАСТНИКА', 17, 560, accent);
    text(`${category.id}-facts`, detailX + 24, detailY + factsY, factsText, 22, 572);
    line(`${category.id}-separator`, detailX + 24, detailY + ideasY - 16, [[0, 0], [572, 0]]);
    text(`${category.id}-ideas-label`, detailX + 24, detailY + ideasY, 'ЧТО ЕЩЁ МОЖНО СОБРАТЬ', 17, 560, accent);
    text(`${category.id}-ideas`, detailX + 24, detailY + ideasY + 28, ideasText, 24, 572);
    targets[category.id] = [detailId];
    detailY += height + 32;
  });
});

const scene = {
  type: 'excalidraw',
  version: 2,
  source: 'https://ai-prime.larkinmd7.ru/cases/',
  elements,
  appState: { viewBackgroundColor: colors.paper, gridSize: null },
  files: {},
};
mkdirSync(new URL('./public/', import.meta.url), { recursive: true });
writeFileSync(new URL('./public/ai-prime.excalidraw', import.meta.url), JSON.stringify(scene));
writeFileSync(new URL('./public/map-targets.json', import.meta.url), JSON.stringify(targets));
