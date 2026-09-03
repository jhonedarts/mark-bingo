import type { BingoCard } from './types';

const bingoColumns = ['B', 'I', 'N', 'G', 'O'];

export function getColumnLabels(count: number) {
  return count === bingoColumns.length
    ? bingoColumns
    : Array.from({ length: count }, (_, index) => String(index + 1));
}

export function isValidCard(value: unknown): value is BingoCard {
  if (!value || typeof value !== 'object') return false;
  const card = value as Partial<BingoCard>;
  const columnCount =
    Array.isArray(card.numbers) && Array.isArray(card.numbers[0])
      ? card.numbers[0].length
      : 0;

  return (
    typeof card.title === 'string' &&
    card.title.trim().length > 0 &&
    Array.isArray(card.numbers) &&
    card.numbers.length > 0 &&
    columnCount > 0 &&
    card.numbers.every(
      (row) =>
        Array.isArray(row) &&
        row.length === columnCount &&
        row.every(
          (cell) =>
            cell === null ||
            (typeof cell === 'number' && Number.isInteger(cell) && cell >= 1 && cell <= 9999),
        ),
    )
  );
}

export function isValidMarkedNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 9999;
}

export function getCards(value: unknown): BingoCard[] | null {
  const cards = Array.isArray(value) ? value : (value as { cards?: unknown })?.cards;
  return Array.isArray(cards) && cards.length > 0 && cards.length <= 4 && cards.every(isValidCard)
    ? cards
    : null;
}

export function hasBingo(card: BingoCard, calledNumbers: Set<number>) {
  return card.numbers.every((row) =>
    row.every((number) => number === null || calledNumbers.has(number)),
  );
}

export function getCardProgress(card: BingoCard, calledNumbers: Set<number>) {
  const playable = card.numbers.flat().filter((number): number is number => number !== null);
  return {
    marked: playable.filter((number) => calledNumbers.has(number)).length,
    total: playable.length,
  };
}

export function isNumberOnCards(cards: BingoCard[], number: number) {
  return cards.some((card) => card.numbers.some((row) => row.includes(number)));
}
