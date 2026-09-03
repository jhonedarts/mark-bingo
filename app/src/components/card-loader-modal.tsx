import './card-loader-modal.css';
import { useRef, useState } from 'react';
import type { ChangeEventHandler, DragEvent, RefObject } from 'react';
import type {
  ImageDetection,
  JsonLoadMode,
  LoadMode,
  Notice,
  Translation,
} from '../types';

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
  jsonLoadMode: JsonLoadMode;
  loadMode: LoadMode;
  notice: Notice;
  onCardsJsonChange: (value: string) => void;
  onClose: () => void;
  onLoadImageFile: (file: File) => Promise<void>;
  onLoadJsonFile: ChangeEventHandler<HTMLInputElement>;
  onLoadJsonText: () => void;
  onJsonModeChange: (mode: JsonLoadMode) => void;
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
  jsonLoadMode,
  loadMode,
  notice,
  onCardsJsonChange,
  onClose,
  onLoadImageFile,
  onLoadJsonFile,
  onLoadJsonText,
  onJsonModeChange,
  onModeChange,
  translation: t,
}: CardLoaderModalProps) {
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const imageDragDepth = useRef(0);
  const tabs: Array<[LoadMode, string]> = [
    ['image', t.loadFromImage],
    ['json', t.loadFromJson],
  ];

  function handleImageDragEnter(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    imageDragDepth.current += 1;
    setIsDraggingImage(true);
  }

  function handleImageDragLeave(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    imageDragDepth.current = Math.max(0, imageDragDepth.current - 1);
    if (imageDragDepth.current === 0) setIsDraggingImage(false);
  }

  function handleImageDragOver(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  function handleImageDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    imageDragDepth.current = 0;
    setIsDraggingImage(false);

    const file = event.dataTransfer.files[0];
    if (file) void onLoadImageFile(file);
  }

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
          {loadMode === 'image' && (
            <div className="upload-pane">
              <button
                type="button"
                className={'upload-target image-target' + (isDraggingImage ? ' is-dragging' : '')}
                onClick={() => imageRef.current?.click()}
                onDragEnter={handleImageDragEnter}
                onDragLeave={handleImageDragLeave}
                onDragOver={handleImageDragOver}
                onDrop={handleImageDrop}
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
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) void onLoadImageFile(file);
                  event.currentTarget.value = '';
                }}
                hidden
              />
            </div>
          )}

          {loadMode === 'json' && (
            <div className="json-loader-pane">
              <div className="json-mode-toggle" role="group" aria-label={t.loadFromJson}>
                <button
                  type="button"
                  className={'json-mode-option' + (jsonLoadMode === 'text' ? ' active' : '')}
                  onClick={() => onJsonModeChange('text')}
                  aria-pressed={jsonLoadMode === 'text'}
                >
                  {t.typeJson}
                </button>
                <button
                  type="button"
                  className={'json-mode-switch' + (jsonLoadMode === 'file' ? ' is-file' : '')}
                  onClick={() => onJsonModeChange(jsonLoadMode === 'file' ? 'text' : 'file')}
                  role="switch"
                  aria-checked={jsonLoadMode === 'file'}
                  aria-label={jsonLoadMode === 'text' ? t.importJson : t.typeJson}
                >
                  <span aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={'json-mode-option' + (jsonLoadMode === 'file' ? ' active' : '')}
                  onClick={() => onJsonModeChange('file')}
                  aria-pressed={jsonLoadMode === 'file'}
                >
                  {t.importJson}
                </button>
              </div>

              {jsonLoadMode === 'file' ? (
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
              ) : (
                <div className="modal-json-editor">
                  {imageDetection && (
                    <div className="image-detection" role="status">
                      <strong>
                        {t.imageDetected(imageDetection.rows, imageDetection.columns)}
                      </strong>
                      <span>{t.imageDetectedHint}</span>
                    </div>
                  )}
                  <div className="json-editor-columns">
                    <div className="json-input-column">
                      <label htmlFor="cards-json-text">{t.pasteJsonLabel}</label>
                      <textarea
                        id="cards-json-text"
                        value={cardsJsonInput}
                        onChange={(event) => onCardsJsonChange(event.target.value)}
                        placeholder={t.pasteJsonLabel}
                        aria-describedby="cards-json-hint"
                        spellCheck="false"
                      />
                    </div>
                    <div className="json-example-column">
                      <strong>{t.jsonExampleLabel}</strong>
                      <section className="json-example-block" aria-label={t.jsonExampleLabel}>
                        <pre>{cardsJsonExample}</pre>
                      </section>
                    </div>
                  </div>
                  <div className="modal-json-actions">
                    <span id="cards-json-hint">{t.pasteJsonHint}</span>
                    <button type="button" onClick={onLoadJsonText}>
                      {t.loadTextJson}
                    </button>
                  </div>
                </div>
              )}
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
