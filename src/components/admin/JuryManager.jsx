import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiPlus } from 'react-icons/bi';
import { useApi } from '../../hooks/useApi';
import JuryForm from './JuryForm';
import JuryDistributionPanel from './JuryDistributionPanel';
import JuryCard from './base/JuryCard';
import { JURY_RATABLE_STATUS } from './base/movieStatus';

/**
 * L'avancement d'un juré, ou `null` s'il n'est pas encore connu.
 *
 * `GET /jury-assignments` désigne les jurés par `user_id` — la même personne que
 * le `id` de `GET /juries`, deux vues d'une seule table `user`. Un juré absent
 * de la réponse rend `null` plutôt que des zéros : la carte affiche alors « lot
 * non attribué » au lieu d'une barre à 0 %, qui laisserait croire à un lot vide
 * plutôt qu'à une absence de lot.
 */
function progressFor(assignment, juryId) {
  return assignment?.juries?.find(jury => jury.user_id === juryId) ?? null;
}

function JuryManager() {
  const { t } = useTranslation();
  const target = 'admin.juryManager.';
  const api = useApi();

  const [juries, setJuries] = useState([]);
  // `null` tant que le compte n'est pas connu : zéro film accepté et un appel
  // en échec ne se ressemblent pas, et le panneau de distribution ne doit pas
  // annoncer « aucun film à répartir » sur une erreur réseau.
  const [movieCount, setMovieCount] = useState(null);
  // L'état de l'attribution, `null` tant qu'il n'est pas lu — même raison que
  // `movieCount` : « rien d'attribué » et « appel en échec » ne se ressemblent
  // pas, et le panneau ne doit pas proposer de lancer une attribution qui a
  // peut-être déjà eu lieu.
  const [assignment, setAssignment] = useState(null);
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

  // L'avancement de chaque juré, plus le nombre de films acceptés qu'aucun lot
  // ne couvre. Les deux viennent de la même route : `assigned` et `rated` par
  // juré alimentent les cartes, `unassigned` alerte l'admin sur un film accepté
  // après l'attribution.
  const fetchAssignment = useCallback(async () => {
    const res = await api('/jury-assignments');
    if (!res || !res.ok) throw new Error('assignment');
    setAssignment(await res.json());
  }, [api]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([fetchJuries(), fetchMovieCount(), fetchAssignment()]);
      setError(null);
    } catch (e) {
      console.error('jury manager error: ', e);
      setError(t(target + 'error'));
    } finally {
      setLoading(false);
    }
  }, [fetchJuries, fetchMovieCount, fetchAssignment, t]);

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
                <JuryCard
                  key={jury.id}
                  jury={jury}
                  progress={progressFor(assignment, jury.id)}
                  // `load` et non un simple retrait de la liste : supprimer un
                  // juré change aussi l'attribution et le nombre de films
                  // couverts. Relire les trois routes garde le panneau de
                  // distribution d'accord avec les cartes.
                  onDeleted={load}
                />
              ))}
            </div>
          )}

          {movieCount !== null && assignment !== null && (
            <JuryDistributionPanel
              movieCount={movieCount}
              juryCount={juries.length}
              assignment={assignment}
              onChange={load}
            />
          )}
        </>
      )}
    </div>
  );
}

export default JuryManager;
