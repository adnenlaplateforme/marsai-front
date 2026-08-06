import { AiFillThunderbolt } from 'react-icons/ai';
import { Link } from 'react-router-dom';
import TitleSection from './base/TitleSection';
import { useFormatDate } from '../hooks/useFormatDate';
import { useTranslation, Trans } from 'react-i18next';

function CardWorkshop({ time, date, title, text, path, remainingSeats }) {
  const { t } = useTranslation();
  const target = 'events.workshops.';
  const isSoldOut = remainingSeats === 0;
  const seatsKnown = remainingSeats !== null && remainingSeats !== undefined;

  return (
    <div className="flex h-full flex-col rounded-xl bg-secondary p-6 ring-1 ring-white/5 lg:p-8">
      <div className="flex items-start justify-between gap-3 pb-4">
        <div>
          {date && (
            <span className="mb-2 inline-block rounded bg-white px-2 py-1 text-xs uppercase text-primary">
              {date}
            </span>
          )}
          <div className="text-4xl text-accent">{time}</div>
        </div>
        {isSoldOut && (
          <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-dark">
            {t(target + 'soldOut')}
          </span>
        )}
      </div>

      <h3 className="uppercase lg:text-xl">{title}</h3>
      <p className="pb-8 text-dark">{text}</p>

      <div className="mt-auto">
        <div className="mb-4 flex items-center justify-between gap-2">
          <p className="text-dark">{t(target + 'availability')}</p>
          <h4
            className={`text-xs uppercase ${isSoldOut ? 'text-dark' : 'text-accent'}`}
          >
            {seatsKnown
              ? t(target + 'remainingPlaces', { count: remainingSeats })
              : '...'}
          </h4>
        </div>

        {/* Un Link sans destination valide n'est pas rendu : à guichet fermé
            c'est un simple libellé, pas une cible de navigation. */}
        {isSoldOut ? (
          <span
            aria-disabled="true"
            className="button flex cursor-not-allowed justify-center rounded-md bg-gray-500 text-white opacity-50"
          >
            {t(target + 'bookNow')}
          </span>
        ) : (
          <Link
            to={'/events/' + path}
            className="button flex justify-center rounded-md bg-accent text-white transition-colors duration-200 hover:bg-accent/90"
          >
            {t(target + 'bookNow')}
          </Link>
        )}
      </div>
    </div>
  );
}

function Workshops({ data, error, loading }) {
  const { formatDate, formatTime } = useFormatDate();
  const { t } = useTranslation();
  const target = 'events.workshops.';

  return (
    <section className="section bg-primary text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2 items-center uppercase mb-6">
          <AiFillThunderbolt className="text-amber-400 text-4xl" />
          <h4 className="font-thin text-lg">{t(target + 'tag')}</h4>
        </div>
        <TitleSection
          hasUnderline
          underlineColor="bg-white"
          className="mb-8 uppercase"
        >
          <Trans
            i18nKey={target + 'title'}
            components={[<strong key="highlight" className="text-accent" />]}
          />
        </TitleSection>
        <p className="max-w-2xl mb-10">{t(target + 'description')}</p>

        {loading && (
          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-xl bg-secondary"
              />
            ))}
          </div>
        )}

        {error && <div className="text-red-500 text-center py-12">{error}</div>}

        {!loading && !error && data.length === 0 && (
          <div className="rounded-xl bg-secondary py-12 text-center text-dark">
            {t(target + 'noEvents')}
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            {data.map(event => (
              <CardWorkshop
                key={event.id}
                path={event.id + '-' + event.slug}
                time={formatTime(event.date)}
                date={formatDate(event.date)}
                title={event.title}
                text={event.description}
                remainingSeats={event.remaining_seats}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
export default Workshops;
