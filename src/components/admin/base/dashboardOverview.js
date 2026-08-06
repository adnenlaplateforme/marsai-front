// Les indicateurs de la vue d'ensemble, dérivés de ce que les routes servent
// déjà.
//
// `GET /jury-assignments` répond l'avancement juré par juré ; la vue d'ensemble
// en tire deux lectures différentes — le travail déposé et les lots achevés —
// et c'est ici qu'elles se calculent, sans réseau, pour rester testables.

/**
 * Le travail du jury : ce qui est noté sur ce qui a été confié.
 *
 * Ce sont des **évaluations**, pas des films : un film confié à deux jurés pèse
 * deux lignes dans `jury_assignment`. Aucune route ne sait aujourd'hui compter
 * les films distincts déjà notés, et présenter ce total comme un nombre de
 * films gonflerait l'avancement d'autant de fois qu'un film a de jurés.
 *
 * `percent` est nul tant que rien n'est confié : 0/0 n'est pas « 0 % fait »,
 * c'est « il n'y a rien à faire », et la barre de progression doit pouvoir
 * faire la différence.
 */
export function juryReview(assignment) {
  const juries = assignment?.juries ?? [];

  const done = sum(juries, jury => jury.rated);
  const target = sum(juries, jury => jury.assigned);

  return {
    done,
    target,
    // Une décimale : la maquette affiche « 80.3 % complété », et l'entier
    // ferait stagner l'affichage plusieurs heures sur un gros festival.
    percent: target > 0 ? Math.round((done / target) * 1000) / 10 : null,
  };
}

/**
 * Les lots achevés : combien de jurés ont fini, sur combien d'inscrits.
 *
 * Un juré sans lot n'est **pas** un juré qui a fini. `rated >= assigned` est
 * vrai pour lui (0 >= 0) et le comptait comme finalisé : avant l'attribution,
 * la carte annonçait donc « 12/12 » et le tableau de bord se déclarait terminé
 * alors que rien n'avait commencé.
 *
 * `quota` est le plus gros lot distribué, et non une moyenne : l'attribution
 * donne un film de plus à quelques jurés quand le compte ne tombe pas rond, et
 * c'est ce plafond que l'admin a annoncé au jury.
 */
export function juryCompletion(assignment) {
  const juries = assignment?.juries ?? [];

  const finalized = juries.filter(
    jury => jury.assigned > 0 && jury.rated >= jury.assigned
  ).length;
  const quota = juries.reduce((max, jury) => Math.max(max, jury.assigned), 0);

  return {
    finalized,
    juries: juries.length,
    quota,
    // Un jury vide, ou sans lot, n'a rien terminé : sans le garde-fou,
    // `finalized === juries.length` serait vrai dès le départ.
    complete: quota > 0 && juries.length > 0 && finalized === juries.length,
  };
}

function sum(rows, read) {
  return rows.reduce((total, row) => {
    const value = Number(read(row));
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
}
