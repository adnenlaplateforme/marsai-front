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

function endpointFor(filter, page, search) {
  const s = encodeURIComponent(search);
  if (filter === 'rated') return `/movies/rated?page=${page}&search=${s}`;
  if (filter === 'to-rate') return `/movies/to-rate?page=${page}&search=${s}`;
  return `/movies/sort/?page=${page}&sort=id&order=ASC&onlyDrafts=false&search=${s}`;
}

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
  const [page, setPage] = useState(1);
  const [movies, setMovies] = useState([]);
  const [total, setTotal] = useState(0);
  const [toRateTotal, setToRateTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchToRateTotal = useCallback(async () => {
    const res = await api('/movies/to-rate?page=1&search=');
    if (res && res.ok) {
      setToRateTotal(normalizeList(await res.json()).total);
    }
  }, [api]);

  const loadPage = useCallback(
    async (nextPage, append) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);
        const res = await api(endpointFor(filter, nextPage, search));
        if (res && res.ok) {
          const { items, total: t } = normalizeList(await res.json());
          setTotal(t);
          setMovies(prev => (append ? [...prev, ...items] : items));
          setPage(nextPage);
        }
      } catch (e) {
        console.error('jury list error:', e);
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [api, filter, search]
  );

  useEffect(() => {
    loadPage(1, false);
  }, [loadPage]);

  useEffect(() => {
    fetchToRateTotal();
  }, [fetchToRateTotal]);

  const refreshMovies = useCallback(() => {
    loadPage(1, false);
    fetchToRateTotal();
  }, [loadPage, fetchToRateTotal]);

  const debouncedSearch = useDebouncedCallback(v => setSearch(v), 400);

  // Client-side safety net in case an endpoint doesn't filter server-side.
  const term = search.trim().toLowerCase();
  const visibleMovies = term
    ? movies.filter(m =>
        `${m.english_title ?? ''} ${m.director?.firstname ?? ''} ${m.director?.lastname ?? ''}`
          .toLowerCase()
          .includes(term)
      )
    : movies;

  const canLoadMore = !term && movies.length < total;

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
              {total} films
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
              <>
                {visibleMovies.map(m => (
                  <JuryMovieCard key={m.id} movie={m} />
                ))}
                {canLoadMore && (
                  <button
                    type="button"
                    onClick={() => loadPage(page + 1, true)}
                    disabled={loadingMore}
                    className="w-full py-2 text-sm text-neutral-300 hover:text-white border border-white/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? 'Chargement...' : 'Charger plus'}
                  </button>
                )}
              </>
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
