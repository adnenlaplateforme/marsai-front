import { useState } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import MovieStatusButton from './base/MovieStatusButton';
import { ADMIN_ACTIONS, STATUS_BADGE, STATUS_LABELS } from './base/movieStatus';

function AdminMoviePanel({ movie, setMovie }) {
  const [textContent, setTextContent] = useState('');

  return (
    <div className="bg-secondary border border-white/10 rounded-xl p-5 text-white">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider">
          Décision admin
        </h2>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
            STATUS_BADGE[movie.status] ?? 'bg-neutral-600 text-white'
          }`}
        >
          {STATUS_LABELS[movie.status] ?? movie.status}
        </span>
      </div>

      <label
        htmlFor="admin-comment"
        className="block text-xs uppercase tracking-wider text-neutral-400 mb-2"
      >
        Commentaire (inséré dans l&apos;e-mail)
      </label>
      <textarea
        id="admin-comment"
        name="admin-comment"
        rows={6}
        value={textContent}
        onChange={e => setTextContent(e.target.value)}
        placeholder={
          'Message pour le réalisateur.\nPour « Lauréat », indiquez le titre remporté.'
        }
        className="w-full bg-primary border border-white/10 rounded-lg p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent resize-y"
      />

      <p className="flex items-start gap-2 text-xs text-neutral-400 mt-3">
        <FiAlertTriangle className="size-4 flex-shrink-0 mt-0.5 text-orange-400" />
        <span>
          Chaque changement de statut envoie immédiatement un e-mail à{' '}
          <span className="text-neutral-200">
            {movie.director?.email ?? 'au réalisateur'}
          </span>
          . « Correction » y joint en plus un lien de modification de la fiche.
        </span>
      </p>

      <div className="flex flex-wrap gap-3 mt-4">
        {ADMIN_ACTIONS.map(action => (
          <MovieStatusButton
            key={action.status}
            className={action.className}
            text={action.label}
            newStatus={action.status}
            movie={movie}
            adminText={textContent}
            setMovie={setMovie}
          />
        ))}
      </div>
    </div>
  );
}

export default AdminMoviePanel;
