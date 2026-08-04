import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiClock,
  FiDownload,
  FiEdit2,
  FiMapPin,
  FiTrash2,
} from 'react-icons/fi';
import { IoMdClose } from 'react-icons/io';
import { useApi } from '../../../hooks/useApi';
import { seatsTaken, timeRange } from './eventSchedule';

/**
 * Une carte du planning : un créneau, ce qui s'y joue, et où.
 *
 * La maquette pose deux actions au bas de la carte — la liste des participants
 * et la modification. Aucune des deux n'a de quoi fonctionner aujourd'hui : rien
 * ne liste les réservations d'un événement côté serveur, et le seul formulaire
 * existant crée. Elles restent affichées, désactivées, avec la raison en clair :
 * un admin doit pouvoir distinguer « pas encore livré » de « en panne ».
 */
function EventCard({ event, onDeleted = () => {} }) {
  const { t, i18n } = useTranslation();
  const target = 'admin.eventsManager.card.';
  const [isConfirming, setIsConfirming] = useState(false);

  const taken = seatsTaken(event);
  const remaining = taken === null ? null : Number(event.capacity) - taken;
  const uiLang = i18n.language.split('-')[0].toUpperCase();
  const isTranslated = !event.lang || event.lang === uiLang;

  return (
    <article className="bg-secondary border border-white/10 rounded-xl p-4 md:p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-neutral-400 tabular-nums tracking-wider">
          <FiClock className="size-4" aria-hidden="true" />
          {timeRange(event)}
        </p>

        {/* Un événement sans traduction française reste au planning — le retirer
            le ferait disparaître de la vue de l'admin — mais il se signale. */}
        {!isTranslated && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider text-amber-300 border border-amber-300/40 rounded px-1.5 py-0.5"
            title={t(target + 'otherLang', { lang: event.lang })}
          >
            {event.lang}
          </span>
        )}
      </div>

      <h2 className="text-lg md:text-xl font-bold uppercase mb-0">
        {event.title}
      </h2>

      {event.description && (
        <p className="text-sm text-neutral-300">{event.description}</p>
      )}

      <p className="text-xs uppercase tracking-wider text-neutral-400">
        {taken === null ? (
          t(target + 'free')
        ) : (
          <>
            {t(target + 'registrations', { taken })}
            <span className="text-neutral-500">
              {' — '}
              {remaining > 0
                ? t(target + 'remaining', { remaining })
                : t(target + 'full')}
            </span>
          </>
        )}
      </p>

      <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent">
        <FiMapPin className="size-4" aria-hidden="true" />
        {event.location}
      </p>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <UnavailableAction
          id={`event-participants-${event.id}`}
          icon={<FiDownload className="size-4" />}
          label={t(target + 'participants')}
          reason={t(target + 'participantsUnavailable')}
          className="border border-white/20 text-neutral-300"
        />
        <UnavailableAction
          id={`event-edit-${event.id}`}
          icon={<FiEdit2 className="size-4" />}
          label={t(target + 'edit')}
          reason={t(target + 'editUnavailable')}
          className="bg-primary border border-white/10 text-neutral-300"
        />

        <button
          type="button"
          onClick={() => setIsConfirming(true)}
          className="inline-flex items-center gap-2 text-sm text-red-300 border border-red-500/40 hover:bg-red-500/10 rounded-lg px-3 py-2 transition-colors cursor-pointer ml-auto"
        >
          <FiTrash2 className="size-4" aria-hidden="true" />
          {t(target + 'delete')}
        </button>
      </div>

      {isConfirming && (
        <DeleteDialog
          event={event}
          bookings={taken ?? 0}
          onClose={() => setIsConfirming(false)}
          onDeleted={onDeleted}
        />
      )}
    </article>
  );
}

/**
 * Une action de la maquette qui n'a pas encore de quoi tourner.
 *
 * Le bouton est désactivé — donc hors du parcours au clavier — et sa raison est
 * rattachée par `aria-describedby` plutôt que par un simple `title` : un lecteur
 * d'écran annoncerait sinon un bouton inerte sans dire pourquoi.
 */
function UnavailableAction({ id, icon, label, reason, className }) {
  return (
    <>
      <button
        type="button"
        disabled
        aria-describedby={id}
        className={`inline-flex items-center gap-2 text-sm uppercase tracking-wider font-bold rounded-lg px-4 py-2 opacity-40 cursor-not-allowed ${className}`}
      >
        {icon}
        {label}
      </button>
      <span id={id} className="sr-only">
        {reason}
      </span>
    </>
  );
}

/**
 * La confirmation de suppression.
 *
 * Elle compte les réservations à voix haute : `booking` est en `ON DELETE
 * CASCADE` sur `event`, donc supprimer l'atelier efface les inscriptions sans
 * qu'aucun mail ne parte. C'est la seule occasion de le dire à l'admin.
 */
function DeleteDialog({ event, bookings, onClose, onDeleted }) {
  const { t } = useTranslation();
  const target = 'admin.eventsManager.card.deleteDialog.';
  const api = useApi();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  /**
   * `onDeleted` n'est appelé que sur un succès, comme pour un juré : prévenir le
   * parent sur un refus le ferait recharger, et l'événement reviendrait — l'admin
   * y lirait un bug plutôt qu'un refus. Le message du serveur est repris tel
   * quel : c'est lui qui sait pourquoi il refuse.
   */
  async function remove() {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await api(`/events/${event.id}`, { method: 'DELETE' });

      // `useApi` renvoie null quand la session est morte : il a déjà déconnecté.
      if (!res) return;

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || t(target + 'error'));
        return;
      }

      onDeleted();
    } catch (e) {
      console.error('event delete error: ', e);
      setError(t(target + 'error'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div
      className="fixed left-0 top-0 h-full w-full flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm z-50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`event-delete-title-${event.id}`}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-secondary border border-neutral-700 rounded-lg shadow-xl p-6 space-y-5"
      >
        <div className="flex justify-between items-center border-b border-neutral-700 pb-4">
          <h3
            id={`event-delete-title-${event.id}`}
            className="font-bold uppercase tracking-wide"
          >
            {t(target + 'title', { title: event.title })}
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

        <p
          className={`text-sm rounded-lg p-3 border ${
            bookings > 0
              ? 'text-amber-300 bg-amber-300/10 border-amber-300/30'
              : 'text-neutral-400 bg-white/5 border-white/10'
          }`}
        >
          {bookings > 0
            ? t(target + 'bookings', { count: bookings })
            : t(target + 'noBookings')}
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
            onClick={remove}
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

export default EventCard;
