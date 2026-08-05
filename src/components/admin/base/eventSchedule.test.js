import { describe, expect, it } from 'vitest';
import {
  defaultDayIndex,
  groupByDay,
  mergeTranslations,
  scheduleStats,
  seatsTaken,
  timeRange,
} from './eventSchedule';

/** Une ligne de `GET /events`, réduite aux colonnes dont la page se sert. */
function event(overrides = {}) {
  return {
    id: 1,
    date: '2026-05-17T10:00:00',
    duration: 120,
    location: 'Auditorium MuCEM',
    title: 'Masterclass',
    description: '',
    lang: 'FR',
    is_bookable: 1,
    capacity: 20,
    remaining_seats: 8,
    ...overrides,
  };
}

describe('mergeTranslations', () => {
  it('ne garde qu’une carte par événement quand les deux langues existent', () => {
    const merged = mergeTranslations(
      [
        event({ id: 1, lang: 'FR', title: 'Atelier' }),
        event({ id: 1, lang: 'EN', title: 'Workshop' }),
      ],
      'FR'
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe('Atelier');
  });

  it('retombe sur l’autre langue quand la traduction demandée manque', () => {
    const merged = mergeTranslations(
      [event({ id: 2, lang: 'EN', title: 'Workshop' })],
      'FR'
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ title: 'Workshop', lang: 'EN' });
  });

  it('trie les événements du plus tôt au plus tard', () => {
    const merged = mergeTranslations(
      [
        event({ id: 1, date: '2026-05-18T09:00:00' }),
        event({ id: 2, date: '2026-05-17T14:00:00' }),
      ],
      'FR'
    );

    expect(merged.map(e => e.id)).toEqual([2, 1]);
  });
});

describe('groupByDay', () => {
  it('regroupe sous une seule journée les événements de la même date', () => {
    const days = groupByDay([
      event({ id: 1, date: '2026-05-17T10:00:00' }),
      event({ id: 2, date: '2026-05-17T14:00:00' }),
    ]);

    expect(days).toHaveLength(1);
    expect(days[0].events.map(e => e.id)).toEqual([1, 2]);
  });

  it('sépare les journées et les rend dans l’ordre du calendrier', () => {
    const days = groupByDay([
      event({ id: 1, date: '2026-05-18T09:00:00' }),
      event({ id: 2, date: '2026-05-17T14:00:00' }),
    ]);

    expect(days.map(day => day.key)).toEqual(['2026-05-17', '2026-05-18']);
  });

  // Une clé bâtie sur le jour du mois seul confondrait le 17 mai et le 17 juin ;
  // une clé bâtie sur `toISOString` décalerait les soirées d'un jour hors UTC.
  it('ne confond pas le même quantième de deux mois', () => {
    const days = groupByDay([
      event({ id: 1, date: '2026-06-17T22:00:00' }),
      event({ id: 2, date: '2026-05-17T22:00:00' }),
    ]);

    expect(days.map(day => day.key)).toEqual(['2026-05-17', '2026-06-17']);
  });
});

describe('seatsTaken', () => {
  it('compte les places prises comme la capacité moins les restantes', () => {
    expect(seatsTaken(event({ capacity: 20, remaining_seats: 8 }))).toBe(12);
  });

  it('rend null quand l’événement ne se réserve pas', () => {
    expect(
      seatsTaken(
        event({ is_bookable: 0, capacity: null, remaining_seats: null })
      )
    ).toBeNull();
  });
});

describe('scheduleStats', () => {
  it('additionne les réservations des seuls ateliers réservables', () => {
    const stats = scheduleStats([
      event({ id: 1, capacity: 20, remaining_seats: 8 }),
      event({ id: 2, capacity: 30, remaining_seats: 30 }),
      event({ id: 3, is_bookable: 0, capacity: null, remaining_seats: null }),
    ]);

    expect(stats.bookings).toBe(12);
    expect(stats.capacity).toBe(50);
    expect(stats.workshops).toBe(2);
  });

  it('arrondit le taux de remplissage', () => {
    const stats = scheduleStats([
      event({ id: 1, capacity: 9, remaining_seats: 2 }),
    ]);

    expect(stats.fillRate).toBe(78);
  });

  // Zéro pour cent et « aucune place à remplir » ne se ressemblent pas : un
  // festival sans atelier réservable n'a pas un remplissage nul, il n'en a pas.
  it('rend un taux nul plutôt que 0 % quand rien ne se réserve', () => {
    const stats = scheduleStats([
      event({ is_bookable: 0, capacity: null, remaining_seats: null }),
    ]);

    expect(stats.fillRate).toBeNull();
    expect(stats.bookings).toBe(0);
  });
});

describe('timeRange', () => {
  it('affiche le créneau de début à fin', () => {
    expect(
      timeRange(event({ date: '2026-05-17T10:00:00', duration: 120 }))
    ).toBe('10:00 – 12:00');
  });

  it('n’affiche que l’heure de début quand la durée manque', () => {
    expect(
      timeRange(event({ date: '2026-05-17T09:05:00', duration: null }))
    ).toBe('09:05');
  });
});

describe('defaultDayIndex', () => {
  const days = [{ key: '2026-05-17' }, { key: '2026-05-18' }];

  it('ouvre la première journée qui n’est pas passée', () => {
    expect(defaultDayIndex(days, new Date('2026-05-18T08:00:00'))).toBe(1);
  });

  // Après le festival, la première journée n'apprend plus rien : l'admin
  // consulte le dernier jour joué.
  it('ouvre la dernière journée quand le festival est passé', () => {
    expect(defaultDayIndex(days, new Date('2026-07-01T08:00:00'))).toBe(1);
  });

  it('ouvre la première journée quand le festival est à venir', () => {
    expect(defaultDayIndex(days, new Date('2026-01-01T08:00:00'))).toBe(0);
  });

  it('rend zéro sur un programme vide', () => {
    expect(defaultDayIndex([], new Date())).toBe(0);
  });
});
