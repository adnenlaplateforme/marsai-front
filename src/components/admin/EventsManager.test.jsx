import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import '../../config/i18n';
import EventsManager from './EventsManager';

const api = vi.fn();
vi.mock('../../hooks/useApi', () => ({ useApi: () => api }));

// Des journées volontairement lointaines : la page ouvre la première journée à
// venir, et un festival daté d'hier ferait dépendre le test du jour où on le
// lance.
const vendredi = '2099-05-15T10:00:00';
const samedi = '2099-05-16T14:00:00';

function event(overrides = {}) {
  return {
    id: 1,
    date: vendredi,
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

/** `GET /events?lang=FR` puis `?lang=EN` : la page lit les deux catalogues. */
function serve({ FR = [], EN = [] }) {
  api.mockImplementation(path => ({
    ok: true,
    json: async () => (path.includes('lang=EN') ? EN : FR),
  }));
}

function renderPage() {
  return render(
    <MemoryRouter>
      <EventsManager />
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.mockReset();
});

it('affiche les réservations totales et le taux de remplissage', async () => {
  serve({
    FR: [
      event({ id: 1, capacity: 20, remaining_seats: 8 }),
      event({ id: 2, capacity: 30, remaining_seats: 15 }),
    ],
  });
  renderPage();

  // 12 + 15 places prises sur 50 offertes.
  expect(await screen.findByText('27')).toBeInTheDocument();
  expect(screen.getByText('54%')).toBeInTheDocument();
});

/**
 * Le catalogue est lu deux fois, une par langue, et le même atelier revient dans
 * les deux réponses. Sans fusion, le planning afficherait chaque créneau en
 * double.
 */
it('ne montre qu’une carte pour un événement traduit deux fois', async () => {
  serve({
    FR: [event({ id: 1, title: 'Atelier musique' })],
    EN: [event({ id: 1, title: 'Music workshop', lang: 'EN' })],
  });
  renderPage();

  expect(await screen.findByText('Atelier musique')).toBeInTheDocument();
  expect(screen.queryByText('Music workshop')).not.toBeInTheDocument();
});

it('garde au planning un événement qui n’existe qu’en anglais', async () => {
  serve({ EN: [event({ id: 9, title: 'English only', lang: 'EN' })] });
  renderPage();

  expect(await screen.findByText('English only')).toBeInTheDocument();
});

it('range les événements sous un onglet par journée', async () => {
  serve({
    FR: [
      event({ id: 1, date: vendredi, title: 'Ouverture' }),
      event({ id: 2, date: samedi, title: 'Clôture' }),
    ],
  });
  renderPage();

  const onglets = await screen.findAllByRole('tab');
  expect(onglets).toHaveLength(2);
  expect(onglets[0]).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText('Ouverture')).toBeInTheDocument();
  expect(screen.queryByText('Clôture')).not.toBeInTheDocument();
});

it('change de journée au clic sur un onglet', async () => {
  const user = userEvent.setup();
  serve({
    FR: [
      event({ id: 1, date: vendredi, title: 'Ouverture' }),
      event({ id: 2, date: samedi, title: 'Clôture' }),
    ],
  });
  renderPage();

  const onglets = await screen.findAllByRole('tab');
  await user.click(onglets[1]);

  expect(screen.getByText('Clôture')).toBeInTheDocument();
  expect(screen.queryByText('Ouverture')).not.toBeInTheDocument();
});

it('annonce un programme vide sans onglet ni chiffre inventé', async () => {
  serve({});
  renderPage();

  expect(
    await screen.findByText(/Aucun événement au programme/)
  ).toBeInTheDocument();
  expect(screen.queryAllByRole('tab')).toHaveLength(0);
});

it('signale une lecture en échec plutôt qu’un planning vide', async () => {
  api.mockResolvedValue({ ok: false, status: 500 });
  renderPage();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    /Erreur lors de la récupération des événements/
  );
});
