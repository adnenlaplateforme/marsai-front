import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BsLightningChargeFill } from 'react-icons/bs';
import { IoMdClose } from 'react-icons/io';
import {
  EVALUATIONS_PER_MOVIE,
  planDistribution,
} from './base/juryDistribution';

/**
 * Le bloc « Distribution automatique » de la maquette.
 *
 * L'attribution n'existe pas côté serveur : il n'y a ni table de lots, ni route
 * pour en créer. Ce panneau est donc l'interface seule, en attendant. Ce qu'il
 * affiche reste vrai — le nombre de films acceptés et le nombre de jurés
 * viennent de l'API, le découpage annoncé se déduit d'eux — mais les deux
 * actions ne partent nulle part et le disent.
 */
function JuryDistributionPanel({ movieCount, juryCount }) {
  const { t } = useTranslation();
  const target = 'admin.juryManager.distribution.';
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const plan = planDistribution(movieCount, juryCount);

  return (
    <section className="bg-secondary border border-accent/30 rounded-xl p-5 md:p-6 space-y-5">
      <div>
        <BsLightningChargeFill className="size-6 text-accent" />
        <h2 className="text-2xl md:text-3xl font-extrabold uppercase mt-3">
          {t(target + 'title')}
        </h2>
        <p className="text-sm text-neutral-400 mt-2 max-w-2xl">
          {t(target + 'description', {
            movies: plan.movies,
            juries: plan.juries,
            evaluationsPerMovie: EVALUATIONS_PER_MOVIE,
          })}
        </p>
      </div>

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

      {!plan.feasible && (
        <p className="text-sm text-amber-300 bg-amber-300/10 border border-amber-300/30 rounded-lg p-3">
          {plan.movies === 0
            ? t(target + 'noMovies')
            : t(target + 'notEnoughJuries', { minimum: EVALUATIONS_PER_MOVIE })}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          disabled={!plan.feasible}
          className="w-full bg-accent hover:bg-accent/80 text-white font-bold uppercase text-sm tracking-wider py-3 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {t(target + 'launch')}
        </button>
        {/* Le mode manuel de la maquette suppose de pouvoir déplacer un film
            d'un juré à l'autre : sans lot en base, il n'y a rien à déplacer. */}
        <button
          type="button"
          disabled
          title={t(target + 'unavailable')}
          className="w-full border border-white/20 text-neutral-300 font-bold uppercase text-sm tracking-wider py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t(target + 'manual')}
        </button>
        <p className="text-xs text-neutral-500 text-center">
          {t(target + 'unavailable')}
        </p>
      </div>

      {isDialogOpen && (
        <ConfirmDialog plan={plan} onClose={() => setIsDialogOpen(false)} />
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
 * La confirmation avant lancement : une attribution repartirait tous les lots
 * en cours, elle ne se déclenche pas d'un seul clic. Le bouton de confirmation
 * reste inactif tant que la route n'existe pas — mieux qu'un bouton qui
 * paraîtrait avoir fonctionné.
 */
function ConfirmDialog({ plan, onClose }) {
  const { t } = useTranslation();
  const target = 'admin.juryManager.distribution.dialog.';

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
            {t(target + 'title')}
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

        <p className="text-xs text-amber-300 bg-amber-300/10 border border-amber-300/30 rounded-lg p-3">
          {t(target + 'pending')}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-white/20 text-neutral-300 hover:text-white font-bold py-2.5 rounded-md transition-colors cursor-pointer"
          >
            {t(target + 'cancel')}
          </button>
          <button
            type="button"
            disabled
            className="flex-1 bg-accent text-white font-bold py-2.5 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t(target + 'confirm')}
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
