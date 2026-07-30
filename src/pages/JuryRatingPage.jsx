import { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FiGlobe } from 'react-icons/fi';
import toast from 'react-hot-toast';

function JuryRatingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const { movies, refreshMovies } = useOutletContext();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [note, setNote] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setNote(0);
      setComment('');
      try {
        const res = await api(`/movies/${id}`);
        if (!alive) return;
        if (res && res.ok) {
          const data = await res.json();
          // GET /movies/:id est public et sert tous les statuts. Le jury ne
          // délibère que sur les films acceptés : l'API refuse la note (403),
          // autant le dire ici plutôt que de laisser ouvrir le formulaire.
          if (data.status !== 'accepted') {
            setError("Ce film n'est pas ouvert à la notation.");
            setLoading(false);
            return;
          }
          setMovie(data);
        } else {
          setError('Film introuvable.');
          setLoading(false);
          return;
        }
        // Pre-fill with the jury's existing rating for this movie, if any.
        const mine = await api(`/movies/${id}/ratings/me`);
        if (!alive) return;
        if (mine && mine.ok) {
          const data = await mine.json().catch(() => null);
          if (data && typeof data.note === 'number') {
            setNote(data.note);
            setComment(data.comment ?? '');
          }
        }
      } catch {
        if (alive) setError('Erreur de connexion au serveur.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [id, api]);

  const goNext = () => {
    if (!movies || movies.length === 0) {
      navigate('/jury/dashboard/movies');
      return;
    }
    const idx = movies.findIndex(m => String(m.id) === String(id));
    const next = movies[idx + 1];
    if (next) {
      navigate(`/jury/dashboard/movies/${next.id}/ratings`);
    } else {
      toast('Dernier film de la liste.');
      navigate('/jury/dashboard/movies');
    }
  };

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
        refreshMovies?.();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || "Erreur lors de l'envoi du vote.");
      }
    } catch {
      toast.error('Erreur de connexion au serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] gap-8 text-neutral-300">
        <p>Chargement...</p>
        <AiOutlineLoading3Quarters className="animate-spin size-20" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-400">{error || 'Film introuvable.'}</p>
      </div>
    );
  }

  const director = movie.director;
  const subtitle = [
    [director?.firstname, director?.lastname].filter(Boolean).join(' '),
    director?.country,
  ]
    .filter(Boolean)
    .join(' – ');

  return (
    <div className="px-6 py-10 max-w-3xl mx-auto space-y-6">
      {/* Video */}
      <div className="rounded-xl overflow-hidden bg-black aspect-video">
        <video
          src={movie.video_path}
          controls
          poster={movie.cover_path}
          className="w-full h-full object-contain"
        >
          Votre navigateur ne supporte pas la balise vidéo.
        </video>
      </div>

      {/* Rating card */}
      <form
        onSubmit={handleSubmit}
        className="bg-secondary rounded-2xl p-6 md:p-8 space-y-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold uppercase">
            {movie.english_title}
          </h1>
          {subtitle && (
            <p className="flex items-center gap-2 text-accent mt-1 text-sm uppercase">
              <FiGlobe className="size-4" />
              {subtitle}
            </p>
          )}
        </div>

        <div className="border-t border-white/10 pt-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-neutral-400">
                Votre évaluation
              </p>
              <p className="text-neutral-300 mt-1">Qualité globale</p>
            </div>
            <p className="text-5xl font-extrabold leading-none">
              {note}
              <span className="text-2xl text-neutral-500">/10</span>
            </p>
          </div>

          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={note}
            onChange={e => setNote(Number(e.target.value))}
            className="w-full mt-4 accent-accent cursor-pointer"
          />
          <div className="flex justify-between text-xs text-neutral-500 mt-1 px-0.5">
            {Array.from({ length: 11 }, (_, i) => (
              <span key={i}>{i}</span>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="comment"
            className="block text-xs uppercase tracking-wider text-neutral-400 mb-2"
          >
            Commentaire (optionnel)
          </label>
          <textarea
            id="comment"
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full bg-primary border border-white/10 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-accent resize-none"
            placeholder="Vos observations sur ce film..."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-accent text-white rounded-lg font-bold uppercase text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" />
                Envoi...
              </span>
            ) : (
              'Valider ma note'
            )}
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex-1 py-3 bg-neutral-900 text-white rounded-lg font-bold uppercase text-sm hover:bg-black transition-colors"
          >
            Visionner le suivant
          </button>
        </div>
      </form>
    </div>
  );
}

export default JuryRatingPage;
