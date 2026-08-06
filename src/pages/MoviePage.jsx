import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaArrowLeftLong } from 'react-icons/fa6';
import { MdLocalMovies } from 'react-icons/md';
import TopPageTwo from '../components/base/TopPageTwo';
import languages from '../data/languages';

const CARD = 'rounded-2xl bg-primary p-6 ring-1 ring-white/5';
const CARD_TITLE =
  'text-sm font-bold uppercase tracking-wider text-accent pb-3';

function InfoCard({ title, children }) {
  return (
    <section className={CARD}>
      <h2 className={CARD_TITLE}>{title}</h2>
      {children}
    </section>
  );
}

function MoviePage() {
  const { idSlug } = useParams();
  const id = idSlug?.split('-')[0];
  const { t, i18n } = useTranslation();
  const target = 'movie.';

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      setError(t(target + 'notFound'));
      setIsLoading(false);
      return;
    }
    let ignore = false;

    async function getMovieData() {
      try {
        const res = await fetch(
          import.meta.env.VITE_SERVER_ADDRESS + '/movies/' + id,
          { method: 'GET' }
        );
        const json = await res.json();
        if (ignore) return;
        if (res.ok) {
          setData(json);
        } else {
          setError(json.message || t(target + 'fetchError'));
        }
      } catch (e) {
        console.error('error: ', e);
        if (!ignore) setError(t(target + 'connectionError'));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    getMovieData();
    return () => {
      ignore = true;
    };
  }, [id, t]);

  const backLink = (
    <Link
      to="/movies"
      className="inline-flex items-center gap-2 text-sm uppercase tracking-wider text-dark transition-colors hover:text-white"
    >
      <FaArrowLeftLong />
      {t(target + 'backToGallery')}
    </Link>
  );

  if (isLoading) {
    return (
      <div className="text-white">
        <TopPageTwo />
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
          <div className="h-8 w-2/3 animate-pulse rounded bg-primary" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-primary" />
          <div className="aspect-video animate-pulse rounded-2xl bg-primary" />
          <div className="h-32 animate-pulse rounded-2xl bg-primary" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-white">
        <TopPageTwo />
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-24 text-center">
          <MdLocalMovies className="text-5xl text-white/20" />
          <p className="text-lg font-semibold">
            {error || t(target + 'notFound')}
          </p>
          {backLink}
        </div>
      </div>
    );
  }

  const director = data.director;
  const language = languages.find(elem => elem.lang === data.language);
  const languageLabel = language
    ? i18n.language === 'fr'
      ? language.textFr
      : language.textEn
    : data.language;
  const submittedOn = new Date(data.submitted_at).toLocaleDateString(
    i18n.language
  );

  return (
    <div className="text-white">
      <TopPageTwo />

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        {backLink}

        <header className="space-y-2">
          <h1 className="text-3xl font-bold uppercase md:text-4xl">
            {data.english_title}
          </h1>
          {data.original_title !== data.english_title && (
            <p className="text-lg text-dark">{data.original_title}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="rounded-md bg-white/95 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-black">
              {data.is_hybrid ? t(target + 'hybrid') : t(target + 'fullAi')}
            </span>
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold text-white">
              {t(target + 'duration', { count: data.duration })}
            </span>
            {language && (
              <span
                className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold text-white"
                title={languageLabel}
              >
                {language.icon} {languageLabel}
              </span>
            )}
            {data.has_subs && (
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold text-white">
                {t(target + 'subtitles')}
              </span>
            )}
          </div>
        </header>

        <div className="aspect-video overflow-hidden rounded-2xl bg-black ring-1 ring-white/5">
          <video
            src={data.video_path}
            controls
            poster={data.cover_path}
            className="size-full object-contain"
          />
        </div>

        {data.stills?.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {data.stills.map((url, index) => (
              <img
                key={url}
                src={url}
                alt={t(target + 'stillAlt', { index: index + 1 })}
                loading="lazy"
                className="aspect-video w-full rounded-xl object-cover ring-1 ring-white/5"
              />
            ))}
          </div>
        )}

        <InfoCard title={t(target + 'synopsis')}>
          <p className="leading-relaxed text-white/90">
            {data.english_synopsis}
          </p>
          {data.original_synopsis !== data.english_synopsis && (
            <p className="pt-3 text-sm leading-relaxed text-dark">
              {data.original_synopsis}
            </p>
          )}
        </InfoCard>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title={t(target + 'creativeProcess')}>
            <p className="text-sm leading-relaxed text-white/90">
              {data.creative_process}
            </p>
          </InfoCard>
          <InfoCard title={t(target + 'aiTools')}>
            <p className="text-sm leading-relaxed text-white/90">
              {data.ai_tools}
            </p>
          </InfoCard>
        </div>

        {director && (
          <InfoCard title={t(target + 'director')}>
            <p className="font-semibold">
              {[director.gender, director.firstname, director.lastname]
                .filter(Boolean)
                .join(' ')}
            </p>
            {director.job && (
              <p className="text-sm text-dark">{director.job}</p>
            )}
            {(director.city || director.country) && (
              <p className="text-sm text-dark">
                {[director.city, director.country].filter(Boolean).join(', ')}
              </p>
            )}
          </InfoCard>
        )}

        {data.collaborators?.length > 0 && (
          <InfoCard title={t(target + 'team')}>
            <div className="grid gap-2 sm:grid-cols-2">
              {data.collaborators.map((collaborator, index) => (
                <p key={index} className="text-sm">
                  <span className="font-medium">
                    {collaborator.firstname} {collaborator.lastname}
                  </span>
                  {collaborator.contribution && (
                    <span className="text-dark">
                      {' — '}
                      {collaborator.contribution}
                    </span>
                  )}
                </p>
              ))}
            </div>
          </InfoCard>
        )}

        <p className="text-right text-xs text-dark">
          {t(target + 'submittedOn', { date: submittedOn })}
        </p>
      </div>
    </div>
  );
}

export default MoviePage;
