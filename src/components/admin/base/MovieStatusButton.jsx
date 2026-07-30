import { useState } from 'react';
import toast from 'react-hot-toast';
import { useApi } from '../../../hooks/useApi';
import { STATUS_LABELS } from './movieStatus';

function MovieStatusButton({
  movie,
  text,
  adminText,
  newStatus,
  setMovie,
  className = '',
}) {
  const api = useApi();
  const [saving, setSaving] = useState(false);

  const isCurrent = newStatus === movie.status;

  async function updateMovieStatus(status) {
    // PUT /movies/:id envoie l'e-mail au réalisateur avant d'écrire le statut :
    // l'action n'est pas annulable, on la fait confirmer.
    const to = movie.director?.email ?? 'au réalisateur';
    const confirmed = window.confirm(
      `Passer « ${movie.english_title} » en « ${STATUS_LABELS[status] ?? status} » ?\n\n` +
        `Un e-mail sera envoyé à ${to}.`
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      const res = await api('/movies/' + movie.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status,
          adminData: {
            adminText: adminText,
            adminStatus: status,
          },
        }),
      });
      if (res && res.ok) {
        toast.success('Statut mis à jour, e-mail envoyé.');
        setMovie({ ...movie, status: newStatus });
      } else {
        toast.error('Échec de la mise à jour du statut.');
      }
    } catch (e) {
      toast.error('Échec de la mise à jour du statut : ' + e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => updateMovieStatus(newStatus)}
      className={`text-black button ${
        isCurrent
          ? 'line-through bg-gray-600 cursor-not-allowed'
          : `cursor-pointer ${className}`
      } ${saving ? 'opacity-50 cursor-wait' : ''}`}
      disabled={isCurrent || saving}
    >
      {text}
    </button>
  );
}

export default MovieStatusButton;
