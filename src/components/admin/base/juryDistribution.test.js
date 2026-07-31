import { describe, expect, it } from 'vitest';
import { EVALUATIONS_PER_MOVIE, planDistribution } from './juryDistribution';

describe('planDistribution', () => {
  it('double le nombre de films pour obtenir les évaluations à produire', () => {
    expect(planDistribution(600, 4).evaluations).toBe(
      600 * EVALUATIONS_PER_MOVIE
    );
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
  });
});
