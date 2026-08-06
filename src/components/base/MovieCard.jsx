import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MdLocalMovies } from 'react-icons/md';
import languages from '../../data/languages';

const UNKNOWN_LANGUAGE = {
  lang: 'ZZ',
  icon: '🏳️',
  textFr: 'Inconnu',
  textEn: 'Unknown',
};

function MovieCard({ data }) {
  const { i18n } = useTranslation();
  const [coverFailed, setCoverFailed] = useState(false);

  const language =
    languages.find(elem => elem.lang === data.language) ?? UNKNOWN_LANGUAGE;
  const languageLabel =
    i18n.language === 'fr' ? language.textFr : language.textEn;
  const director = [data.director?.firstname, data.director?.lastname]
    .filter(Boolean)
    .join(' ');

  return (
    <Link
      to={'/movies/' + data.id + '-' + data.slug}
      className="group flex flex-col overflow-hidden rounded-xl bg-primary ring-1 ring-white/5 transition duration-300 hover:ring-accent/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="relative aspect-video overflow-hidden bg-secondary">
        {data.cover_path && !coverFailed ? (
          <img
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            src={data.cover_path}
            alt={data.english_title || data.original_title || ''}
            loading="lazy"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-white/20">
            <MdLocalMovies className="text-4xl" />
          </div>
        )}

        <span className="absolute left-2 top-2 rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black">
          {data.is_hybrid ? 'Hybrid' : 'Full-AI'}
        </span>
        <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          {data.duration}s
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p
          className="truncate font-bold uppercase text-white"
          title={data.english_title}
        >
          {data.english_title}
        </p>
        <p className="truncate text-xs text-dark" title={data.original_title}>
          {data.original_title}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <p className="truncate text-xs uppercase text-dark">{director}</p>
          <span
            className="shrink-0 text-base"
            title={languageLabel}
            aria-label={languageLabel}
          >
            {language.icon}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default MovieCard;
