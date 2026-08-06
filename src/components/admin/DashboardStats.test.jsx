import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import '../../config/i18n';
import DashboardStats from './DashboardStats';

const api = vi.fn();
vi.mock('../../hooks/useApi', () => ({ useApi: () => api }));

function jury(overrides = {}) {
  return { user_id: 1, assigned: 40, rated: 40, ...overrides };
}

function event(overrides = {}) {
  return {
    id: 1,
    date: '2099-05-15T10:00:00',
    duration: 120,
    location: 'Auditorium MuCEM',
    title: 'Masterclass',
    lang: 'FR',
    is_bookable: 1,
    capacity: 20,
    remaining_seats: 8,
    ...overrides,
  };
}

/**
 * `GET /jury-assignments` d'un côté, les deux langues de `GET /events` de
 * l'autre. Passer `null` à l'une des deux fait échouer cette lecture seule,
 * l'autre continuant de répondre — c'est ce qui distingue les tuiles.
 */
function serve({ assignment = { juries: [], unassigned: 0 }, events = [] }) {
  api.mockImplementation(path => {
    if (path.startsWith('/jury-assignments')) {
      return assignment
        ? { ok: true, json: async () => assignment }
        : { ok: false, status: 500, json: async () => ({}) };
    }
    if (path.startsWith('/events')) {
      return events
        ? { ok: true, json: async () => (path.includes('EN') ? [] : events) }
        : { ok: false, status: 500, json: async () => ({}) };
    }
    throw new Error(`route inattendue : ${path}`);
  });
}

function show() {
  render(
    <MemoryRouter>
      <DashboardStats />
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.mockReset();
});

it('additionne l’avancement du jury sur l’ensemble des lots', async () => {
  serve({
    assignment: {
      juries: [
        jury({ user_id: 1, assigned: 300, rated: 300 }),
        jury({ user_id: 2, assigned: 300, rated: 182 }),
      ],
      unassigned: 0,
    },
  });
  show();

  expect(await screen.findByText('482')).toBeInTheDocument();
  expect(screen.getByText('Objectif : 600')).toBeInTheDocument();
  expect(screen.getByText('80.3 % complété')).toBeInTheDocument();
});

/**
 * Le compteur est cadré sur la largeur du total, comme la maquette : un
 * « 8/12 » sauterait d'un caractère au passage à deux chiffres.
 */
it('cadre les lots finalisés sur la largeur du total', async () => {
  serve({
    assignment: {
      juries: [
        ...Array.from({ length: 8 }, (_, i) =>
          jury({ user_id: i + 1, assigned: 40, rated: 40 })
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          jury({ user_id: i + 9, assigned: 40, rated: 12 })
        ),
      ],
      unassigned: 0,
    },
  });
  show();

  expect(await screen.findByText('08/12')).toBeInTheDocument();
  expect(screen.getByText('Quota : 40/juré')).toBeInTheDocument();
  expect(screen.getByText('En cours de délibération')).toBeInTheDocument();
});

/**
 * `rated >= assigned` est vrai pour un juré sans lot (0 >= 0). Avant
 * l'attribution, le tableau de bord annonçait « 2/2 » et se déclarait terminé
 * alors que rien n'avait commencé.
 */
it('n’annonce aucun lot fini tant que l’attribution n’a pas eu lieu', async () => {
  serve({
    assignment: {
      juries: [
        jury({ user_id: 1, assigned: 0, rated: 0 }),
        jury({ user_id: 2, assigned: 0, rated: 0 }),
      ],
      unassigned: 12,
    },
  });
  show();

  expect(await screen.findByText('0/2')).toBeInTheDocument();
  expect(screen.getByText('Attribution des lots à lancer')).toBeInTheDocument();
  expect(screen.queryByText('Délibération terminée')).not.toBeInTheDocument();
});

it('annonce la délibération close quand tous les lots sont finis', async () => {
  serve({
    assignment: {
      juries: [jury({ user_id: 1 }), jury({ user_id: 2 })],
      unassigned: 0,
    },
  });
  show();

  expect(await screen.findByText('Délibération terminée')).toBeInTheDocument();
});

it('calcule le taux d’occupation sur toutes les places des ateliers', async () => {
  serve({
    events: [
      event({ id: 1, capacity: 20, remaining_seats: 5 }),
      event({ id: 2, capacity: 30, remaining_seats: 9 }),
    ],
  });
  show();

  // 15 + 21 places prises sur 50.
  expect(await screen.findByText('72%')).toBeInTheDocument();
  expect(screen.getByText('36 places prises sur 50')).toBeInTheDocument();
});

/**
 * `GET /events?lang=` répond une ligne par traduction : le même atelier revient
 * en FR et en EN. Sans fusion, sa capacité serait comptée deux fois et le taux
 * d'occupation tomberait de moitié.
 */
it('ne compte qu’une fois un atelier traduit dans les deux langues', async () => {
  api.mockImplementation(path => {
    if (path.startsWith('/jury-assignments')) {
      return { ok: true, json: async () => ({ juries: [], unassigned: 0 }) };
    }
    return {
      ok: true,
      json: async () => [
        event({ id: 1, lang: path.includes('EN') ? 'EN' : 'FR' }),
      ],
    };
  });
  show();

  expect(await screen.findByText('60%')).toBeInTheDocument();
  expect(screen.getByText('12 places prises sur 20')).toBeInTheDocument();
});

it('ne rend aucun taux sans atelier réservable au programme', async () => {
  serve({ events: [event({ is_bookable: 0, capacity: null })] });
  show();

  expect(
    await screen.findByText('Aucun atelier réservable au programme')
  ).toBeInTheDocument();
});

/**
 * Les deux lectures sont indépendantes : une route en échec ne doit vider que
 * ses propres tuiles. Le planning tombe, l'avancement du jury reste affiché.
 */
it('garde les tuiles du jury quand le planning est en échec', async () => {
  serve({
    assignment: {
      juries: [jury({ user_id: 1, assigned: 40, rated: 10 })],
      unassigned: 0,
    },
    events: null,
  });
  show();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    /Erreur lors de la récupération des indicateurs/
  );
  expect(screen.getByText('10')).toBeInTheDocument();
  expect(screen.getByText('Objectif : 40')).toBeInTheDocument();
});

/**
 * `useApi` rend `null` quand la session est morte : il a déjà déconnecté, une
 * erreur de plus ne dirait rien à personne.
 */
it('reste muet quand la session a expiré', async () => {
  api.mockResolvedValue(null);
  show();

  expect(await screen.findByText("Vue d'ensemble")).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

/**
 * Deux tuiles de la maquette ont été écartées faute de données à leur donner :
 * un réalisateur est un `collaborator` rattaché à un film et non un compte, et
 * les pays vivent dans un champ de texte libre dont aucun continent ne se
 * déduit. Le test les nomme pour qu'elles ne reviennent pas par la maquette au
 * prochain passage.
 */
it('ne montre que les trois indicateurs retenus', async () => {
  serve({});
  show();

  expect(
    await screen.findByText('Évaluations déposées par le jury')
  ).toBeInTheDocument();
  expect(screen.getByText('Jurés ayant finalisé leur lot')).toBeInTheDocument();
  expect(screen.getByText("Taux d'occupation workshops")).toBeInTheDocument();

  expect(screen.queryByText(/réalisateurs/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/pays/i)).not.toBeInTheDocument();
});

it('renvoie vers le planning depuis la tuile des ateliers', async () => {
  serve({ events: [event()] });
  show();

  expect(
    await screen.findByRole('link', { name: /Voir les évènements/i })
  ).toHaveAttribute('href', '/admin/events');
});
