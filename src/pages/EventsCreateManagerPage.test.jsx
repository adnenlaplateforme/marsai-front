import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import '../config/i18n';
import EventsCreateManagerPage from './EventsCreateManagerPage';

const api = vi.fn();
vi.mock('../hooks/useApi', () => ({ useApi: () => api }));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => navigate,
}));

/**
 * La création répond `201 { id }` ; c'est cet identifiant qui adresse le `PUT`
 * anglais. Tout le reste répond 200 à vide, comme `PUT /events/:id`.
 */
function serve({ created = { id: 42 }, en = { ok: true } } = {}) {
  api.mockImplementation((path, init) => {
    if (init?.method === 'POST') {
      return created
        ? { ok: true, json: async () => created }
        : { ok: false, status: 400, json: async () => ({ message: 'Boom' }) };
    }
    if (init?.method === 'PUT' && JSON.parse(init.body).lang === 'EN') {
      return en.ok
        ? { ok: true, json: async () => ({}) }
        : { ok: false, status: 500, json: async () => ({ message: 'Boom' }) };
    }
    return { ok: true, json: async () => ({}) };
  });
}

function set(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

/**
 * Les deux langues sont remplies : c'est le formulaire qui impose un événement
 * bilingue, le back accepte parfaitement une seule traduction.
 */
async function fillForm({ type = 'Atelier' } = {}) {
  await userEvent.click(screen.getByLabelText(type));

  set('Titre (FR)', 'Atelier de montage');
  set('Titre (EN)', 'Editing workshop');
  set('Description (FR)', 'Montage assisté par IA.');
  set('Description (EN)', 'AI-assisted editing.');
  set('Lieu', 'Salle 2');
  set('Date et heure', '2099-05-15T10:00');
  set('Durée en minutes', '120');
  if (type === 'Atelier') set('Nombre de places', '20');
}

function submit() {
  return userEvent.click(screen.getByRole('button', { name: /Créer/i }));
}

function renderPage() {
  return render(
    <MemoryRouter>
      <EventsCreateManagerPage />
    </MemoryRouter>
  );
}

function callsOf(method) {
  return api.mock.calls.filter(call => call[1]?.method === method);
}

beforeEach(() => {
  api.mockReset();
  navigate.mockReset();
});

/**
 * Le back n'a pas d'écriture bilingue : le titre et la description vivent dans
 * `event_translation`, une ligne par langue. La création se fait donc en deux
 * temps — `POST` en français, qui rend l'identifiant, puis `PUT` en anglais, que
 * l'upsert de la modification rend possible sur une traduction absente.
 */
it('crée en français puis complète en anglais', async () => {
  serve();
  renderPage();
  await fillForm();
  await submit();

  await waitFor(() => expect(navigate).toHaveBeenCalledWith('/admin/events'));

  const [post] = callsOf('POST');
  expect(post[0]).toBe('/events');
  expect(JSON.parse(post[1].body)).toMatchObject({
    lang: 'FR',
    title: 'Atelier de montage',
    description: 'Montage assisté par IA.',
    location: 'Salle 2',
    duration: 120,
    capacity: 20,
    isBookable: true,
  });

  const [put] = callsOf('PUT');
  expect(put[0]).toBe('/events/42');
  expect(JSON.parse(put[1].body)).toEqual({
    lang: 'EN',
    title: 'Editing workshop',
    description: 'AI-assisted editing.',
  });
});

/**
 * Le slug naît du titre français, côté back, et n'en bouge plus. Le formulaire
 * n'a donc aucune raison d'en proposer un — surtout pas depuis le titre anglais.
 */
it("n'envoie jamais de slug", async () => {
  serve();
  renderPage();
  await fillForm();
  await submit();

  await waitFor(() => expect(navigate).toHaveBeenCalled());

  for (const call of [...callsOf('POST'), ...callsOf('PUT')]) {
    expect(JSON.parse(call[1].body)).not.toHaveProperty('slug');
  }
});

/**
 * Une conférence ne se réserve pas, mais la base impose `CHECK (capacity > 0)`
 * et le schéma un entier strictement positif : `1` est la valeur qui satisfait
 * la contrainte sans rien promettre. Le champ disparaît plutôt que d'exiger un
 * nombre qui ne veut rien dire.
 */
it('envoie une place pour une conférence, sans champ à remplir', async () => {
  serve();
  renderPage();
  await fillForm({ type: 'Conférence' });

  expect(screen.queryByLabelText('Nombre de places')).not.toBeInTheDocument();

  await submit();
  await waitFor(() => expect(navigate).toHaveBeenCalled());

  expect(JSON.parse(callsOf('POST')[0][1].body)).toMatchObject({
    isBookable: false,
    capacity: 1,
  });
});

/**
 * L'événement français existe déjà quand l'anglais échoue : renvoyer le
 * formulaire tel quel en créerait un second, avec un slug suffixé, sans que
 * l'admin comprenne d'où vient le doublon. La page retient l'identifiant obtenu
 * et bascule en modification.
 */
it("ne recrée pas l'événement quand seul l'anglais a échoué", async () => {
  serve({ en: { ok: false } });
  renderPage();
  await fillForm();
  await submit();

  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(navigate).not.toHaveBeenCalled();

  await submit();

  await waitFor(() => expect(callsOf('PUT').length).toBeGreaterThan(1));
  expect(callsOf('POST')).toHaveLength(1);

  const retried = callsOf('PUT').map(call => JSON.parse(call[1].body).lang);
  expect(retried).toEqual(['EN', 'FR', 'EN']);
  expect(callsOf('PUT')[1][0]).toBe('/events/42');
});

it("signale l'échec de la création et reste sur place", async () => {
  serve({ created: null });
  renderPage();
  await fillForm();
  await submit();

  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(navigate).not.toHaveBeenCalled();
  expect(callsOf('PUT')).toHaveLength(0);
});

/**
 * `publishedAt` est obligatoire à la création — il ne l'est pas à la
 * modification. Le champ est prérempli pour que l'admin n'ait pas à saisir une
 * date qu'il ne cherche presque jamais à décaler.
 */
it('propose une date de publication par défaut', async () => {
  serve();
  renderPage();

  expect(screen.getByLabelText('Date de publication').value).toMatch(
    /^\d{4}-\d{2}-\d{2}T09:00$/
  );
});
