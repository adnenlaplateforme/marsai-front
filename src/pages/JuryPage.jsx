import { useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';
import { FiSearch } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useApi } from '../hooks/useApi';
import JuryMovieCard from '../components/jury/JuryMovieCard';

const FILTERS = [
  { key: 'to-rate', label: 'À voir' },
  { key: 'rated', label: 'Notés' },
  { key: 'all', label: 'Tous' },
];

// « Tous » n'a pas d'endpoint à lui : c'est l'union des deux listes du jury.
// Il passait par /movies/sort, désormais réservé à l'admin — cette route sert
// la gestion des soumissions et expose tous les statuts, alors que le jury ne
// délibère que sur les films acceptés. Les deux listes sont disjointes par
// construction (« notés » = ceux où ce juré a une note, « à voir » = les
// autres) : les concaténer ne peut pas produire de doublon.
const ENDPOINTS = {
  'to-rate': ['/movies/to-rate'],
  rated: ['/movies/rated'],
  all: ['/movies/to-rate', '/movies/rated'],
};

// Endpoints may return either a plain array or a { data, total } page.
function normalizeList(json) {
  if (Array.isArray(json)) return { items: json, total: json.length };
  if (json && Array.isArray(json.data)) {
    return { items: json.data, total: json.total ?? json.data.length };
  }
  return { items: [], total: 0 };
}

function JuryPage() {
  const api = useApi();

  const [filter, setFilter] = useState('to-rate');
  const [search, setSearch] = useState('');
  const [movies, setMovies] = useState([]);
  const [toRateTotal, setToRateTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchToRateTotal = useCallback(async () => {
    const res = await api('/movies/to-rate');
    if (res && res.ok) {
      setToRateTotal(normalizeList(await res.json()).total);
    }
  }, [api]);

  // Ces deux endpoints n'acceptent aucun query param : ils renvoient toujours
  // la liste complète des films acceptés. La recherche reste donc cliente.
  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const responses = await Promise.all(
        ENDPOINTS[filter].map(url => api(url))
      );
      const lists = await Promise.all(
        responses.map(async res =>
          res && res.ok ? normalizeList(await res.json()).items : []
        )
      );
      setMovies(lists.flat());
    } catch (e) {
      console.error('jury list error:', e);
    } finally {
      setLoading(false);
    }
  }, [api, filter]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    fetchToRateTotal();
  }, [fetchToRateTotal]);

  const refreshMovies = useCallback(() => {
    loadList();
    fetchToRateTotal();
  }, [loadList, fetchToRateTotal]);

  const debouncedSearch = useDebouncedCallback(v => setSearch(v), 400);

  const term = search.trim().toLowerCase();
  const visibleMovies = term
    ? movies.filter(m =>
        `${m.english_title ?? ''} ${m.director?.firstname ?? ''} ${m.director?.lastname ?? ''}`
          .toLowerCase()
          .includes(term)
      )
    : movies;

  return (
    <div className="min-h-screen bg-primary text-white pt-20">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar — file de visionnage */}
        <aside className="w-full md:w-80 lg:w-96 max-h-[70vh] md:max-h-none md:h-[calc(100vh-5rem)] md:sticky md:top-20 flex flex-col border-b md:border-b-0 md:border-r border-white/10 bg-secondary">
          <div className="p-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider">
              File de visionnage
            </h2>
            <span className="text-xs font-bold bg-accent text-white px-2.5 py-1 rounded-full whitespace-nowrap">
              {visibleMovies.length} films
            </span>
          </div>

          <div className="px-4 pb-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Rechercher un film..."
                defaultValue={search}
                onChange={e => debouncedSearch(e.target.value)}
                className="w-full bg-primary border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="px-4 pb-3">
            <div className="flex bg-primary rounded-full p-1">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`flex-1 text-xs font-semibold uppercase py-1.5 rounded-full transition-colors ${
                    filter === f.key
                      ? 'bg-accent text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {loading ? (
              <div className="flex justify-center py-10 text-neutral-400">
                <AiOutlineLoading3Quarters className="animate-spin size-8" />
              </div>
            ) : visibleMovies.length === 0 ? (
              <p className="text-center text-neutral-500 text-sm py-10">
                Aucun film.
              </p>
            ) : (
              visibleMovies.map(m => <JuryMovieCard key={m.id} movie={m} />)
            )}
          </div>
        </aside>

        {/* Right panel */}
        <main className="flex-1 min-w-0">
          <Outlet context={{ movies: visibleMovies, filter, refreshMovies, toRateTotal }} />
        </main>
      </div>
    </div>
  );
}

export default JuryPage;
