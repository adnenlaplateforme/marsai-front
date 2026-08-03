// Le récapitulatif présenté à l'admin avant qu'il ne lance l'attribution.
//
// L'attribution réelle est faite par le serveur : ce module ne décide rien, il
// annonce. Mais il doit annoncer *juste*, sans quoi le panneau promettrait un
// découpage que `POST /jury-assignments` ne produira pas.

/** Le plancher fixé par le festival : un film est jugé sur au moins deux avis. */
export const MIN_JURIES_PER_MOVIE = 2;

/**
 * Combien de jurés reçoit chaque film.
 *
 * **Miroir de `juriesPerMovieFor`** (back : `src/helpers/assign-juries.ts`). La
 * règle vit donc à deux endroits, et c'est un coût assumé : la maquette annonce
 * le découpage *avant* le clic, ce qu'aucune route ne sait faire — le back ne
 * répond qu'une fois l'attribution écrite. Si elle change côté serveur, elle
 * doit changer ici.
 *
 * Deux est un **plancher**, pas une règle fixe. Quand les jurés dépassent le
 * double des films, la diffusion s'élargit pour qu'aucun juré ne se retrouve
 * sans rien à noter. En production (des centaines de films, une poignée de
 * jurés) la valeur retombe toujours sur deux.
 *
 * Plafonné au nombre de jurés : un film ne peut pas être confié deux fois au
 * même juré, la contrainte UNIQUE de `jury_assignment` le refuserait.
 */
function juriesPerMovieFor(movies, juries) {
  const spread = Math.ceil(juries / movies);
  return Math.min(Math.max(MIN_JURIES_PER_MOVIE, spread), juries);
}

/**
 * Ce que l'attribution *produirait*, à partir des deux nombres qu'on sait déjà
 * lire : les films acceptés et les jurés inscrits.
 *
 * `feasible` est faux tant qu'il y a moins de deux jurés : on ne peut pas
 * confier un film à deux membres *distincts* avec un seul juré, et un découpage
 * impossible ne doit pas s'afficher comme une simple division.
 */
export function planDistribution(movieCount, juryCount) {
  const movies = toCount(movieCount);
  const juries = toCount(juryCount);
  const feasible = movies > 0 && juries >= MIN_JURIES_PER_MOVIE;

  if (!feasible) {
    return {
      movies,
      juries,
      perMovie: 0,
      evaluations: 0,
      perJury: 0,
      extraJuries: 0,
      feasible,
    };
  }

  const perMovie = juriesPerMovieFor(movies, juries);
  const evaluations = movies * perMovie;

  // Les évaluations tombent rarement rondes : `extraJuries` compte les jurés qui
  // prendront un film de plus que les autres, plutôt que d'arrondir en silence.
  return {
    movies,
    juries,
    perMovie,
    evaluations,
    perJury: Math.floor(evaluations / juries),
    extraJuries: evaluations % juries,
    feasible,
  };
}

function toCount(value) {
  const count = Math.trunc(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}
