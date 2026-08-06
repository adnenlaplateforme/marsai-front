import { describe, expect, it } from 'vitest';
import { juryCompletion, juryReview } from './dashboardOverview';

/** Une ligne de `GET /jury-assignments`, telle que le back la sert. */
function jury(overrides = {}) {
  return { user_id: 1, assigned: 40, rated: 40, ...overrides };
}

function assignment(juries, unassigned = 0) {
  return { juries, unassigned };
}

describe('juryReview', () => {
  it('additionne les lots de tous les jurés', () => {
    const review = juryReview(
      assignment([
        jury({ user_id: 1, assigned: 40, rated: 30 }),
        jury({ user_id: 2, assigned: 40, rated: 12 }),
      ])
    );

    expect(review.done).toBe(42);
    expect(review.target).toBe(80);
  });

  /**
   * La maquette affiche « 80.3 % complété ». Arrondi à l'entier, l'avancement
   * d'un gros festival resterait affiché sur la même valeur des heures durant.
   */
  it('garde une décimale sur le pourcentage', () => {
    const review = juryReview(
      assignment([jury({ assigned: 600, rated: 482 })])
    );

    expect(review.percent).toBe(80.3);
  });

  /**
   * 0/0 n'est pas « 0 % fait », c'est « il n'y a rien à faire ». La barre de
   * progression doit pouvoir faire la différence, sinon la vue d'ensemble
   * annonce un jury en retard avant même l'attribution.
   */
  it('ne rend aucun pourcentage tant que rien n’est confié', () => {
    const review = juryReview(assignment([jury({ assigned: 0, rated: 0 })]));

    expect(review.target).toBe(0);
    expect(review.percent).toBeNull();
  });

  it('tient devant une réponse manquante', () => {
    expect(juryReview(null)).toEqual({ done: 0, target: 0, percent: null });
  });
});

describe('juryCompletion', () => {
  it('compte les jurés qui ont fini leur lot', () => {
    const completion = juryCompletion(
      assignment([
        jury({ user_id: 1, assigned: 40, rated: 40 }),
        jury({ user_id: 2, assigned: 40, rated: 39 }),
        jury({ user_id: 3, assigned: 40, rated: 40 }),
      ])
    );

    expect(completion.finalized).toBe(2);
    expect(completion.juries).toBe(3);
    expect(completion.complete).toBe(false);
  });

  /**
   * Le piège : `rated >= assigned` est vrai pour un juré sans lot (0 >= 0).
   * Avant l'attribution, la carte annonçait « 12/12 » et le tableau de bord se
   * déclarait terminé alors que rien n'avait commencé.
   */
  it('ne compte pas comme finalisé un juré sans lot', () => {
    const completion = juryCompletion(
      assignment([
        jury({ user_id: 1, assigned: 0, rated: 0 }),
        jury({ user_id: 2, assigned: 0, rated: 0 }),
      ])
    );

    expect(completion.finalized).toBe(0);
    expect(completion.complete).toBe(false);
  });

  /**
   * L'attribution donne un film de plus à quelques jurés quand le compte ne
   * tombe pas rond : c'est ce plafond que l'admin a annoncé au jury.
   */
  it('prend le plus gros lot comme quota', () => {
    const completion = juryCompletion(
      assignment([
        jury({ user_id: 1, assigned: 33, rated: 0 }),
        jury({ user_id: 2, assigned: 34, rated: 0 }),
      ])
    );

    expect(completion.quota).toBe(34);
  });

  it('annonce la délibération close quand tous les lots sont finis', () => {
    const completion = juryCompletion(
      assignment([
        jury({ user_id: 1, assigned: 40, rated: 40 }),
        jury({ user_id: 2, assigned: 40, rated: 41 }),
      ])
    );

    expect(completion.complete).toBe(true);
  });

  it('tient devant une réponse manquante', () => {
    expect(juryCompletion(null)).toEqual({
      finalized: 0,
      juries: 0,
      quota: 0,
      complete: false,
    });
  });
});
