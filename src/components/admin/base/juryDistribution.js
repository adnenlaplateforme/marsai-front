// La règle de répartition affichée sur la maquette « Distribution & jury » :
// chaque film part chez exactement deux jurés, pour garantir une double
// évaluation. Elle est isolée ici parce qu'elle est la seule partie de la
// fonctionnalité qui puisse déjà vivre côté front — l'attribution elle-même
// n'existe pas encore côté serveur (ni table, ni route).
export const EVALUATIONS_PER_MOVIE = 2;

/**
 * Le récapitulatif présenté à l'admin avant qu'il ne lance l'attribution.
 *
 * Rien n'est attribué ici : la fonction dit seulement ce que l'attribution
 * *produirait*, à partir des deux nombres qu'on sait déjà lire (les films
 * acceptés et les jurés inscrits). Quand la route existera, le back restera
 * seul juge du découpage réel — ce calcul ne sert qu'à annoncer l'ordre de
 * grandeur.
 *
 * `feasible` est faux tant qu'il y a moins de deux jurés : on ne peut pas
 * confier un film à deux membres *distincts* avec un seul juré, et un
 * découpage impossible ne doit pas s'afficher comme une simple division.
 */
export function planDistribution(movieCount, juryCount) {
  const movies = toCount(movieCount);
  const juries = toCount(juryCount);
  const evaluations = movies * EVALUATIONS_PER_MOVIE;
  const feasible = movies > 0 && juries >= EVALUATIONS_PER_MOVIE;

  if (!feasible) {
    return {
      movies,
      juries,
      evaluations,
      perJury: 0,
      extraJuries: 0,
      feasible,
    };
  }

  // Les évaluations tombent rarement rondes : `extraJuries` compte les jurés qui
  // prendront un film de plus que les autres, plutôt que d'arrondir en silence.
  return {
    movies,
    juries,
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
