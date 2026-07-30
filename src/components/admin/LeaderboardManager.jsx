import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';
import { FiSearch, FiChevronRight } from 'react-icons/fi';
import { FaTrophy } from 'react-icons/fa6';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useApi } from '../../hooks/useApi';

/** `average` arrive en DOUBLE : 9.4 s'affiche « 9,4 », 9.25 « 9,25 ». */
function formatAverage(average) {
  if (average === null || average === undefined) return '—';
  return Number(average).toLocaleString('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

/**
 * `ai_tools` est un champ libre, pas une liste : on le découpe sur les
 * séparateurs usuels pour retrouver les puces de la maquette, et on retombe sur
 * le texte brut quand il n'y a rien à découper.
 */
function splitAiTools(aiTools) {
  if (!aiTools) return [];
  return aiTools
    .split(/[,;\n•|/]+/)
    .map(tool => tool.trim())
    .filter(Boolean);
}

/**
 * Classement de compétition : deux films à la même moyenne partagent leur rang,
 * comme sur la maquette (1, 2, 2, 2, 5…). Les films sans note gardent un rang
 * nul — l'API les renvoie volontairement pour que l'admin voie ce qui reste à
 * noter, mais les classer serait mentir.
 */
function withRanks(movies) {
  let lastAverage = null;
  let lastRank = 0;

  return movies.map((movie, index) => {
    if (movie.average === null || movie.average === undefined) {
      return { ...movie, rank: null };
    }
    if (movie.average !== lastAverage) {
      lastAverage = movie.average;
      lastRank = index + 1;
    }
    return { ...movie, rank: lastRank };
  });
}

function directorName(movie) {
  return [movie.director?.firstname, movie.director?.lastname]
    .filter(Boolean)
    .join(' ');
}

function BestScoreCard({ movie }) {
  return (
    <div className="bg-secondary border border-white/10 rounded-xl p-5 flex items-center gap-5">
      <div className="size-20 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center flex-shrink-0">
        <FaTrophy className="size-9 text-accent" />
      </div>
      <div className="min-w-0">
        <p className="text-4xl font-extrabold leading-none">
          {formatAverage(movie.average)}
          <span className="text-lg font-semibold text-neutral-400">/10</span>
        </p>
        <p className="text-xs uppercase tracking-wider text-neutral-400 mt-1">
          Meilleure note
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-xs font-bold uppercase text-accent bg-accent/10 px-2 py-1 rounded truncate max-w-[16rem]">
            {movie.english_title}
          </span>
          <span className="text-sm text-neutral-300 truncate">
            Par {directorName(movie) || 'réalisateur inconnu'}
          </span>
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({ movie }) {
  const tools = splitAiTools(movie.ai_tools);

  return (
    <tr className="border-t border-white/5 hover:bg-white/5 transition-colors">
      <td className="px-4 py-3 text-sm font-bold text-neutral-400 tabular-nums">
        {movie.rank ?? '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={movie.cover_path}
            alt=""
            className="size-14 rounded-lg object-cover flex-shrink-0 bg-primary"
          />
          <div className="min-w-0">
            <p className="font-bold uppercase text-sm truncate">
              {movie.english_title}
            </p>
            <p className="text-xs text-neutral-400 truncate">
              {directorName(movie)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-lg font-bold tabular-nums">
          {formatAverage(movie.average)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-neutral-400 whitespace-nowrap tabular-nums">
        {movie.votes} {Number(movie.votes) === 1 ? 'vote' : 'votes'}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="flex flex-wrap gap-1.5 max-w-xs">
          {tools.slice(0, 3).map((tool, i) => (
            <span
              key={i}
              className="text-[10px] font-semibold uppercase bg-primary border border-white/10 text-neutral-300 px-2 py-1 rounded truncate max-w-[10rem]"
            >
              {tool}
            </span>
          ))}
          {tools.length > 3 && (
            <span className="text-[10px] font-semibold text-neutral-500 px-1 py-1">
              +{tools.length - 3}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          to={`/admin/movies/${movie.id}-${movie.slug}`}
          aria-label={`Ouvrir la fiche de ${movie.english_title}`}
          className="inline-flex items-center justify-center size-9 rounded-lg border border-white/10 text-neutral-300 hover:text-white hover:border-accent transition-colors"
        >
          <FiChevronRight className="size-5" />
        </Link>
      </td>
    </tr>
  );
}

function LeaderboardManager() {
  const api = useApi();

  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRanking = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api('/movies/ratings/average');
      if (res && res.ok) {
        const data = await res.json();
        setMovies(Array.isArray(data) ? data : []);
        setError(null);
      } else {
        setError('Erreur lors de la récupération du classement.');
      }
    } catch (e) {
      console.error('leaderboard error: ', e);
      setError('Impossible de se connecter au serveur.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  const debouncedSearch = useDebouncedCallback(v => setSearch(v), 300);

  // L'endpoint renvoie tout le classement d'un coup et n'accepte aucun
  // paramètre : le rang est calculé ici, et la recherche filtre côté client.
  const ranked = useMemo(() => withRanks(movies), [movies]);

  const visibleMovies = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ranked;
    return ranked.filter(movie =>
      `${movie.english_title ?? ''} ${movie.original_title ?? ''} ${directorName(movie)}`
        .toLowerCase()
        .includes(term)
    );
  }, [ranked, search]);

  // Le premier film noté : l'API trie déjà par moyenne décroissante, NULL après.
  const bestMovie = ranked.find(
    movie => movie.average !== null && movie.average !== undefined
  );

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-12 text-neutral-300">
        <p>Chargement en cour...</p>
        <AiOutlineLoading3Quarters className="animate-spin size-24" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 text-white">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
          Admin management
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold uppercase mt-2">
          Leaderboard officiel
        </h1>
        <p className="text-neutral-400 mt-2">
          Classement des votes du jury pour la finale de Marseille.
        </p>
      </div>

      {error && (
        <p className="text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm">
          {error}
        </p>
      )}

      {bestMovie && <BestScoreCard movie={bestMovie} />}

      <div className="bg-secondary border border-white/10 rounded-xl p-4 md:p-5">
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Rechercher un film ou un réalisateur"
            defaultValue={search}
            onChange={e => debouncedSearch(e.target.value)}
            className="w-full bg-primary border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
          />
        </div>

        {visibleMovies.length === 0 ? (
          <p className="text-center text-neutral-500 text-sm py-10">
            {movies.length === 0
              ? 'Aucun film au classement.'
              : 'Aucun film ne correspond à cette recherche.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-neutral-400">
                  <th className="px-4 py-2 font-medium">Rang</th>
                  <th className="px-4 py-2 font-medium">Film &amp; auteur</th>
                  <th className="px-4 py-2 font-medium">Moyenne</th>
                  <th className="px-4 py-2 font-medium">Votes</th>
                  <th className="px-4 py-2 font-medium hidden lg:table-cell">
                    Outils IA
                  </th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {visibleMovies.map(movie => (
                  <LeaderboardRow key={movie.id} movie={movie} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeaderboardManager;
