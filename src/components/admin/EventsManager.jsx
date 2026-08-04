import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiPlus } from 'react-icons/bi';
import { FiUsers, FiZap } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';
import EventCard from './base/EventCard';
import {
  defaultDayIndex,
  groupByDay,
  mergeTranslations,
  scheduleStats,
} from './base/eventSchedule';

/**
 * Le planning du festival vu de l'administration.
 *
 * Les deux langues sont lues en parallèle : `GET /events?lang=` filtre sur la
 * traduction, et un événement saisi en anglais seulement ne sortirait pas de la
 * requête française — il manquerait au planning sans que personne ne le
 * remarque. `mergeTranslations` recolle ensuite les doublons.
 */
function EventsManager() {
  const { t, i18n } = useTranslation();
  const target = 'admin.eventsManager.';
  const api = useApi();
  const uiLang = i18n.language.split('-')[0].toUpperCase();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // La journée choisie à la main, `null` tant que l'admin n'a rien cliqué : la
  // page ouvre alors la journée en cours, et suit le programme s'il change.
  const [pickedDay, setPickedDay] = useState(null);

  const fetchLang = useCallback(
    async lang => {
      const res = await api(`/events?lang=${lang}`);
      if (!res || !res.ok) throw new Error(`events ${lang}`);
      return await res.json();
    },
    [api]
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [fr, en] = await Promise.all([fetchLang('FR'), fetchLang('EN')]);
      setEvents(mergeTranslations([...fr, ...en], uiLang));
      setError(null);
    } catch (e) {
      console.error('events manager error: ', e);
      setError(t(target + 'error'));
    } finally {
      setLoading(false);
    }
  }, [fetchLang, uiLang, t]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => scheduleStats(events), [events]);
  const days = useMemo(() => groupByDay(events), [events]);
  const activeKey = pickedDay ?? days[defaultDayIndex(days)]?.key;
  const activeDay = days.find(day => day.key === activeKey) ?? days[0];

  return (
    <div className="p-4 md:p-6 space-y-5 text-white">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            {t(target + 'overline')}
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase mt-2">
            {t(target + 'title')}
          </h1>
          <p className="text-neutral-400 mt-2">{t(target + 'subtitle')}</p>
        </div>
        <Link
          to="add"
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-accent/90 hover:bg-accent text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors"
        >
          {t(target + 'addEvent')}
          <BiPlus className="size-5" />
        </Link>
      </div>

      {error && (
        <p
          role="alert"
          className="text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm"
        >
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-16 text-neutral-300">
          <p className="text-sm">{t(target + 'loading')}</p>
          <AiOutlineLoading3Quarters className="animate-spin size-10" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <StatCard
              icon={<FiUsers className="size-7" />}
              iconClass="bg-primary text-neutral-200"
              label={t(target + 'stats.bookings')}
              value={stats.bookings}
              hint={
                stats.workshops > 0
                  ? t(target + 'stats.bookingsHint', { count: stats.workshops })
                  : t(target + 'stats.noWorkshop')
              }
            />
            <StatCard
              icon={<FiZap className="size-7" />}
              iconClass="bg-accent/10 text-accent"
              label={t(target + 'stats.fillRate')}
              // Un festival sans atelier réservable n'a pas un remplissage de
              // 0 % : il n'a rien à remplir, et le tiret le dit sans mentir.
              value={stats.fillRate === null ? '—' : `${stats.fillRate}%`}
              hint={t(target + 'stats.fillRateHint')}
            />
          </div>

          {days.length === 0 ? (
            <p className="bg-secondary border border-white/10 rounded-xl text-center text-neutral-500 text-sm py-10">
              {t(target + 'empty')}
            </p>
          ) : (
            <>
              <div
                role="tablist"
                aria-label={t(target + 'days.label')}
                className="flex gap-1 overflow-x-auto bg-secondary border border-white/10 rounded-xl p-1"
              >
                {days.map(day => (
                  <button
                    key={day.key}
                    type="button"
                    role="tab"
                    id={`day-tab-${day.key}`}
                    aria-selected={day.key === activeDay.key}
                    aria-controls={`day-panel-${day.key}`}
                    onClick={() => setPickedDay(day.key)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                      day.key === activeDay.key
                        ? 'bg-accent text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {dayLabel(day.date, i18n.language)}
                  </button>
                ))}
              </div>

              <div
                id={`day-panel-${activeDay.key}`}
                role="tabpanel"
                aria-labelledby={`day-tab-${activeDay.key}`}
                className="space-y-3"
              >
                {activeDay.events.map(event => (
                  // `load` et non un retrait local : la suppression change aussi
                  // les réservations totales et le taux affichés en haut de page.
                  <EventCard key={event.id} event={event} onDeleted={load} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function dayLabel(date, language) {
  return date.toLocaleDateString(language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function StatCard({ icon, iconClass, label, value, hint }) {
  return (
    <div className="flex items-center gap-4 bg-secondary border border-white/10 rounded-xl p-4 md:p-5">
      <div
        className={`flex items-center justify-center size-16 rounded-2xl flex-shrink-0 ${iconClass}`}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          {label}
        </p>
        <p className="text-3xl md:text-4xl font-extrabold tabular-nums my-0.5">
          {value}
        </p>
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          {hint}
        </p>
      </div>
    </div>
  );
}

export default EventsManager;
