import type { ChangeEventHandler, RefObject } from 'react';
import type { ImageDetection, LoadMode, Notice, Translation } from '../types';

const cardsJsonExample = `{
  cards: [
    {
      title: '037',
      numbers: [
        [1, 17, 41, 54, 64],
        [15, 25, 35, 56, 74],
        [11, 20, null, 60, 75],
        [4, 21, 36, 49, 65],
        [7, 26, 44, 53, 63],
      ],
    },
  ],
}`;

type CardLoaderModalProps = {
  canClose: boolean;
  cardsJsonInput: string;
  fileRef: RefObject<HTMLInputElement | null>;
  imageDetection: ImageDetection | null;
  imageProgress: number | null;
  imageRef: RefObject<HTMLInputElement | null>;
  loadMode: LoadMode;
  notice: Notice;
  onCardsJsonChange: (value: string) => void;
  onClose: () => void;
  onLoadImage: ChangeEventHandler<HTMLInputElement>;
  onLoadJsonFile: ChangeEventHandler<HTMLInputElement>;
  onLoadJsonText: () => void;
  onModeChange: (mode: LoadMode) => void;
  translation: Translation;
};

export function CardLoaderModal({
  canClose,
  cardsJsonInput,
  fileRef,
  imageDetection,
  imageProgress,
  imageRef,
  loadMode,
  notice,
  onCardsJsonChange,
  onClose,
  onLoadImage,
  onLoadJsonFile,
  onLoadJsonText,
  onModeChange,
  translation: t,
}: CardLoaderModalProps) {
  const tabs: Array<[LoadMode, string]> = [
    ['file', t.loadFromFile],
    ['image', t.loadFromImage],
    ['json', t.loadFromJson],
  ];

  return (
    <div className="loader-overlay" role="presentation">
      <section
        className="loader-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="loader-title"
      >
        <header className="loader-header">
          <div>
            <h2 id="loader-title">{t.loaderTitle}</h2>
            <p>{t.loaderDescription}</p>
          </div>
          <button type="button" className="loader-close" onClick={onClose} aria-label={t.close}>
            ×
          </button>
        </header>

        <nav className="loader-tabs" aria-label={t.loaderTitle}>
          {tabs.map(([mode, label]) => (
            <button
              type="button"
              className={loadMode === mode ? 'active' : ''}
              onClick={() => onModeChange(mode)}
              aria-pressed={loadMode === mode}
              key={mode}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="loader-content">
          {loadMode === 'file' && (
            <div className="upload-pane">
              <button
                type="button"
                className="upload-target"
                onClick={() => fileRef.current?.click()}
              >
                <span aria-hidden="true">JSON</span>
                <strong>{t.chooseJsonFile}</strong>
                <small>{t.chooseJsonFileHint}</small>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                onChange={onLoadJsonFile}
                hidden
              />
            </div>
          )}

          {loadMode === 'image' && (
            <div className="upload-pane">
              <button
                type="button"
                className="upload-target image-target"
                onClick={() => imageRef.current?.click()}
                disabled={imageProgress !== null}
              >
                <span aria-hidden="true">▦</span>
                <strong>
                  {imageProgress === null ? t.chooseImage : t.imageProcessing(imageProgress)}
                </strong>
                <small>{t.chooseImageHint}</small>
                {imageProgress !== null && (
                  <i className="ocr-progress" aria-hidden="true">
                    <b style={{ width: imageProgress + '%' }} />
                  </i>
                )}
              </button>
              <input
                ref={imageRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onLoadImage}
                hidden
              />
            </div>
          )}

          {loadMode === 'json' && (
            <div className="modal-json-editor">
              {imageDetection && (
                <div className="image-detection" role="status">
                  <strong>{t.imageDetected(imageDetection.rows, imageDetection.columns)}</strong>
                  <span>{t.imageDetectedHint}</span>
                </div>
              )}
              <label htmlFor="cards-json-text">{t.pasteJsonLabel}</label>
              <textarea
                id="cards-json-text"
                value={cardsJsonInput}
                onChange={(event) => onCardsJsonChange(event.target.value)}
                placeholder={t.pasteJsonLabel}
                aria-describedby="cards-json-hint"
                spellCheck="false"
              />
              <section className="json-example-block" aria-label={t.jsonExampleLabel}>
                <strong>{t.jsonExampleLabel}</strong>
                <pre>{cardsJsonExample}</pre>
              </section>
              <div className="modal-json-actions">
                <span id="cards-json-hint">{t.pasteJsonHint}</span>
                <button type="button" onClick={onLoadJsonText}>
                  {t.loadTextJson}
                </button>
              </div>
            </div>
          )}

          {notice && (
            <p className={'loader-notice ' + notice.type} role="status">
              {notice.text}
            </p>
          )}
        </div>

        {canClose && (
          <footer className="loader-footer">
            <button type="button" onClick={onClose}>
              ← {t.back}
            </button>
          </footer>
        )}
      </section>
    </div>
  );
}
