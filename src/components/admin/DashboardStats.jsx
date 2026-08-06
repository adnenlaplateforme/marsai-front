import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FiAward, FiFilm, FiZap } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';
import { juryCompletion, juryReview } from './base/dashboardOverview';
import { mergeTranslations, scheduleStats } from './base/eventSchedule';

/**
 * La vue d'ensemble du back-office.
 *
 * Trois des cinq indicateurs de la maquette sont retenus, tous calculés sur des
 * routes qui existent déjà : l'avancement du jury vient de
 * `GET /jury-assignments`, le remplissage des ateliers de `GET /events`, qui
 * sert `capacity` et `remaining_seats`.
 *
 * Les deux autres ont été écartées faute de données à leur donner. « Comptes
 * réalisateurs actifs » n'a aucun sens ici — un réalisateur est un
 * `collaborator` rattaché à un film, jamais un compte. « Pays représentés »
 * aurait pu se lire dans `collaborator.country`, mais c'est un champ de texte
 * libre saisi à la soumission, et la maquette en attend un continent que rien
 * en base ne sait déduire.
 *
 * Les deux lectures sont indépendantes (`allSettled`) : une route en échec ne
 * doit vider que ses propres tuiles, pas la page entière.
 */
function DashboardStats() {
  const { t, i18n } = useTranslation();
  const target = 'admin.dashboard.';
  const api = useApi();
  const uiLang = i18n.language.split('-')[0].toUpperCase();

  const [assignment, setAssignment] = useState(null);
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const read = useCallback(
    async path => {
      const res = await api(path);
      // `useApi` rend null quand la session est morte : il a déjà déconnecté,
      // afficher une erreur de plus ne dirait rien à personne.
      if (!res) return null;
      if (!res.ok) throw new Error(path);
      return await res.json();
    },
    [api]
  );

  // Pas de `setLoading(true)` en tête : `useState(true)` couvre déjà le premier
  // passage, et le rallumer à chaque relecture rendrait la page au spinner
  // quand l'admin change la langue de l'interface — pour un simple changement
  // de tri des traductions, données déjà en main.
  const load = useCallback(async () => {
    try {
      const [jury, schedule] = await Promise.allSettled([
        read('/jury-assignments'),
        // Les deux langues, comme le planning : `GET /events?lang=` filtre sur
        // la traduction, et un atelier saisi en anglais seulement manquerait au
        // total des places sans que personne ne le remarque.
        Promise.all([read('/events?lang=FR'), read('/events?lang=EN')]),
      ]);

      if (jury.status === 'fulfilled') setAssignment(jury.value);
      if (schedule.status === 'fulfilled' && schedule.value.every(Boolean)) {
        setEvents(mergeTranslations(schedule.value.flat(), uiLang));
      }

      const failed = [jury, schedule].filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        console.error('dashboard error: ', failed[0].reason);
        setError(t(target + 'error'));
      } else {
        setError(null);
      }
    } catch (e) {
      // `allSettled` n'échoue jamais : ce qui passe ici, c'est la mise en forme
      // qui suit. Sans ce filet, la page resterait au spinner sans rien
      // annoncer.
      console.error('dashboard error: ', e);
      setError(t(target + 'error'));
    } finally {
      setLoading(false);
    }
  }, [read, uiLang, t]);

  useEffect(() => {
    load();
  }, [load]);

  const review = useMemo(() => juryReview(assignment), [assignment]);
  const completion = useMemo(() => juryCompletion(assignment), [assignment]);
  const workshops = useMemo(
    () => (events ? scheduleStats(events) : null),
    [events]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-neutral-300">
        <p className="text-sm">{t(target + 'loading')}</p>
        <AiOutlineLoading3Quarters className="animate-spin size-10" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 text-white">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
          {t(target + 'overline')}
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold uppercase mt-2">
          {t(target + 'title')}
        </h1>
        <p className="text-neutral-400 mt-2 max-w-2xl">
          {t(target + 'subtitle')}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm"
        >
          {error}
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <StatCard
          icon={<FiFilm className="size-7" />}
          iconClass="bg-blue-500/10 text-blue-400"
          badge={
            review.target > 0
              ? t(target + 'review.target', { target: review.target })
              : null
          }
          value={review.done}
          label={t(target + 'review.label')}
          footer={
            review.percent === null
              ? t(target + 'review.noTarget')
              : t(target + 'review.progress', { percent: review.percent })
          }
          percent={review.percent}
          barClass="bg-blue-500"
        />

        <StatCard
          icon={<FiAward className="size-7" />}
          iconClass="bg-accent/10 text-accent"
          badge={
            completion.quota > 0
              ? t(target + 'completion.quota', { quota: completion.quota })
              : null
          }
          value={ratio(completion.finalized, completion.juries)}
          label={t(target + 'completion.label')}
          footer={
            completion.quota === 0
              ? t(target + 'completion.noQuota')
              : t(
                  target +
                    (completion.complete
                      ? 'completion.done'
                      : 'completion.pending')
                )
          }
          percent={
            completion.juries > 0
              ? Math.round((completion.finalized / completion.juries) * 100)
              : null
          }
          barClass="bg-accent"
        />

        {/* Sur toute la largeur : la tuile ferme la grille, comme le bandeau
            du bas de la maquette, et porte le seul lien de la page. */}
        <section className="md:col-span-2 flex flex-col sm:flex-row sm:items-center gap-4 md:gap-5 bg-secondary border border-accent/30 rounded-xl p-4 md:p-5">
          <div
            className="flex items-center justify-center size-16 rounded-2xl flex-shrink-0 bg-accent/10 text-accent"
            aria-hidden="true"
          >
            <FiZap className="size-7" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-4xl md:text-5xl font-extrabold tabular-nums">
              {!workshops || workshops.fillRate === null
                ? '—'
                : `${workshops.fillRate}%`}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mt-1">
              {t(target + 'workshops.label')}
            </p>
            <p className="text-xs uppercase tracking-wider text-neutral-500 mt-1">
              {!workshops || workshops.fillRate === null
                ? t(target + 'workshops.none')
                : t(target + 'workshops.hint', {
                    bookings: workshops.bookings,
                    capacity: workshops.capacity,
                  })}
            </p>
          </div>

          <Link
            to="/admin/events"
            className="text-center bg-accent hover:bg-accent/80 text-white font-bold uppercase text-sm tracking-wider py-3 px-6 rounded-lg whitespace-nowrap transition-colors"
          >
            {t(target + 'workshops.cta')}
          </Link>
        </section>
      </div>
    </div>
  );
}

/**
 * `08/12` : le compteur est cadré sur la largeur du total, comme la maquette.
 * Un `8/12` sauterait d'un caractère au passage à deux chiffres.
 */
function ratio(done, total) {
  return `${String(done).padStart(String(total).length, '0')}/${total}`;
}

function StatCard({
  icon,
  iconClass,
  badge = null,
  value,
  label,
  footer,
  percent = null,
  barClass = 'bg-accent',
}) {
  return (
    <section className="flex flex-col justify-between gap-4 bg-secondary border border-white/10 rounded-xl p-4 md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex items-center justify-center size-16 rounded-2xl flex-shrink-0 ${iconClass}`}
          aria-hidden="true"
        >
          {icon}
        </div>
        {badge && (
          <p className="text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
            {badge}
          </p>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-4xl md:text-5xl font-extrabold tabular-nums">
          {value}
        </p>
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mt-1">
          {label}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          {footer}
        </p>
        {percent !== null && (
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
            className="h-2 w-full bg-white/10 rounded-full overflow-hidden"
          >
            <div
              className={`h-full rounded-full ${barClass}`}
              style={{ width: `${Math.min(100, percent)}%` }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default DashboardStats;
