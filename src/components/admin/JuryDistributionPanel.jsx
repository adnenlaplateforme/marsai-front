import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BsLightningChargeFill } from 'react-icons/bs';
import { IoMdClose } from 'react-icons/io';
import { useApi } from '../../hooks/useApi';
import {
  MIN_JURIES_PER_MOVIE,
  planDistribution,
} from './base/juryDistribution';

/**
 * Le bloc « Distribution automatique » de la maquette.
 *
 * Le panneau a deux visages, et c'est `assignment` qui tranche : tant qu'aucune
 * ligne n'existe en base, il annonce ce que l'attribution produirait et propose
 * de la lancer ; une fois faite, il n'annonce plus rien — il montre les
 * compteurs réels et propose la remise à zéro.
 *
 * La bascule se lit sur le total attribué plutôt que sur un drapeau local :
 * l'attribution est un acte unique côté serveur, qui répond 409 à un second
 * appel. Un état local se désynchroniserait dès que l'admin ouvre deux onglets.
 */
function JuryDistributionPanel({
  movieCount,
  juryCount,
  assignment,
  onChange = () => {},
}) {
  const { t } = useTranslation();
  const target = 'admin.juryManager.distribution.';
  const api = useApi();

  const [pendingAction, setPendingAction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const plan = planDistribution(movieCount, juryCount);
  const juries = assignment?.juries ?? [];
  const totalAssigned = juries.reduce((sum, jury) => sum + jury.assigned, 0);
  const totalRated = juries.reduce((sum, jury) => sum + jury.rated, 0);
  const isAssigned = totalAssigned > 0;
  const unassigned = assignment?.unassigned ?? 0;

  /**
   * Lance l'attribution ou la remet à zéro.
   *
   * Le message du serveur est repris tel quel sur les refus métier : c'est lui
   * qui sait pourquoi il refuse (aucun film accepté, moins de deux jurés), et le
   * réécrire ici le ferait dériver à chaque évolution du back. Seul le 409 reçoit
   * son propre texte, parce qu'il appelle une action précise de l'admin —
   * réinitialiser d'abord.
   */
  async function run(action) {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api('/jury-assignments', {
        method: action === 'reset' ? 'DELETE' : 'POST',
      });

      // `useApi` renvoie null quand la session est morte : il a déjà déconnecté.
      if (!res) return;

      if (!res.ok) {
        if (res.status === 409) {
          setError(t(target + 'errors.conflict'));
        } else {
          const body = await res.json().catch(() => null);
          setError(body?.message || t(target + 'errors.generic'));
        }
        return;
      }

      setPendingAction(null);
      onChange();
    } catch (e) {
      console.error('jury distribution error: ', e);
      setError(t(target + 'errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="bg-secondary border border-accent/30 rounded-xl p-5 md:p-6 space-y-5">
      <div>
        <BsLightningChargeFill className="size-6 text-accent" />
        <h2 className="text-2xl md:text-3xl font-extrabold uppercase mt-3">
          {t(target + 'title')}
        </h2>
        <p className="text-sm text-neutral-400 mt-2 max-w-2xl">
          {isAssigned
            ? t(target + 'doneDescription', { juries: juries.length })
            : t(target + 'description', {
                movies: plan.movies,
                juries: plan.juries,
                evaluationsPerMovie: plan.perMovie || MIN_JURIES_PER_MOVIE,
              })}
        </p>
      </div>

      {isAssigned ? (
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <PlanStat label={t(target + 'stats.assigned')} value={totalAssigned} />
          <PlanStat label={t(target + 'stats.juries')} value={juries.length} />
          <PlanStat label={t(target + 'stats.rated')} value={totalRated} />
          <PlanStat label={t(target + 'stats.uncovered')} value={unassigned} />
        </dl>
      ) : (
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <PlanStat label={t(target + 'stats.movies')} value={plan.movies} />
          <PlanStat label={t(target + 'stats.juries')} value={plan.juries} />
          <PlanStat
            label={t(target + 'stats.evaluations')}
            value={plan.evaluations}
          />
          <PlanStat
            label={t(target + 'stats.perJury')}
            value={plan.feasible ? plan.perJury : '—'}
            hint={
              plan.feasible && plan.extraJuries > 0
                ? t(target + 'stats.extraJuries', { count: plan.extraJuries })
                : null
            }
          />
        </dl>
      )}

      {/* Le seul signal qu'un film accepté après l'attribution existe : sans lui,
          il n'aurait aucun juré et personne ne s'en apercevrait avant la
          délibération. */}
      {isAssigned && unassigned > 0 && (
        <p className="text-sm text-amber-300 bg-amber-300/10 border border-amber-300/30 rounded-lg p-3">
          {t(target + 'uncovered', { count: unassigned })}
        </p>
      )}

      {!isAssigned && !plan.feasible && (
        <p className="text-sm text-amber-300 bg-amber-300/10 border border-amber-300/30 rounded-lg p-3">
          {plan.movies === 0
            ? t(target + 'noMovies')
            : t(target + 'notEnoughJuries', { minimum: MIN_JURIES_PER_MOVIE })}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {isAssigned ? (
          <button
            type="button"
            onClick={() => setPendingAction('reset')}
            disabled={isSubmitting}
            className="w-full border border-red-500/40 text-red-300 hover:bg-red-500/10 font-bold uppercase text-sm tracking-wider py-3 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {t(target + 'reset')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPendingAction('launch')}
            disabled={!plan.feasible || isSubmitting}
            className="w-full bg-accent hover:bg-accent/80 text-white font-bold uppercase text-sm tracking-wider py-3 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {t(target + 'launch')}
          </button>
        )}

        {/* Les routes d'ajustement à l'unité existent, mais aucune ne renvoie la
            *liste* des films d'un lot : l'admin choisirait à l'aveugle ce qu'il
            retire. Le bouton attend cette route. */}
        <button
          type="button"
          disabled
          title={t(target + 'manualUnavailable')}
          className="w-full border border-white/20 text-neutral-300 font-bold uppercase text-sm tracking-wider py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t(target + 'manual')}
        </button>
        <p className="text-xs text-neutral-500 text-center">
          {t(target + 'manualUnavailable')}
        </p>
      </div>

      {pendingAction && (
        <ConfirmDialog
          action={pendingAction}
          plan={plan}
          totalAssigned={totalAssigned}
          isSubmitting={isSubmitting}
          onConfirm={() => run(pendingAction)}
          onClose={() => setPendingAction(null)}
        />
      )}
    </section>
  );
}

function PlanStat({ label, value, hint = null }) {
  return (
    <div className="bg-primary border border-white/10 rounded-lg px-4 py-3">
      <dt className="text-[10px] uppercase tracking-wider text-neutral-400">
        {label}
      </dt>
      <dd className="text-2xl font-extrabold tabular-nums">{value}</dd>
      {hint && <p className="text-[10px] text-neutral-500 mt-0.5">{hint}</p>}
    </div>
  );
}

/**
 * La confirmation, pour les deux actions.
 *
 * La remise à zéro mérite la sienne autant que le lancement : elle efface tous
 * les lots en cours. Elle rappelle explicitement que les notes déjà posées y
 * survivent — c'est vrai en base, les deux tables étant séparées, et c'est la
 * première question que se pose un admin devant ce bouton.
 */
function ConfirmDialog({
  action,
  plan,
  totalAssigned,
  isSubmitting,
  onConfirm,
  onClose,
}) {
  const { t } = useTranslation();
  const target = 'admin.juryManager.distribution.dialog.';
  const isReset = action === 'reset';

  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed left-0 top-0 h-full w-full flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm z-50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="distribution-dialog-title"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-secondary border border-neutral-700 rounded-lg shadow-xl p-6 space-y-5"
      >
        <div className="flex justify-between items-center border-b border-neutral-700 pb-4">
          <h3
            id="distribution-dialog-title"
            className="font-bold uppercase tracking-wide"
          >
            {t(target + (isReset ? 'resetTitle' : 'title'))}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(target + 'close')}
            className="hover:text-accent transition-colors cursor-pointer"
          >
            <IoMdClose size={24} />
          </button>
        </div>

        {isReset ? (
          <p className="text-sm text-neutral-300">
            {t(target + 'resetBody', { count: totalAssigned })}
          </p>
        ) : (
          <dl className="text-sm divide-y divide-white/10">
            <Line label={t(target + 'movies')} value={plan.movies} />
            <Line label={t(target + 'juries')} value={plan.juries} />
            <Line label={t(target + 'evaluations')} value={plan.evaluations} />
            <Line
              label={t(target + 'perJury')}
              value={
                plan.extraJuries > 0
                  ? t(target + 'perJuryUneven', {
                      perJury: plan.perJury,
                      count: plan.extraJuries,
                    })
                  : plan.perJury
              }
            />
          </dl>
        )}

        <p className="text-xs text-neutral-400 bg-white/5 border border-white/10 rounded-lg p-3">
          {t(target + (isReset ? 'resetNotice' : 'notice'))}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 border border-white/20 text-neutral-300 hover:text-white font-bold py-2.5 rounded-md transition-colors disabled:opacity-40 cursor-pointer"
          >
            {t(target + 'cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`flex-1 text-white font-bold py-2.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
              isReset
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-accent hover:bg-accent/80'
            }`}
          >
            {isSubmitting ? t(target + 'submitting') : t(target + 'confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="text-neutral-400">{label}</dt>
      <dd className="font-bold tabular-nums text-right">{value}</dd>
    </div>
  );
}

export default JuryDistributionPanel;
