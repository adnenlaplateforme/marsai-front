import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FaStar } from 'react-icons/fa';
import TitlePage from '../components/base/TitlePage';
import toast from 'react-hot-toast';

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1 flex-wrap">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl transition-colors"
        >
          <FaStar
            className={
              star <= (hovered || value)
                ? 'text-yellow-400'
                : 'text-neutral-600'
            }
          />
        </button>
      ))}
    </div>
  );
}

function JuryRatingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useApi();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [note, setNote] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await api(`/movies/id/${id}`);
        if (res && res.ok) {
          const data = await res.json();
          setMovie(data);
        } else {
          setError('Film introuvable.');
        }
      } catch (e) {
        setError('Erreur de connexion au serveur.');
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [id, api]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (note === 0) {
      toast.error('Veuillez attribuer une note.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await api(`/movies/${id}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, comment }),
      });
      if (res && res.ok) {
        toast.success('Vote enregistré avec succès !');
        navigate('/jury/dashboard/movies');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || 'Erreur lors de l\'envoi du vote.');
      }
    } catch (e) {
      toast.error('Erreur de connexion au serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-12 text-neutral-300">
        <p>Chargement...</p>
        <AiOutlineLoading3Quarters className="animate-spin size-24" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="pt-20 text-white text-center">
        <p className="text-red-400">{error || 'Film introuvable.'}</p>
      </div>
    );
  }

  return (
    <div className="text-white pt-20 px-4 max-w-2xl mx-auto">
      <TitlePage>Voter pour ce film</TitlePage>

      <div className="mt-8 bg-secondary rounded-2xl p-6 border border-neutral-700">
        <div className="flex gap-4 items-start mb-6">
          {movie.cover_path && (
            <img
              src={movie.cover_path}
              alt={movie.english_title}
              className="w-24 rounded-xl object-cover flex-shrink-0"
            />
          )}
          <div>
            <h2 className="text-2xl font-bold">{movie.english_title}</h2>
            {movie.original_title && (
              <p className="text-neutral-400">{movie.original_title}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-sm text-neutral-400">
              {movie.duration && <span>{movie.duration}s</span>}
              {movie.is_hybrid !== undefined && (
                <span>{movie.is_hybrid ? 'Hybrid' : '100% AI'}</span>
              )}
              {movie.language && <span>{movie.language}</span>}
            </div>
          </div>
        </div>

        {movie.english_synopsis && (
          <div className="mb-6 border-t border-neutral-700 pt-4">
            <p className="text-sm text-neutral-400 uppercase mb-1">Synopsis</p>
            <p className="text-neutral-200 text-sm leading-relaxed">
              {movie.english_synopsis}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 border-t border-neutral-700 pt-6">
          <div>
            <label className="block text-sm uppercase text-neutral-400 mb-2">
              Note (1-10)
            </label>
            <StarRating value={note} onChange={setNote} />
          </div>

          <div>
            <label
              htmlFor="comment"
              className="block text-sm uppercase text-neutral-400 mb-2"
            >
              Commentaire (optionnel)
            </label>
            <textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full bg-primary border border-neutral-600 rounded-md px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 resize-none"
              placeholder="Vos observations sur ce film..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || note === 0}
              className="flex-1 py-2.5 bg-accent text-white rounded-md font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <AiOutlineLoading3Quarters className="animate-spin" />
                  Envoi...
                </span>
              ) : (
                'Soumettre le vote'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/jury/dashboard/movies')}
              className="px-4 py-2.5 border border-neutral-600 text-neutral-300 rounded-md hover:bg-neutral-700 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JuryRatingPage;
