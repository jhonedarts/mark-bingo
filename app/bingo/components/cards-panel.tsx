import { getCardProgress, getColumnLabels, hasBingo } from '../domain';
import type { BingoCard, Translation } from '../types';

type CardsPanelProps = {
  cards: BingoCard[] | null;
  calledNumbers: Set<number>;
  onOpenLoader: () => void;
  translation: Translation;
};

export function CardsPanel({
  cards,
  calledNumbers,
  onOpenLoader,
  translation: t,
}: CardsPanelProps) {
  const activeCards = cards ?? [];

  return (
    <section className="cards-panel" aria-label={t.cardsPanelLabel}>
      <div className="section-heading">
        <div>
          <p>{t.liveTracking}</p>
          <h1>{t.yourCards}</h1>
        </div>
        <span>{t.calledCount(calledNumbers.size)}</span>
      </div>

      {cards === null ? (
        <section className="empty-cards" aria-live="polite">
          <strong>{t.loadingCards}</strong>
        </section>
      ) : activeCards.length === 0 ? (
        <section className="empty-cards" aria-live="polite">
          <span aria-hidden="true">↥</span>
          <h2>{t.noCards}</h2>
          <p>{t.noCardsHint}</p>
          <button type="button" onClick={onOpenLoader}>
            {t.openLoader}
          </button>
        </section>
      ) : (
        <div className={'cards-grid cards-' + activeCards.length}>
          {activeCards.map((card, cardIndex) => (
            <BingoCardView
              card={card}
              calledNumbers={calledNumbers}
              key={card.title + '-' + cardIndex}
              translation={t}
            />
          ))}
        </div>
      )}
    </section>
  );
}

type BingoCardViewProps = {
  card: BingoCard;
  calledNumbers: Set<number>;
  translation: Translation;
};

function BingoCardView({ card, calledNumbers, translation: t }: BingoCardViewProps) {
  const winner = hasBingo(card, calledNumbers);
  const progress = getCardProgress(card, calledNumbers);
  const columnCount = card.numbers[0].length;
  const columnLabels = getColumnLabels(columnCount);
  const gridStyle = { gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` };

  return (
    <article
      className={
        'bingo-card' +
        (winner ? ' is-winner' : '') +
        (columnCount > 6 ? ' dense-card' : '')
      }
    >
      <div className="card-topline">
        <div className="mini-brand" aria-hidden="true">
          <span className="mini-mark">•••</span>
          <span>BINGO</span>
        </div>
        <div className="card-meta">
          <div className="card-title">
            <small>{t.card}</small>
            <strong>{card.title}</strong>
          </div>
          <span className="card-progress">{t.cardProgress(progress.marked, progress.total)}</span>
        </div>
      </div>
      {winner && <div className="winner-ribbon">BINGO!</div>}
      <div className="bingo-table" role="table" aria-label={t.card + ' ' + card.title}>
        <div className="bingo-row bingo-header" role="row" style={gridStyle}>
          {columnLabels.map((column) => (
            <div role="columnheader" key={column}>
              {column}
            </div>
          ))}
        </div>
        {card.numbers.map((row, rowIndex) => (
          <div className="bingo-row" role="row" key={rowIndex} style={gridStyle}>
            {row.map((number, columnIndex) => {
              const marked = number === null || calledNumbers.has(number);
              return (
                <div
                  role="cell"
                  className={(marked ? 'marked' : '') + (number === null ? ' free' : '')}
                  key={rowIndex + '-' + columnIndex}
                  aria-label={number === null ? t.freeSpace : t.numberCell(number, marked)}
                >
                  {number === null ? <span aria-hidden="true">★</span> : number}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </article>
  );
}
