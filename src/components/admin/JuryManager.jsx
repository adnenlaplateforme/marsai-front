import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiPlus } from 'react-icons/bi';
import { useApi } from '../../hooks/useApi';
import JuryForm from './JuryForm';
import JuryDistributionPanel from './JuryDistributionPanel';
import JuryCard from './base/JuryCard';
import { JURY_RATABLE_STATUS } from './base/movieStatus';

function JuryManager() {
  const { t } = useTranslation();
  const target = 'admin.juryManager.';
  const api = useApi();

  const [juries, setJuries] = useState([]);
  // `null` tant que le compte n'est pas connu : zéro film accepté et un appel
  // en échec ne se ressemblent pas, et le panneau de distribution ne doit pas
  // annoncer « aucun film à répartir » sur une erreur réseau.
  const [movieCount, setMovieCount] = useState(null);
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function togglePopover() {
    setIsPopoverVisible(value => !value);
  }

  const fetchJuries = useCallback(async () => {
    const res = await api('/juries');
    if (!res || !res.ok) throw new Error('juries');
    setJuries(await res.json());
  }, [api]);

  // Le nombre de films à répartir ne se lit nulle part directement : `/movies/sort`
  // pagine et compte tous les statuts confondus. `/movies/ratings/average`
  // renvoie le catalogue complet avec son statut, d'où le comptage ici — seuls
  // les films `accepted` sont notables par le jury.
  const fetchMovieCount = useCallback(async () => {
    const res = await api('/movies/ratings/average');
    if (!res || !res.ok) throw new Error('movies');
    const movies = await res.json();
    setMovieCount(
      (Array.isArray(movies) ? movies : []).filter(
        movie => movie.status === JURY_RATABLE_STATUS
      ).length
    );
  }, [api]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([fetchJuries(), fetchMovieCount()]);
      setError(null);
    } catch (e) {
      console.error('jury manager error: ', e);
      setError(t(target + 'error'));
    } finally {
      setLoading(false);
    }
  }, [fetchJuries, fetchMovieCount, t]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-4 md:p-6 space-y-5 text-white">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            {t(target + 'overline')}
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase mt-2">
            {t(target + 'title')}
          </h1>
          <p className="text-neutral-400 mt-2">{t(target + 'subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={togglePopover}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-accent/90 hover:bg-accent text-sm font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors"
        >
          {t(target + 'addJury')}
          <BiPlus className="size-5" />
        </button>
      </div>

      {isPopoverVisible && (
        <JuryForm onSuccess={load} toggleVisible={togglePopover} />
      )}

      {error && (
        <p className="text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-16 text-neutral-300">
          <p className="text-sm">{t(target + 'loading')}</p>
          <AiOutlineLoading3Quarters className="animate-spin size-10" />
        </div>
      ) : (
        <>
          {juries.length === 0 ? (
            <p className="bg-secondary border border-white/10 rounded-xl text-center text-neutral-500 text-sm py-10">
              {t(target + 'empty')}
            </p>
          ) : (
            <div className="space-y-3">
              {juries.map(jury => (
                <JuryCard key={jury.id} jury={jury} />
              ))}
            </div>
          )}

          {movieCount !== null && (
            <JuryDistributionPanel
              movieCount={movieCount}
              juryCount={juries.length}
            />
          )}
        </>
      )}
    </div>
  );
}

export default JuryManager;
