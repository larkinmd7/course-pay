const SHORT_WORDS = [
  'а', 'и', 'но', 'да', 'или', 'либо', 'не', 'ни',
  'в', 'во', 'на', 'к', 'ко', 'с', 'со', 'о', 'об', 'обо', 'у',
  'за', 'из', 'изо', 'от', 'ото', 'до', 'по', 'под', 'над', 'при',
  'про', 'для', 'без',
].join('|');

const shortWordPattern = new RegExp(
  `(^|[\\s([«„"])((?:${SHORT_WORDS}))[ \\t]+(?=[\\p{L}\\p{N}«„("])`,
  'giu',
);

export function protectRussianTypography(value) {
  let text = value;

  text = text.replace(/(\d)\s+(?=\d{3}\b)/g, '$1\u00a0');
  text = text.replace(/(\d)\s+(?=[\p{L}₽%])/gu, '$1\u00a0');
  text = text.replace(/\b(млн|млрд|тыс\.)\s+(?=[₽$€])/giu, '$1\u00a0');
  text = text.replace(/([\p{L}\p{N}])-(?=[\p{L}\p{N}])/gu, '$1\u2011');
  text = text.replace(/(\d)([–−])(?=\d)/g, '$1\u2060$2\u2060');
  text = text.replace(/([^\s])\s+—\s+/g, '$1\u00a0— ');

  let previous;
  do {
    previous = text;
    text = text.replace(shortWordPattern, '$1$2\u00a0');
  } while (text !== previous);

  return text;
}

export function improveVisibleTypography(root = document) {
  const scope = root.body ?? root;
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || !node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      if (parent.closest('script, style, template, textarea, code, pre, [data-typography="off"]')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) node.nodeValue = protectRussianTypography(node.nodeValue);
}
