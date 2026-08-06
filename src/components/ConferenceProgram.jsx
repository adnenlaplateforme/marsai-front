import { useTranslation, Trans } from 'react-i18next';
import TitleSection from './base/TitleSection';
import { useFormatDate } from '../hooks/useFormatDate';
import SmallCard from './base/SmallCard';

function ConferenceProgram({ data, error, loading }) {
  const { formatDate, formatTime } = useFormatDate();
  const { t } = useTranslation();
  const target = 'events.conference.';

  return (
    <section className="section">
      <div className="max-w-4xl mx-auto">
        <TitleSection
          hasUnderline
          underlineColor="bg-white"
          className="text-white mb-12"
        >
          <Trans
            i18nKey={target + 'title'}
            components={[<strong key="highlight" className="text-accent" />]}
          />
        </TitleSection>

        {loading && (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-xl bg-primary"
              />
            ))}
          </div>
        )}

        {error && <div className="text-red-500 text-center py-12">{error}</div>}

        {!loading && !error && data.length === 0 && (
          <div className="rounded-xl bg-primary py-12 text-center text-dark">
            {t(target + 'program.noEvents')}
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {data.map(event => (
              <SmallCard
                key={event.id}
                title={event.title}
                subtitle={formatTime(event.date)}
                date={formatDate(event.date)}
                duration={
                  event.duration
                    ? t(target + 'program.duration') + event.duration + ' min'
                    : ''
                }
                label={event.description}
                hasUnderline={false}
                className="text-white bg-primary"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ConferenceProgram;
