import './bingo-alert.css';
import { formatMessage, type Translation } from '../i18n';
import type { BingoCard } from '../types';

type BingoAlertProps = {
  winners: BingoCard[];
  translation: Translation;
};

export function BingoAlert({ winners, translation: t }: BingoAlertProps) {
  if (!winners.length) return null;

  return (
    <section className="bingo-alert" role="alert" aria-live="assertive">
      <span aria-hidden="true">★</span>
      <div>
        <strong>BINGO!</strong>
        <small>
          {winners.length === 1
            ? formatMessage(t.CARD_COMPLETE, { title: winners[0].title })
            : formatMessage(t.CARDS_COMPLETE_OTHER, { count: winners.length })}
        </small>
      </div>
      <span aria-hidden="true">★</span>
    </section>
  );
}
