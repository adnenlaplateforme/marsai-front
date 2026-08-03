import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiChevronRight, FiMail } from 'react-icons/fi';

function juryName(jury) {
  const name = [jury?.firstname, jury?.lastname].filter(Boolean).join(' ');
  return name || jury?.email || '';
}

/**
 * Une ligne de la liste « Distribution & jury ».
 *
 * `progress` est facultatif et vaut `null` aujourd'hui : le lot de visionnage
 * d'un juré n'existe nulle part côté serveur (`GET /juries` ne renvoie que
 * id, e-mail, prénom, nom). La carte garde malgré tout la place de la
 * progression prévue par la maquette et affiche un état « lot non attribué »
 * plutôt que des chiffres inventés — le jour où la route existe, il suffit de
 * lui passer `{ assigned, rated }`.
 */
function JuryCard({ jury, progress = null }) {
  const { t } = useTranslation();
  const target = 'admin.juryManager.card.';
  const [isOpen, setIsOpen] = useState(false);

  const name = juryName(jury);
  const assigned = progress?.assigned ?? null;
  const rated = progress?.rated ?? null;
  const hasLot = assigned !== null && assigned > 0;
  const isComplete = hasLot && rated >= assigned;
  const percent = hasLot ? Math.round((rated / assigned) * 100) : 0;
  const detailsId = `jury-lot-${jury.id}`;

  return (
    <article className="bg-secondary border border-white/10 rounded-xl">
      <div className="flex items-center gap-4 p-4">
        <div
          className={`flex items-center justify-center size-14 md:size-16 rounded-xl text-2xl font-bold uppercase flex-shrink-0 ${
            isComplete
              ? 'bg-green-500 text-black'
              : 'bg-primary text-neutral-300'
          }`}
          aria-hidden="true"
        >
          {name.charAt(0)}
        </div>

        <div className="min-w-0 w-full md:w-56 md:flex-shrink-0">
          <p className="font-bold uppercase text-sm truncate">{name}</p>
          <p className="text-xs text-neutral-400 truncate">{jury.email}</p>
        </div>

        {/* La zone de progression de la maquette : sous md elle passerait sous
            le nom et écraserait la ligne, on la réserve aux écrans larges. */}
        <div className="hidden md:block flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3 text-xs mb-1.5">
            <span className="font-bold tabular-nums text-neutral-300">
              {hasLot ? `${percent}%` : '—'}
            </span>
            <span className="uppercase tracking-wider text-neutral-400 truncate">
              {hasLot
                ? t(target + 'progress', { rated, assigned })
                : t(target + 'noLot')}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-primary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isComplete ? 'bg-green-500' : 'bg-accent'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(open => !open)}
          aria-expanded={isOpen}
          aria-controls={detailsId}
          aria-label={t(target + 'toggle', { name })}
          className="inline-flex items-center justify-center size-9 rounded-lg border border-white/10 text-neutral-300 hover:text-white hover:border-accent transition-colors flex-shrink-0 cursor-pointer"
        >
          <FiChevronRight
            className={`size-5 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          />
        </button>
      </div>

      {isOpen && (
        <div id={detailsId} className="border-t border-white/10 p-4 space-y-4">
          <dl className="grid grid-cols-3 gap-3">
            <Stat label={t(target + 'assigned')} value={assigned} />
            <Stat label={t(target + 'rated')} value={rated} />
            <Stat
              label={t(target + 'remaining')}
              value={hasLot ? assigned - rated : null}
            />
          </dl>

          {/* Le détail du lot est vide tant que l'attribution n'est pas livrée :
              l'admin doit savoir que c'est l'API qui manque, pas le juré qui
              n'a rien fait. */}
          {!hasLot && (
            <p className="text-xs text-neutral-400">{t(target + 'pending')}</p>
          )}

          <a
            href={`mailto:${jury.email}`}
            className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-accent transition-colors"
          >
            <FiMail className="size-4" />
            {t(target + 'contact')}
          </a>
        </div>
      )}
    </article>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-primary border border-white/10 rounded-lg px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wider text-neutral-400">
        {label}
      </dt>
      <dd className="text-xl font-bold tabular-nums">{value ?? '—'}</dd>
    </div>
  );
}

export default JuryCard;
