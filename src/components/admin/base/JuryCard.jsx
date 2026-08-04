import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiChevronRight, FiMail, FiTrash2 } from 'react-icons/fi';
import { IoMdClose } from 'react-icons/io';
import { useApi } from '../../../hooks/useApi';

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
function JuryCard({ jury, progress = null, onDeleted = () => {} }) {
  const { t } = useTranslation();
  const target = 'admin.juryManager.card.';
  const api = useApi();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Supprime le juré, puis laisse le parent recharger la liste.
   *
   * `onDeleted` n'est appelé que sur un succès : la carte ne se retire pas
   * d'elle-même. Prévenir le parent sur un échec le ferait recharger, et la
   * liste reviendrait avec le juré toujours là — l'admin y lirait un bug plutôt
   * qu'un refus.
   *
   * Le message du serveur est repris tel quel, comme dans le panneau de
   * distribution : c'est lui qui sait pourquoi il refuse.
   */
  async function remove() {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await api(`/juries/${jury.id}`, { method: 'DELETE' });

      // `useApi` renvoie null quand la session est morte : il a déjà déconnecté.
      if (!res) return;

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || t(target + 'deleteDialog.error'));
        return;
      }

      setIsConfirming(false);
      onDeleted();
    } catch (e) {
      console.error('jury delete error: ', e);
      setError(t(target + 'deleteDialog.error'));
    } finally {
      setIsDeleting(false);
    }
  }

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

          {/* La suppression est rangée dans le détail, et non sur la ligne : il
              faut avoir ouvert la carte — donc regardé de qui il s'agit — pour
              l'atteindre. Un bouton rouge en bout de ligne se clique de
              travers, et celui-ci efface des notes. */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <a
              href={`mailto:${jury.email}`}
              className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-accent transition-colors"
            >
              <FiMail className="size-4" />
              {t(target + 'contact')}
            </a>

            <button
              type="button"
              onClick={() => setIsConfirming(true)}
              className="inline-flex items-center gap-2 text-sm text-red-300 border border-red-500/40 hover:bg-red-500/10 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
            >
              <FiTrash2 className="size-4" />
              {t(target + 'delete')}
            </button>
          </div>
        </div>
      )}

      {isConfirming && (
        <DeleteDialog
          name={name}
          error={error}
          isDeleting={isDeleting}
          onConfirm={remove}
          onClose={() => {
            setIsConfirming(false);
            setError(null);
          }}
        />
      )}
    </article>
  );
}

/**
 * La confirmation de suppression.
 *
 * Elle dit explicitement que les notes du juré s'en vont, parce que le panneau
 * de distribution promet l'inverse à quelques centimètres de là — « les notes
 * déjà posées ne sont pas effacées » — et qu'un admin qui vient de lire cette
 * phrase n'a aucune raison de deviner que la règle change ici. Le classement se
 * calcule sur ces notes : les taire ferait bouger un résultat sans témoin.
 */
function DeleteDialog({ name, error, isDeleting, onConfirm, onClose }) {
  const { t } = useTranslation();
  const target = 'admin.juryManager.card.deleteDialog.';

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
        aria-labelledby="jury-delete-dialog-title"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-secondary border border-neutral-700 rounded-lg shadow-xl p-6 space-y-5"
      >
        <div className="flex justify-between items-center border-b border-neutral-700 pb-4">
          <h3
            id="jury-delete-dialog-title"
            className="font-bold uppercase tracking-wide"
          >
            {t(target + 'title', { name })}
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

        <p className="text-sm text-neutral-300">{t(target + 'body')}</p>

        <p className="text-sm text-amber-300 bg-amber-300/10 border border-amber-300/30 rounded-lg p-3">
          {t(target + 'ratings')}
        </p>

        <p className="text-xs text-neutral-400 bg-white/5 border border-white/10 rounded-lg p-3">
          {t(target + 'notice')}
        </p>

        {error && (
          <p
            role="alert"
            className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 border border-white/20 text-neutral-300 hover:text-white font-bold py-2.5 rounded-md transition-colors disabled:opacity-40 cursor-pointer"
          >
            {t(target + 'cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isDeleting ? t(target + 'submitting') : t(target + 'confirm')}
          </button>
        </div>
      </div>
    </div>
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
