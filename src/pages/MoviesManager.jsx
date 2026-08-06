import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import PaginationMenu from '../components/base/PaginationMenu';
import { useDebouncedCallback } from 'use-debounce';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FiSearch } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import MovieRow from '../components/admin/base/MovieRow';
import SortableTableHead from '../components/admin/base/SortableTableHead';
import { MOVIES_PER_PAGE as PER_PAGE } from '../config/pagination';

function MoviesManager() {
  const { t } = useTranslation();
  const target = 'admin.moviesManager.';
  const [page, setPage] = useState(1);
  const [isPageChange, setIsPageChange] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [onlyDrafts, setOnlyDrafts] = useState(false);
  const [sort, setSort] = useState('id');
  const [order, setOrder] = useState('ASC');
  const [search, setSearch] = useState('');
  const [movies, setMovies] = useState([]);
  const api = useApi();
  const debounced = useDebouncedCallback(e => {
    setSearch(e);
    setIsPageChange(false);
  }, 500);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        if (!isPageChange) {
          setPage(1);
          setIsPageChange(true);
        }
        let draft = onlyDrafts ? 'true' : 'false';
        const res = await api(
          '/movies/sort/?page=' +
            page +
            '&sort=' +
            sort +
            '&order=' +
            order +
            '&onlyDrafts=' +
            draft +
            '&search=' +
            search
        );
        if (res && res.ok) {
          const data = await res.json();
          setMovies(data.data);
          setTotal(data.total);
          setError(null);
        } else {
          setError(t(target + 'error'));
        }
      } catch (e) {
        console.error('error: ', e);
        setError(t(target + 'error'));
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [page, sort, order, onlyDrafts, search, isPageChange, api, t]);

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="p-4 md:p-6 space-y-5 text-white">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
          {t(target + 'overline')}
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold uppercase mt-2">
          {t(target + 'title')}
        </h1>
        <p className="text-neutral-400 mt-2">{t(target + 'subtitle')}</p>
      </div>

      {error && (
        <p className="text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm">
          {error}
        </p>
      )}

      <div className="bg-secondary border border-white/10 rounded-xl p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <label htmlFor="searchbar" hidden>
              {t(target + 'search')}
            </label>
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              className="w-full bg-primary border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
              id="searchbar"
              type="text"
              placeholder={t(target + 'placeholder')}
              onChange={e => {
                debounced(e.target.value);
              }}
              title="search"
              defaultValue={search}
              autoFocus
            />
          </div>
          <label
            htmlFor="only-draft"
            className="flex items-center gap-2 text-sm text-neutral-300 whitespace-nowrap cursor-pointer"
          >
            <input
              onChange={e => {
                setOnlyDrafts(e.target.checked);
                setIsPageChange(false);
              }}
              type="checkbox"
              id="only-draft"
              name="only-draft"
              checked={onlyDrafts}
              className="size-4 accent-accent cursor-pointer"
            />
            {t(target + 'draftsOnly')}
          </label>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16 text-neutral-300">
            <p className="text-sm">{t(target + 'loading')}</p>
            <AiOutlineLoading3Quarters className="animate-spin size-10" />
          </div>
        ) : movies.length === 0 ? (
          <p className="text-center text-neutral-500 text-sm py-10">
            {search || onlyDrafts
              ? t(target + 'noResults')
              : t(target + 'empty')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-neutral-400">
                  <th className="px-4 py-2 font-medium hidden sm:table-cell">
                    {t(target + 'table.cover')}
                  </th>
                  <SortableTableHead
                    value="english_title"
                    text={t(target + 'table.title')}
                    sort={sort}
                    order={order}
                    setSort={setSort}
                    setOrder={setOrder}
                    setIsPageChange={setIsPageChange}
                  />
                  <SortableTableHead
                    value="c.lastname"
                    text={t(target + 'table.director')}
                    className="hidden md:table-cell"
                    sort={sort}
                    order={order}
                    setSort={setSort}
                    setOrder={setOrder}
                    setIsPageChange={setIsPageChange}
                  />
                  <SortableTableHead
                    value="status"
                    text={t(target + 'table.status')}
                    sort={sort}
                    order={order}
                    setSort={setSort}
                    setOrder={setOrder}
                    setIsPageChange={setIsPageChange}
                  />
                  <SortableTableHead
                    value="submitted_at"
                    text={t(target + 'table.submitted')}
                    sort={sort}
                    order={order}
                    setSort={setSort}
                    setOrder={setOrder}
                    setIsPageChange={setIsPageChange}
                  />
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {movies.map(movie => (
                  <MovieRow key={movie.id} data={movie} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > 0 && (
        <div className="flex flex-col items-center gap-2">
          <PaginationMenu total={total} page={page} setPage={setPage} />
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            {t(target + 'summary', { page, pages, total })}
          </p>
        </div>
      )}
    </div>
  );
}

export default MoviesManager;
