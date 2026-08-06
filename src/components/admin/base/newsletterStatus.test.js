import { describe, expect, it } from 'vitest';
import {
  formatDate,
  newsletterDate,
  newsletterStats,
  newsletterStatus,
  sortNewsletters,
} from './newsletterStatus';

/** Une ligne de `GET /newsletters`, avec les seules colonnes que le back sert. */
function newsletter(overrides = {}) {
  return {
    id: 1,
    object: 'Le programme 2026',
    content: 'Bonjour à tous...',
    createdAt: '2026-05-10T09:00:00.000Z',
    sendAt: null,
    sent: 0,
    ...overrides,
  };
}

const now = new Date('2026-05-10T12:00:00.000Z');

describe('newsletterStatus', () => {
  it('dit envoyée dès que le serveur a posé le drapeau', () => {
    expect(newsletterStatus(newsletter({ sent: 1 }), now)).toBe('sent');
  });

  /**
   * `sent` arrive en `0`/`1` de MySQL et non en booléen : un test sur la valeur
   * brute suffirait à passer, un `=== true` rangerait toute newsletter envoyée
   * parmi les autres.
   */
  it('traite le 1 de MySQL comme un booléen vrai', () => {
    expect(newsletterStatus(newsletter({ sent: true }), now)).toBe('sent');
    expect(newsletterStatus(newsletter({ sent: 0 }), now)).not.toBe('sent');
  });

  /**
   * Un envoi immédiat laisse `send_at` à NULL : le service poste les mails dans
   * la foulée du POST, puis `sendMail` marque `sent`. Lire cet état signifie que
   * l'envoi n'a pas encore abouti — et non qu'il a échoué, `findAllToSend`
   * reprenant justement les lignes `send_at IS NULL AND sent = 0` à la minute
   * suivante.
   */
  it('annonce un envoi en cours, pas un échec, quand aucune date n’est posée', () => {
    expect(newsletterStatus(newsletter({ sendAt: null, sent: 0 }), now)).toBe(
      'sending'
    );
  });

  it('distingue une date à venir d’une date dépassée', () => {
    const future = newsletter({ sendAt: '2026-05-10T18:00:00.000Z' });
    const past = newsletter({ sendAt: '2026-05-10T06:00:00.000Z' });

    expect(newsletterStatus(future, now)).toBe('scheduled');
    expect(newsletterStatus(past, now)).toBe('pending');
  });

  /** L'heure d'envoi tout juste atteinte : le cron n'est pas encore passé. */
  it('bascule en attente à l’instant même de l’envoi', () => {
    const due = newsletter({ sendAt: now.toISOString() });

    expect(newsletterStatus(due, now)).toBe('pending');
  });

  /**
   * Le drapeau prime sur la date : une newsletter programmée puis envoyée garde
   * une `sendAt` passée, qui la ferait passer pour en attente.
   */
  it('garde envoyée une newsletter programmée que le cron a traitée', () => {
    const done = newsletter({ sendAt: '2026-05-10T06:00:00.000Z', sent: 1 });

    expect(newsletterStatus(done, now)).toBe('sent');
  });
});

describe('newsletterDate', () => {
  it('date une newsletter programmée par son heure d’envoi', () => {
    const date = newsletterDate(
      newsletter({ sendAt: '2026-05-10T18:00:00.000Z' })
    );

    expect(date).toEqual(new Date('2026-05-10T18:00:00.000Z'));
  });

  /**
   * La table `newsletter` n'a pas de colonne `sent_at`, et un envoi immédiat
   * laisse `send_at` à NULL : sans repli sur la création, la carte d'une
   * newsletter partie — le cas le plus courant — n'afficherait aucune date.
   */
  it('se rabat sur la création quand aucune date d’envoi n’existe', () => {
    const date = newsletterDate(newsletter({ sendAt: null, sent: 1 }));

    expect(date).toEqual(new Date('2026-05-10T09:00:00.000Z'));
  });

  it('rend null plutôt qu’une date invalide quand les deux manquent', () => {
    expect(newsletterDate(newsletter({ sendAt: null, createdAt: null }))).toBe(
      null
    );
  });
});

describe('sortNewsletters', () => {
  /**
   * `newsletterModel.findAll` n'a pas d'`ORDER BY` : MySQL rend les lignes dans
   * l'ordre où il les trouve, en pratique la plus ancienne d'abord. La dernière
   * campagne écrite est celle qu'on vient consulter.
   */
  it('remonte la plus récente en tête', () => {
    const sorted = sortNewsletters([
      newsletter({ id: 1, createdAt: '2026-05-01T09:00:00.000Z' }),
      newsletter({ id: 2, createdAt: '2026-05-08T09:00:00.000Z' }),
      newsletter({ id: 3, createdAt: '2026-05-04T09:00:00.000Z' }),
    ]);

    expect(sorted.map(nl => nl.id)).toEqual([2, 3, 1]);
  });

  /** Deux campagnes de la même seconde : l'identifiant tranche. */
  it('départage deux créations simultanées par identifiant', () => {
    const sorted = sortNewsletters([
      newsletter({ id: 4, createdAt: '2026-05-01T09:00:00.000Z' }),
      newsletter({ id: 7, createdAt: '2026-05-01T09:00:00.000Z' }),
    ]);

    expect(sorted.map(nl => nl.id)).toEqual([7, 4]);
  });

  it('ne modifie pas le tableau reçu', () => {
    const list = [newsletter({ id: 1 }), newsletter({ id: 2 })];
    sortNewsletters(list);

    expect(list.map(nl => nl.id)).toEqual([1, 2]);
  });
});

describe('formatDate', () => {
  /**
   * `toLocaleString()` sans argument suit les réglages du poste : l'admin qui
   * bascule le site en anglais garderait des dates françaises au milieu d'une
   * page traduite.
   */
  it('suit la langue demandée et non celle du navigateur', () => {
    const date = new Date(2026, 4, 15, 10, 30);

    expect(formatDate(date, 'fr')).toMatch(/15 mai 2026/);
    expect(formatDate(date, 'en')).toMatch(/May 15, 2026/);
  });

  /**
   * Une date se lit en heure locale : le serveur date en UTC, et un envoi de
   * 23 h 30 à Marseille s'afficherait au lendemain si l'on formatait en UTC.
   */
  it('affiche l’heure locale', () => {
    const date = new Date(2026, 4, 15, 23, 30);

    expect(formatDate(date, 'fr')).toMatch(/15 mai 2026/);
    expect(formatDate(date, 'fr')).toMatch(/23:30/);
  });
});

describe('newsletterStats', () => {
  it('compte les envoyées et les programmées', () => {
    const stats = newsletterStats(
      [
        newsletter({ id: 1, sent: 1 }),
        newsletter({ id: 2, sent: 1 }),
        newsletter({ id: 3, sendAt: '2026-05-10T18:00:00.000Z' }),
        newsletter({ id: 4, sendAt: null, sent: 0 }),
      ],
      now
    );

    expect(stats).toEqual({ sent: 2, scheduled: 1 });
  });

  it('rend des zéros sur une liste vide plutôt que des vides', () => {
    expect(newsletterStats([], now)).toEqual({ sent: 0, scheduled: 0 });
  });
});
