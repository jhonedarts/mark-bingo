import type { BingoCard, CellValue } from './types';

type OcrWord = {
  text: string;
  value: number;
  x: number;
  y: number;
  height: number;
};

export type DetectedCard = {
  card: BingoCard;
  rows: number;
  columns: number;
};

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function detectCardFromWords(words: OcrWord[], filename: string): DetectedCard {
  if (words.length < 8) throw new Error('not-enough-numbers');

  const tolerance = Math.max(8, median(words.map((word) => word.height)) * 0.85);
  const rowGroups: Array<{ y: number; words: OcrWord[] }> = [];

  [...words].sort((a, b) => a.y - b.y).forEach((word) => {
    const group = rowGroups.find((candidate) => Math.abs(candidate.y - word.y) <= tolerance);
    if (group) {
      group.words.push(word);
      group.y = group.words.reduce((sum, item) => sum + item.y, 0) / group.words.length;
    } else {
      rowGroups.push({ y: word.y, words: [word] });
    }
  });

  const maximumColumns = Math.max(...rowGroups.map((group) => group.words.length));
  if (maximumColumns < 3) throw new Error('not-enough-columns');

  const gridRows = rowGroups
    .filter((group) => group.words.length >= Math.max(2, maximumColumns - 1))
    .sort((a, b) => a.y - b.y);
  if (gridRows.length < 3) throw new Error('not-enough-rows');

  const anchorRow = [...gridRows].sort((a, b) => b.words.length - a.words.length)[0];
  const anchors = [...anchorRow.words].sort((a, b) => a.x - b.x).map((word) => word.x);
  const detectedNumbers = gridRows.map((group) => {
    const row: CellValue[] = Array.from({ length: anchors.length }, () => null);
    [...group.words].sort((a, b) => a.x - b.x).forEach((word) => {
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      anchors.forEach((anchor, index) => {
        const distance = Math.abs(anchor - word.x);
        if (distance < bestDistance && row[index] === null) {
          bestIndex = index;
          bestDistance = distance;
        }
      });
      row[bestIndex] = word.value;
    });
    return row;
  });

  const firstGridY = gridRows[0].y;
  const titleFromImage = words
    .filter((word) => word.y < firstGridY - tolerance && word.text.length <= 4)
    .sort((a, b) => b.y - a.y)[0]?.text;
  const titleFromFilename = filename.match(/\d{1,4}/)?.[0];

  return {
    card: { title: titleFromImage || titleFromFilename || 'IMG', numbers: detectedNumbers },
    rows: detectedNumbers.length,
    columns: anchors.length,
  };
}

export async function recognizeCardImage(
  file: File,
  onProgress: (progress: number) => void,
): Promise<DetectedCard> {
  const { createWorker, PSM } = await import('tesseract.js');
  const worker = await createWorker('eng', undefined, {
    logger: (message) => {
      if (message.status.includes('recognizing text')) {
        onProgress(Math.round(message.progress * 100));
      }
    },
  });

  try {
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789',
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
    });
    const result = await worker.recognize(file, {}, { blocks: true, text: true });
    const words: OcrWord[] = (result.data.blocks ?? [])
      .flatMap((block) => block.paragraphs)
      .flatMap((paragraph) => paragraph.lines)
      .flatMap((line) => line.words)
      .map((word) => {
        const text = word.text.replace(/\D/g, '');
        return {
          text,
          value: Number(text),
          x: (word.bbox.x0 + word.bbox.x1) / 2,
          y: (word.bbox.y0 + word.bbox.y1) / 2,
          height: word.bbox.y1 - word.bbox.y0,
        };
      })
      .filter(
        (word) =>
          word.text.length > 0 &&
          Number.isInteger(word.value) &&
          word.value >= 1 &&
          word.value <= 75,
      );

    return detectCardFromWords(words, file.name);
  } finally {
    await worker.terminate();
  }
}
