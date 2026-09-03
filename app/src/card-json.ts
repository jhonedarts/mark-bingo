import type { BingoCard } from './types';

function formatNumberRow(row: BingoCard['numbers'][number]) {
  return JSON.stringify(row).replaceAll(',', ', ');
}

export function formatCardsJson(cards: BingoCard[]) {
  const formattedCards = cards
    .map((card) => {
      const rows = card.numbers.map((row) => `        ${formatNumberRow(row)}`).join(',\n');

      return [
        '    {',
        `      "title": ${JSON.stringify(card.title)},`,
        '      "numbers": [',
        rows,
        '      ]',
        '    }',
      ].join('\n');
    })
    .join(',\n');

  return ['{', '  "cards": [', formattedCards, '  ]', '}'].join('\n');
}
