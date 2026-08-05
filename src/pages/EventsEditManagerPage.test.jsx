import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import '../config/i18n';
import EventsEditManagerPage from './EventsEditManagerPage';

const api = vi.fn();
vi.mock('../hooks/useApi', () => ({ useApi: () => api }));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => navigate,
}));

const frEvent = {
  id: 7,
  slug: 'masterclass-prompt',
  status: 'published',
  date: '2099-05-15T10:00:00',
  published_at: '2099-04-01T09:00:00',
  duration: 120,
  location: 'Auditorium MuCEM',
  is_bookable: 1,
  capacity: 20,
  lang: 'FR',
  title: 'Masterclass prompt',
  description: 'Cohérence temporelle.',
};

const enEvent = {
  ...frEvent,
  lang: 'EN',
  title: 'Prompt masterclass',
  description: 'Temporal coherence.',
};

/**
 * La page lit la même route deux fois, une par langue. `EN: null` rejoue le cas
 * courant d'un événement saisi en français seulement : `findById` joint
 * `event_translation`, donc l'anglais répond 404 — un formulaire vide à
 * remplir, pas une panne.
 */
function serve({ FR = frEvent, EN = enEvent } = {}) {
  api.mockImplementation(path => {
    const wanted = path.includes('lang=EN') ? EN : FR;
    return wanted
      ? { ok: true, json: async () => wanted }
      : { ok: false, status: 404, json: async () => ({ message: 'Event not found' }) };
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/events/7/edit']}>
      <Routes>
        <Route
          path="/admin/events/:id/edit"
          element={<EventsEditManagerPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.mockReset();
  navigate.mockReset();
});

it('préremplit les deux langues depuis les deux lectures', async () => {
  serve();
  renderPage();

  expect(await screen.findByDisplayValue('Masterclass prompt')).toBeInTheDocument();
  expect(screen.getByDisplayValue('Prompt masterclass')).toBeInTheDocument();
  expect(screen.getByDisplayValue('Auditorium MuCEM')).toBeInTheDocument();
  expect(screen.getByDisplayValue('120')).toBeInTheDocument();

  const paths = api.mock.calls.map(call => call[0]);
  expect(paths).toContain('/events/7');
  expect(paths).toContain('/events/7?lang=EN');
});

/**
 * Le cas qui justifie deux lectures séparées : l'anglais manque, et c'est
 * normal. La page doit ouvrir un champ vide sans crier à l'erreur.
 */
it('ouvre un formulaire anglais vide quand la traduction manque', async () => {
  serve({ EN: null });
  renderPage();

  expect(await screen.findByDisplayValue('Masterclass prompt')).toBeInTheDocument();
  expect(screen.getByLabelText(/Titre \(EN\)/)).toHaveValue('');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it("signale l'erreur quand l'événement est introuvable dans les deux langues", async () => {
  serve({ FR: null, EN: null });
  renderPage();

  expect(await screen.findByRole('alert')).toHaveTextContent(/introuvable/i);
});

/**
 * Un PUT par langue. Le premier porte les champs communs — ils vivent dans
 * `event`, pas dans la traduction — le second ne porte que le titre et la
 * description anglais.
 */
it('enregistre en un PUT par langue', async () => {
  serve();
  renderPage();
  await screen.findByDisplayValue('Masterclass prompt');

  api.mockImplementation(() => ({ ok: true, json: async () => ({}) }));
  await userEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

  await waitFor(() => expect(navigate).toHaveBeenCalledWith('/admin/events'));

  const puts = api.mock.calls.filter(call => call[1]?.method === 'PUT');
  expect(puts).toHaveLength(2);

  const [fr, en] = puts.map(call => JSON.parse(call[1].body));
  expect(fr).toMatchObject({
    lang: 'FR',
    title: 'Masterclass prompt',
    location: 'Auditorium MuCEM',
    duration: 120,
    capacity: 20,
    isBookable: true,
  });
  expect(en).toEqual({
    lang: 'EN',
    title: 'Prompt masterclass',
    description: 'Temporal coherence.',
  });
});

/**
 * Le slug est l'adresse publique de l'événement et vit dans `event`, partagé
 * par les deux langues. Le back ne le recalcule plus à la modification ; le
 * formulaire n'a donc aucune raison d'en envoyer un.
 */
it("n'envoie jamais de slug", async () => {
  serve();
  renderPage();
  await screen.findByDisplayValue('Masterclass prompt');

  api.mockImplementation(() => ({ ok: true, json: async () => ({}) }));
  await userEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

  await waitFor(() => expect(navigate).toHaveBeenCalled());

  const puts = api.mock.calls.filter(call => call[1]?.method === 'PUT');
  for (const put of puts) {
    expect(JSON.parse(put[1].body)).not.toHaveProperty('slug');
  }
});

/**
 * Le second PUT ne doit pas passer inaperçu : la traduction anglaise resterait
 * silencieusement à l'ancienne valeur alors que la page annonce un succès.
 */
it("reste sur place et signale l'échec d'une des deux langues", async () => {
  serve();
  renderPage();
  await screen.findByDisplayValue('Masterclass prompt');

  api.mockImplementation((path, init) =>
    init?.method === 'PUT' && JSON.parse(init.body).lang === 'EN'
      ? { ok: false, status: 500, json: async () => ({ message: 'Boom' }) }
      : { ok: true, json: async () => ({}) }
  );
  await userEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(navigate).not.toHaveBeenCalled();
});
