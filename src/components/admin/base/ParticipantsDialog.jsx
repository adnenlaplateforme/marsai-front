import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FiDownload } from 'react-icons/fi';
import { IoMdClose } from 'react-icons/io';
import { useApi } from '../../../hooks/useApi';
import { participantsCsv } from './participantsCsv';

/**
 * Qui a réservé cet atelier.
 *
 * La maquette pose une icône de téléchargement sur cette action : l'admin veut
 * la liste en main — pour l'accueil, pour un émargement — pas seulement à
 * l'écran. Le tableau et l'export lisent donc la même réponse, celle de
 * `GET /events/:id/bookings`, et le fichier se fabrique ici plutôt que de
 * demander au serveur un second format de la même donnée.
 */
function ParticipantsDialog({ event, onClose }) {
  const { t } = useTranslation();
  const target = 'admin.eventsManager.card.participantsDialog.';
  const api = useApi();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let abandoned = false;

    async function load() {
      try {
        const res = await api(`/events/${event.id}/bookings`);

        // `useApi` rend null quand la session est morte : il a déjà déconnecté,
        // afficher une erreur de plus ne dirait rien à personne.
        if (!res || abandoned) return;

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          if (!abandoned) setError(body?.message || t(target + 'error'));
          return;
        }

        const data = await res.json();
        if (!abandoned) setBookings(data);
      } catch (e) {
        console.error('event bookings error: ', e);
        if (!abandoned) setError(t(target + 'error'));
      } finally {
        if (!abandoned) setLoading(false);
      }
    }

    load();
    return () => {
      abandoned = true;
    };
  }, [api, event.id, t]);

  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  /**
   * Fabrique le fichier et le remet au navigateur.
   *
   * L'ancre est éphémère : rien à afficher, seul le clic compte. L'URL est
   * révoquée aussitôt, sans quoi le blob resterait en mémoire jusqu'au
   * rechargement de la page.
   */
  const exportCsv = useCallback(() => {
    const csv = participantsCsv(bookings, [
      t(target + 'columnName'),
      t(target + 'columnFirstname'),
      t(target + 'columnEmail'),
      t(target + 'columnBookedAt'),
    ]);

    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `participants-${event.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [bookings, event.id, t]);

  return (
    <div
      className="fixed left-0 top-0 h-full w-full flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm z-50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`event-participants-title-${event.id}`}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-secondary border border-neutral-700 rounded-lg shadow-xl p-6 space-y-5"
      >
        <div className="flex justify-between items-center gap-4 border-b border-neutral-700 pb-4">
          <h3
            id={`event-participants-title-${event.id}`}
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

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-10 text-neutral-300">
            <p className="text-sm">{t(target + 'loading')}</p>
            <AiOutlineLoading3Quarters className="animate-spin size-8" />
          </div>
        ) : error ? (
          <p
            role="alert"
            className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3"
          >
            {error}
          </p>
        ) : bookings.length === 0 ? (
          <p className="text-center text-sm text-neutral-400 py-10">
            {t(target + 'empty')}
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-wider text-neutral-400">
                {t(target + 'count', { count: bookings.length })}
              </p>
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-2 text-sm uppercase tracking-wider font-bold border border-white/20 text-neutral-200 hover:bg-white/5 rounded-lg px-4 py-2 transition-colors cursor-pointer"
              >
                <FiDownload className="size-4" aria-hidden="true" />
                {t(target + 'export')}
              </button>
            </div>

            <ul className="max-h-96 overflow-y-auto divide-y divide-white/10 border border-white/10 rounded-lg">
              {bookings.map(booking => {
                const name = fullName(booking);
                return (
                  <li
                    key={booking.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-3"
                  >
                    <span className="font-bold">{name || booking.email}</span>
                    {/* L'adresse n'est répétée que si le nom l'a remplacée en
                        titre : l'afficher deux fois sur la même ligne ferait
                        douter qu'il s'agisse bien du même participant. */}
                    {name && (
                      <span className="text-sm text-neutral-400">
                        {booking.email}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Le nom du participant, ou une chaîne vide.
 *
 * `firstname` et `lastname` sont nullables : seul l'e-mail est exigé à la
 * réservation. L'appelant se rabat donc sur l'adresse — une ligne vide ferait
 * passer une inscription valable pour une fiche corrompue.
 */
function fullName(booking) {
  return [booking.firstname, booking.lastname].filter(Boolean).join(' ');
}

export default ParticipantsDialog;
