import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useDebouncedCallback } from 'use-debounce';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import PaginationMenu from '../components/base/PaginationMenu';
import TitlePage from '../components/base/TitlePage';
import SortableTableHead from '../components/admin/base/SortableTableHead';
import JuryMovieRow from '../components/jury/JuryMovieRow';

function JuryMoviesPage() {
  const [page, setPage] = useState(1);
  const [isPageChange, setIsPageChange] = useState(true);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
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
        const res = await api(
          '/movies/sort/?page=' +
            page +
            '&sort=' +
            sort +
            '&order=' +
            order +
            '&onlyDrafts=false' +
            '&search=' +
            search
        );
        if (res && res.ok) {
          const data = await res.json();
          setMovies(data.data);
          setTotal(data.total);
        }
      } catch (e) {
        console.error('error: ', e);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [page, sort, order, search, isPageChange, api]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-12 text-neutral-300">
        <p>Chargement des films...</p>
        <AiOutlineLoading3Quarters className="animate-spin size-24" />
      </div>
    );
  }

  return (
    <div className="text-white pt-20">
      <TitlePage className="pt-5">Films en compétition</TitlePage>
      <div className="flex flex-col items-center">
        <div>
          <div className="pt-4 pb-1 flex-1 text-white">
            <label htmlFor="searchbar" hidden>
              Rechercher
            </label>
            <input
              className="w-full outline-2 outline-neutral-400 rounded-sm pl-2 py-1.5 focus:outline-neutral-100"
              id="searchbar"
              type="text"
              placeholder="Rechercher un film..."
              onChange={e => debounced(e.target.value)}
              title="search"
              defaultValue={search}
              autoFocus
            />
          </div>
        </div>
        <table className="min-w-5/6">
          <thead>
            <tr>
              <th className="lg:block"></th>
              <th className="hidden lg:block">Affiche</th>
              <SortableTableHead
                value="english_title"
                text="Titre"
                sort={sort}
                order={order}
                setSort={setSort}
                setOrder={setOrder}
                setIsPageChange={setIsPageChange}
              />
              <SortableTableHead
                value="c.lastname"
                text="Réalisateur"
                className="hidden lg:block"
                sort={sort}
                order={order}
                setSort={setSort}
                setOrder={setOrder}
                setIsPageChange={setIsPageChange}
              />
              <th>Voter</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie, index) => (
              <JuryMovieRow key={index} data={movie} />
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-center">
          <PaginationMenu
            total={total}
            page={page}
            setPage={setPage}
            setIsPageChange={setIsPageChange}
          />
        </div>
      </div>
    </div>
  );
}

export default JuryMoviesPage;
