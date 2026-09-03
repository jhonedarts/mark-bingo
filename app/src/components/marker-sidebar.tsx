import './marker-sidebar.css';
import type { FormEventHandler, RefObject } from 'react';
import type { Notice, Translation } from '../types';

type MarkerSidebarProps = {
  canMark: boolean;
  calledNumberCount: number;
  editingHistory: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  isNumberOnAnyCard: (number: number) => boolean;
  notice: Notice;
  numberInput: string;
  onClearMarks: () => void;
  onInputChange: (value: string) => void;
  onMarkNumber: FormEventHandler<HTMLFormElement>;
  onOpenLoader: () => void;
  onRemoveCalledNumber: (number: number) => void;
  onToggleEditing: () => void;
  onToggleHistory: () => void;
  onUndoLast: () => void;
  showHistory: boolean;
  sortedCalledNumbers: number[];
  translation: Translation;
};

export function MarkerSidebar({
  canMark,
  calledNumberCount,
  editingHistory,
  inputRef,
  isNumberOnAnyCard,
  notice,
  numberInput,
  onClearMarks,
  onInputChange,
  onMarkNumber,
  onOpenLoader,
  onRemoveCalledNumber,
  onToggleEditing,
  onToggleHistory,
  onUndoLast,
  showHistory,
  sortedCalledNumbers,
  translation: t,
}: MarkerSidebarProps) {
  return (
    <aside className="control-panel" aria-label={t.controlPanelLabel}>
      <div className="control-title">
        <span>{t.marker}</span>
        <h2>{t.whichNumber}</h2>
        <p>{canMark ? t.markInstruction : t.loadInstruction}</p>
      </div>

      <form onSubmit={onMarkNumber} className="number-form">
        <label htmlFor="bingo-number">{t.calledNumber}</label>
        <div className="input-row">
          <input
            ref={inputRef}
            id="bingo-number"
            type="number"
            inputMode="numeric"
            min="1"
            max="9999"
            autoComplete="off"
            placeholder="00"
            value={numberInput}
            disabled={!canMark}
            onChange={(event) => onInputChange(event.target.value)}
          />
          <button
            type="submit"
            className="confirm-button"
            aria-label={t.confirmNumber}
            disabled={!canMark}
          >
            <span>{t.mark}</span>
            <b aria-hidden="true">→</b>
          </button>
        </div>
      </form>

      {notice && (
        <p className={'notice ' + notice.type} role="status">
          {notice.text}
        </p>
      )}

      <div className="recent-section">
        <div className="recent-heading">
          <h3>{t.called}</h3>
          <div className="recent-controls">
            <button
              type="button"
              onClick={onToggleHistory}
              disabled={!sortedCalledNumbers.length}
            >
              {showHistory ? t.collapse : t.showAll}
            </button>
            <button
              type="button"
              onClick={onToggleEditing}
              disabled={!sortedCalledNumbers.length}
            >
              {editingHistory ? t.finishEditing : t.edit}
            </button>
          </div>
        </div>
        {sortedCalledNumbers.length ? (
          <div
            className={
              'number-history' +
              (showHistory ? ' expanded' : '') +
              (editingHistory ? ' editing' : '')
            }
          >
            {sortedCalledNumbers.map((number, index) => (
              <button
                type="button"
                className={
                  (index === 0 ? 'latest ' : '') +
                  (isNumberOnAnyCard(number) ? 'matched-card' : '')
                }
                key={number}
                onClick={() => onRemoveCalledNumber(number)}
                disabled={!editingHistory}
                aria-label={
                  editingHistory ? t.removeCalledNumber(number) : t.calledNumber + ' ' + number
                }
              >
                {number}
                {editingHistory && <small aria-hidden="true">×</small>}
              </button>
            ))}
          </div>
        ) : (
          <p className="empty-history">{t.noCalledNumbers}</p>
        )}
      </div>

      <div className="panel-actions">
        <button type="button" onClick={onUndoLast} disabled={!calledNumberCount}>
          {t.undoLast}
        </button>
        <button type="button" onClick={onClearMarks} disabled={!calledNumberCount}>
          {t.clearMarks}
        </button>
      </div>

      <div className="json-loader">
        <div>
          <strong>{canMark ? t.otherCards : t.letsStart}</strong>
          <span>{canMark ? t.savedForOneDay : t.noCardsHint}</span>
        </div>
        <button type="button" onClick={onOpenLoader}>
          {t.openLoader}
        </button>
      </div>
    </aside>
  );
}
