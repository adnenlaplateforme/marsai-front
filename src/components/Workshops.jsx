import { AiFillThunderbolt } from 'react-icons/ai';
import TitleSection from './base/TitleSection';
import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useFormatDate } from '../hooks/useFormatDate';
import PrimaryButton from './base/PrimaryButton';
import { useTranslation, Trans } from 'react-i18next';

function CardWorkshop({
  time,
  date,
  title,
  text,
  path,
  remainingSeats,
  className = '',
}) {
  const { t } = useTranslation();
  const target = 'events.workshops.';
  return (
    <div
      className={`flex-1 bg-primary rounded-md px-2 py-8 lg:px-8 lg:py-12 lg:mx-0 ${className}`}
    >
      <div className="flex flex-col items-start pb-4">
        {date && (
          <span className="text-xs uppercase text-primary bg-white px-2 py-1 rounded-xs mb-2">
            {date}
          </span>
        )}
        <div className="text-accent text-4xl">{time}</div>
      </div>
      <h3 className="pr-6 uppercase lg:text-xl">{title}</h3>
      <p className="text-dark pb-12">{text}</p>
      <div className="flex items-center justify-between mb-6">
        <p className="text-dark">{t(target + 'availability')}</p>
        <h4 className="uppercase text-accent text-xs">
          {remainingSeats !== null
            ? t(target + 'remainingPlaces', { count: remainingSeats })
            : '...'}
        </h4>
      </div>
      <PrimaryButton
        to={remainingSeats === 0 ? null : '/events/' + path}
        hasIcon={false}
        className={`justify-center rounded-md ${remainingSeats === 0 ? 'bg-gray-500 opacity-50 pointer-events-none' : 'bg-accent'}`}
      >
        {t(target + 'bookNow')}
      </PrimaryButton>
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
        <p className="max-w-2xl mb-6">{t(target + 'description')}</p>
        {loading && (
          <div className="text-white text-center py-12">
            {t(target + 'loading')}
          </div>
        )}

        {error && <div className="text-red-500 text-center py-12">{error}</div>}

        {!loading && !error && data.length === 0 && (
          <div className="text-white text-center py-12">
            {t(target + 'noEvents')}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {data.map(event => (
            <CardWorkshop
              key={event.id}
              path={event.id + '-' + event.slug}
              time={formatTime(event.date)}
              date={formatDate(event.date)}
              title={event.title}
              text={event.description}
              remainingSeats={event.remaining_seats}
              className={`text-white bg-secondary`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
export default Workshops;
