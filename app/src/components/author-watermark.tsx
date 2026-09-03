import './author-watermark.css';

const LINKEDIN_URL = 'https://www.linkedin.com/in/jhonedarts/';

export function AuthorWatermark() {
  return (
    <div className="author-watermark" aria-label="Créditos do projeto">
      <span>by</span>
      <a
        href={LINKEDIN_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Perfil de Darts no LinkedIn (abre em uma nova aba)"
      >
        <strong>Darts</strong>
        <svg
          className="linkedin-mark"
          viewBox="0 0 24 26"
          aria-hidden="true"
        >
          <mask id="linkedin-cutout" maskUnits="userSpaceOnUse" x="1" y="1" width="24" height="22">
            <rect x="1" y="1" width="24" height="22" rx="3" fill="white" />
            <circle cx="6.6" cy="7" r="1.6" fill="black" />
            <rect x="5.1" y="10" width="3" height="8.8" fill="black" />
            <path
              d="M10.4 10h2.9v1.2c.8-1 1.9-1.5 3.3-1.5 2.8 0 4.2 1.8 4.2 5.1v4h-3v-3.7c0-1.9-.5-2.8-1.8-2.8-1.6 0-2.5 1.1-2.5 3.2v3.3h-3.1V10Z"
              fill="black"
            />
          </mask>
          <rect
            x="1"
            y="1"
            width="24"
            height="22"
            rx="3"
            fill="currentColor"
            mask="url(#linkedin-cutout)"
          />
        </svg>
      </a>
    </div>
  );
}
