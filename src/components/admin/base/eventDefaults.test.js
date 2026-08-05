import { expect, it } from 'vitest';
import { defaultPublishedAt } from './eventDefaults';

/**
 * La date d'entrée est construite en heure locale et la sortie est attendue en
 * heure locale : le test dit donc la même chose dans tous les fuseaux. Écrite
 * en UTC, l'attente aurait été fausse partout ailleurs que sur ma machine.
 */
it('publie à neuf heures le jour même', () => {
  expect(defaultPublishedAt(new Date(2026, 6, 1, 15, 42))).toBe(
    '2026-07-01T09:00'
  );
});

/**
 * `datetime-local` refuse « 2026-1-5T09:00 » : les deux chiffres ne sont pas
 * cosmétiques, un champ mal complété s'affiche vide.
 */
it('complète les mois et les jours à deux chiffres', () => {
  expect(defaultPublishedAt(new Date(2026, 0, 5, 8, 3))).toBe('2026-01-05T09:00');
});

/**
 * 00 h 30 le 1er janvier : à l'est de Greenwich, `toISOString()` rend la veille,
 * et l'admin se verrait proposer une publication déjà passée.
 */
it('reste sur le jour local au petit matin', () => {
  expect(defaultPublishedAt(new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01T09:00');
});

/**
 * 23 h 30 le 31 décembre : le symétrique, pour un fuseau négatif, où
 * `toISOString()` rend le lendemain.
 *
 * Les deux cas sont nécessaires : chacun pris seul reste vert dans la moitié
 * des fuseaux. C'est ce qui était arrivé ici — vérifié par mutation, le test du
 * soir seul passait en CEST alors que le helper repassait en UTC.
 */
it('reste sur le jour local en fin de soirée', () => {
  expect(defaultPublishedAt(new Date(2026, 11, 31, 23, 30))).toBe(
    '2026-12-31T09:00'
  );
});
