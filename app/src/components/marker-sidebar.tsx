import './marker-sidebar.css';
import type { FormEventHandler, RefObject } from 'react';
import { formatMessage, type Translation } from '../i18n';
import type { Notice } from '../types';

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
    <aside className="control-panel" aria-label={t.CONTROL_PANEL_LABEL}>
      <div className="control-title">
        <span>{t.MARKER}</span>
        <h2>{t.WHICH_NUMBER}</h2>
        <p>{canMark ? t.MARK_INSTRUCTION : t.LOAD_INSTRUCTION}</p>
      </div>

      <form onSubmit={onMarkNumber} className="number-form">
        <label htmlFor="bingo-number">{t.CALLED_NUMBER}</label>
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
            aria-label={t.CONFIRM_NUMBER}
            disabled={!canMark}
          >
            <span>{t.MARK}</span>
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
          <h3>{t.CALLED}</h3>
          <div className="recent-controls">
            <button
              type="button"
              onClick={onToggleHistory}
              disabled={!sortedCalledNumbers.length}
            >
              {showHistory ? t.COLLAPSE : t.SHOW_ALL}
            </button>
            <button
              type="button"
              onClick={onToggleEditing}
              disabled={!sortedCalledNumbers.length}
            >
              {editingHistory ? t.FINISH_EDITING : t.EDIT}
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
                  editingHistory
                    ? formatMessage(t.REMOVE_CALLED_NUMBER, { number })
                    : t.CALLED_NUMBER + ' ' + number
                }
              >
                {number}
                {editingHistory && <small aria-hidden="true">×</small>}
              </button>
            ))}
          </div>
        ) : (
          <p className="empty-history">{t.NO_CALLED_NUMBERS}</p>
        )}
      </div>

      <div className="panel-actions">
        <button type="button" onClick={onUndoLast} disabled={!calledNumberCount}>
          {t.UNDO_LAST}
        </button>
        <button type="button" onClick={onClearMarks} disabled={!calledNumberCount}>
          {t.CLEAR_MARKS}
        </button>
      </div>

      <div className="json-loader">
        <div>
          <strong>{canMark ? t.OTHER_CARDS : t.LETS_START}</strong>
          <span>{canMark ? t.SAVED_FOR_ONE_DAY : t.NO_CARDS_HINT}</span>
        </div>
        <button type="button" onClick={onOpenLoader}>
          {t.OPEN_LOADER}
        </button>
      </div>
    </aside>
  );
}
