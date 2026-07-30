import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useApi } from '../hooks/useApi';
import AdminMoviePanel from '../components/admin/AdminMoviePanel';

function Field({ label, children }) {
  if (!children) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-neutral-400">
        {label}
      </p>
      <p className="text-sm text-white break-words">{children}</p>
    </div>
  );
}

function Section({ title, children }) {
  if (!children) return null;
  return (
    <div className="bg-secondary border border-white/10 rounded-xl p-5">
      <h3 className="text-accent font-bold uppercase text-sm tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function AdminMoviePage() {
  // Même format d'URL que la page publique : `:id-:slug`, seul l'id sert à l'API.
  const { idSlug } = useParams();
  const id = idSlug?.split('-')[0];
  const api = useApi();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMovie = useCallback(async () => {
    if (!id || isNaN(Number(id))) {
      setError('Film introuvable.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api('/movies/' + id);
      if (res && res.ok) {
        setMovie(await res.json());
        setError(null);
      } else {
        setError('Erreur lors de la récupération du film.');
      }
    } catch (e) {
      console.error('admin movie error: ', e);
      setError('Impossible de se connecter au serveur.');
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    fetchMovie();
  }, [fetchMovie]);

  const backLink = (
    <Link
      to="/admin/movies"
      className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white transition-colors"
    >
      <FiArrowLeft className="size-4" />
      Retour à la liste
    </Link>
  );

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-12 text-neutral-300">
        <p>Chargement en cour...</p>
        <AiOutlineLoading3Quarters className="animate-spin size-24" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="p-6 space-y-4">
        {backLink}
        <p className="text-red-500">{error || "Film introuvable."}</p>
      </div>
    );
  }

  const director = movie.director;
  const directorName = [director?.firstname, director?.lastname]
    .filter(Boolean)
    .join(' ');
  const place = [director?.city, director?.country].filter(Boolean).join(', ');

  return (
    <div className="p-4 md:p-6 space-y-5">
      {backLink}

      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold uppercase">
          {movie.english_title}
        </h1>
        {movie.original_title && movie.original_title !== movie.english_title && (
          <p className="text-neutral-400">{movie.original_title}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-400 mt-2">
          <span className="text-white font-semibold">{movie.duration} s</span>
          <span>•</span>
          <span>{movie.is_hybrid ? 'Hybride' : '100% IA'}</span>
          <span>•</span>
          <span>{movie.language}</span>
          {movie.has_subs && (
            <>
              <span>•</span>
              <span className="text-green-400">Sous-titres</span>
            </>
          )}
          <span>•</span>
          <span>
            Soumis le{' '}
            {new Date(movie.submitted_at).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 items-start">
        {/* Colonne visionnage */}
        <div className="lg:col-span-2 space-y-5 min-w-0">
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

          {movie.stills?.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {movie.stills.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Photogramme ${i + 1}`}
                  className="w-full aspect-video object-cover rounded-lg bg-secondary"
                />
              ))}
            </div>
          )}

          <Section title="Synopsis">
            <p className="text-neutral-300 leading-relaxed text-sm">
              {movie.english_synopsis}
            </p>
            {movie.original_synopsis &&
              movie.original_synopsis !== movie.english_synopsis && (
                <p className="text-neutral-400 leading-relaxed text-sm mt-3">
                  {movie.original_synopsis}
                </p>
              )}
          </Section>

          <div className="grid md:grid-cols-2 gap-5">
            <Section title="Processus créatif">
              <p className="text-neutral-300 leading-relaxed text-sm">
                {movie.creative_process}
              </p>
            </Section>
            <Section title="Outils IA">
              <p className="text-neutral-300 leading-relaxed text-sm">
                {movie.ai_tools}
              </p>
            </Section>
          </div>

          {movie.collaborators?.length > 0 && (
            <Section title="Équipe">
              <div className="grid sm:grid-cols-2 gap-2">
                {movie.collaborators.map((c, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-white font-medium">
                      {c.firstname} {c.lastname}
                    </span>
                    {c.contribution && (
                      <span className="text-neutral-400"> — {c.contribution}</span>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Colonne décision */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <AdminMoviePanel movie={movie} setMovie={setMovie} />

          <Section title="Réalisateur">
            <div className="space-y-3">
              <Field label="Nom">
                {[director?.gender, directorName].filter(Boolean).join(' ')}
              </Field>
              <Field label="E-mail">{director?.email}</Field>
              <Field label="Métier">{director?.job}</Field>
              <Field label="Lieu">{place}</Field>
              <Field label="Téléphone">{director?.phone}</Field>
            </div>
          </Section>

          <Link
            to={`/movies/${movie.id}-${movie.slug}`}
            className="block text-center text-sm text-neutral-300 hover:text-white border border-white/10 rounded-lg py-2 transition-colors"
          >
            Voir la page publique
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminMoviePage;
