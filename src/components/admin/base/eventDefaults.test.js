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
 * 23 h 30 le 31 décembre : `toISOString()` aurait rendu le 1er janvier suivant
 * pour tout fuseau à l'est de Greenwich. C'est le cas qui condamne l'UTC.
 */
it('reste sur le jour local en fin de soirée', () => {
  expect(defaultPublishedAt(new Date(2026, 11, 31, 23, 30))).toBe(
    '2026-12-31T09:00'
  );
});
