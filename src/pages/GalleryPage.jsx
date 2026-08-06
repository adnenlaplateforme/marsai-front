import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebouncedCallback } from 'use-debounce';
import { FiSearch } from 'react-icons/fi';
import { MdLocalMovies } from 'react-icons/md';
import MovieCard from '../components/base/MovieCard';
import PaginationMenu from '../components/base/PaginationMenu';
import TopPageTwo from '../components/base/TopPageTwo';
import TitlePage from '../components/base/TitlePage';

const GRID = 'grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-8';
const FIELD =
  'h-11 rounded-lg bg-primary text-sm text-white outline-1 outline-white/10 focus:outline-2 focus:outline-accent';

function GalleryPage() {
  const { t } = useTranslation();
  const target = 'gallery.page.';
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const [movieData, setMovieData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtrer repart de la première page : chercher depuis la page 3 demandait
  // une page 3 qui n'existe plus dans le résultat filtré.
  const debounced = useDebouncedCallback(value => {
    setSearch(value);
    setPage(1);
  }, 500);

  useEffect(() => {
    let ignore = false;

    async function getMovieData() {
      setLoading(true);
      try {
        const res = await fetch(
          import.meta.env.VITE_SERVER_ADDRESS +
            '/movies/?page=' +
            page +
            '&type=' +
            type +
            '&search=' +
            encodeURIComponent(search),
          { method: 'GET' }
        );
        const json = await res.json();
        if (res.ok && !ignore) {
          setMovieData(json.data);
          setTotal(json.total);
        }
      } catch (e) {
        console.error('error: ', e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    getMovieData();
    return () => {
      ignore = true;
    };
  }, [page, type, search]);

  return (
    <>
      <TopPageTwo />
      <section className="section">
        <div className="max-w-5xl mx-auto">
          <TitlePage className="text-start items-start max-w-md">
            {t(target + 'titlePart1')}{' '}
            <strong className="text-accent">{t(target + 'titlePart2')}</strong>
          </TitlePage>
          <p className="text-dark mb-10 max-w-md">{t(target + 'paragraph')}</p>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="searchbar" className="sr-only">
                {t(target + 'search')}
              </label>
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dark" />
              <input
                className={`${FIELD} w-full pl-10 pr-3 placeholder:text-dark`}
                id="searchbar"
                type="search"
                placeholder={t(target + 'searchPlaceholder')}
                onChange={e => debounced(e.target.value)}
                title={t(target + 'search')}
              />
            </div>
            <div>
              <label htmlFor="type" className="sr-only">
                {t(target + 'videoClassification')}
              </label>
              <select
                className={`${FIELD} w-full px-3 sm:w-56`}
                onChange={e => {
                  setType(e.target.value);
                  setPage(1);
                }}
                value={type}
                name="type"
                id="type"
              >
                <option value="all">{t(target + 'all')}</option>
                <option value="hybrid">{t(target + 'hybridOnly')}</option>
                <option value="fullai">{t(target + 'fullAIOnly')}</option>
              </select>
            </div>
          </div>

          <p className="mb-8 text-xs uppercase tracking-wider text-dark">
            {loading ? ' ' : t(target + 'resultCount', { count: total })}
          </p>

          {loading ? (
            <div className={GRID}>
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse overflow-hidden rounded-xl bg-primary"
                >
                  <div className="aspect-video bg-white/5" />
                  <div className="space-y-2 p-3">
                    <div className="h-4 w-3/4 rounded bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : movieData.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-primary px-4 py-20 text-center">
              <MdLocalMovies className="text-4xl text-white/20" />
              <p className="font-semibold text-white">
                {t(target + 'noResults')}
              </p>
              <p className="text-sm text-dark">{t(target + 'noResultsHint')}</p>
            </div>
          ) : (
            <div className={GRID}>
              {movieData.map(movie => (
                <MovieCard key={movie.id} data={movie} />
              ))}
            </div>
          )}

          <PaginationMenu
            total={total}
            page={page}
            setPage={setPage}
            className="mt-12"
          />
        </div>
      </section>
    </>
  );
}

export default GalleryPage;
