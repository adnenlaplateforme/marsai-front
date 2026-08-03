import { describe, expect, it } from 'vitest';
import { MIN_JURIES_PER_MOVIE, planDistribution } from './juryDistribution';

describe('planDistribution', () => {
  it('confie chaque film à deux jurés dès qu’il y a plus de films que de jurés', () => {
    const plan = planDistribution(600, 4);

    expect(plan.perMovie).toBe(MIN_JURIES_PER_MOVIE);
    expect(plan.evaluations).toBe(1200);
  });

  it('répartit les évaluations à parts égales quand la division tombe juste', () => {
    const plan = planDistribution(600, 4);

    expect(plan.perJury).toBe(300);
    expect(plan.extraJuries).toBe(0);
  });

  it('compte les jurés qui prennent un film de plus plutôt que d’arrondir', () => {
    const plan = planDistribution(5, 3);

    expect(plan.perJury).toBe(3);
    expect(plan.extraJuries).toBe(1);
  });

  /**
   * Le cas qui distingue cette formule d'un simple « ×2 ». Deux est un plancher,
   * pas une règle fixe : quand les jurés dépassent le double des films, le back
   * élargit la diffusion pour qu'aucun juré ne se retrouve les mains vides.
   * Annoncer 2 ici promettrait un découpage que l'attribution ne produit pas.
   */
  it('élargit la diffusion quand les jurés sont plus nombreux que les places', () => {
    const plan = planDistribution(1, 4);

    expect(plan.perMovie).toBe(4);
    expect(plan.evaluations).toBe(4);
    expect(plan.perJury).toBe(1);
  });

  it('élargit aussi la diffusion sans aller jusqu’à un film par juré', () => {
    const plan = planDistribution(2, 5);

    // ceil(5 / 2) = 3 jurés par film, soit 6 évaluations pour 5 jurés.
    expect(plan.perMovie).toBe(3);
    expect(plan.evaluations).toBe(6);
    expect(plan.perJury).toBe(1);
    expect(plan.extraJuries).toBe(1);
  });

  /**
   * Un film ne peut pas être confié deux fois au même juré : la contrainte
   * UNIQUE de `jury_assignment` le refuserait. Le plafond n'est donc pas
   * cosmétique, il reproduit une limite réelle de la base.
   */
  it('ne confie jamais un film à plus de jurés qu’il n’en existe', () => {
    const plan = planDistribution(1, 3);

    expect(plan.perMovie).toBe(3);
    expect(plan.evaluations).toBe(3);
  });

  it('refuse la répartition en dessous de deux jurés, une double évaluation étant impossible', () => {
    expect(planDistribution(600, 1).feasible).toBe(false);
    expect(planDistribution(600, 2).feasible).toBe(true);
  });

  it('refuse la répartition sans film à répartir', () => {
    expect(planDistribution(0, 4).feasible).toBe(false);
  });

  it('ramène à zéro les compteurs absents plutôt que de propager NaN', () => {
    const plan = planDistribution(undefined, null);

    expect(plan.movies).toBe(0);
    expect(plan.juries).toBe(0);
    expect(plan.evaluations).toBe(0);
    expect(plan.perMovie).toBe(0);
  });
});
