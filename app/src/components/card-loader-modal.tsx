import './card-loader-modal.css';
import { useRef, useState } from 'react';
import type { ChangeEventHandler, DragEvent, RefObject } from 'react';
import type {
  ImageDetection,
  ImageProgress,
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
  imageDetections: ImageDetection[];
  imageProgress: ImageProgress | null;
  imageRef: RefObject<HTMLInputElement | null>;
  jsonLoadMode: JsonLoadMode;
  loadMode: LoadMode;
  notice: Notice;
  onCardsJsonChange: (value: string) => void;
  onClose: () => void;
  onLoadImageFiles: (files: File[]) => Promise<void>;
  onLoadJsonFile: ChangeEventHandler<HTMLInputElement>;
  onLoadJsonText: () => void;
  onJsonModeChange: (mode: JsonLoadMode) => void;
  onModeChange: (mode: LoadMode) => void;
  onRemoveImage: (index: number) => void;
  onReviewImages: () => void;
  translation: Translation;
};

export function CardLoaderModal({
  canClose,
  cardsJsonInput,
  fileRef,
  imageDetections,
  imageProgress,
  imageRef,
  jsonLoadMode,
  loadMode,
  notice,
  onCardsJsonChange,
  onClose,
  onLoadImageFiles,
  onLoadJsonFile,
  onLoadJsonText,
  onJsonModeChange,
  onModeChange,
  onRemoveImage,
  onReviewImages,
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

    const files = Array.from(event.dataTransfer.files);
    if (files.length) void onLoadImageFiles(files);
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
            <div
              className={
                'upload-pane image-upload-pane' + (imageDetections.length ? ' has-images' : '')
              }
            >
              <button
                type="button"
                className={'upload-target image-target' + (isDraggingImage ? ' is-dragging' : '')}
                onClick={() => imageRef.current?.click()}
                onDragEnter={handleImageDragEnter}
                onDragLeave={handleImageDragLeave}
                onDragOver={handleImageDragOver}
                onDrop={handleImageDrop}
                disabled={imageProgress !== null || imageDetections.length >= 4}
              >
                <span aria-hidden="true">▦</span>
                <strong>
                  {imageProgress === null
                    ? imageDetections.length >= 4
                      ? t.imageLimitHint
                      : imageDetections.length
                      ? t.addMoreImages
                      : t.chooseImage
                    : t.imageProcessing(
                        imageProgress.current,
                        imageProgress.total,
                        imageProgress.percent,
                      )}
                </strong>
                <small>{imageProgress?.fileName ?? t.chooseImageHint}</small>
                {imageProgress !== null && (
                  <i className="ocr-progress" aria-hidden="true">
                    <b style={{ width: imageProgress.percent + '%' }} />
                  </i>
                )}
              </button>
              <input
                ref={imageRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.currentTarget.files ?? []);
                  if (files.length) void onLoadImageFiles(files);
                  event.currentTarget.value = '';
                }}
                hidden
              />

              {imageDetections.length > 0 && (
                <section className="image-queue" aria-label={t.imagesReady(imageDetections.length)}>
                  <div className="image-queue-heading">
                    <strong>{t.imagesReady(imageDetections.length)}</strong>
                    <span>{t.imageLimitHint}</span>
                  </div>
                  <ul>
                    {imageDetections.map((detection, index) => (
                      <li key={detection.fileName + '-' + index}>
                        <span className="image-queue-index" aria-hidden="true">
                          {index + 1}
                        </span>
                        <div>
                          <strong>{detection.fileName}</strong>
                          <span>
                            {t.card} {detection.title} ·{' '}
                            {t.imageDetected(detection.rows, detection.columns)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveImage(index)}
                          disabled={imageProgress !== null}
                          aria-label={t.removeImage(detection.fileName)}
                          title={t.removeImage(detection.fileName)}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="review-images-button"
                    onClick={onReviewImages}
                    disabled={imageProgress !== null}
                  >
                    {t.reviewImages}
                    <span aria-hidden="true">→</span>
                  </button>
                </section>
              )}
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
                  {imageDetections.length > 0 && (
                    <div className="image-detection" role="status">
                      <strong>{t.imagesDetected(imageDetections.length)}</strong>
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
