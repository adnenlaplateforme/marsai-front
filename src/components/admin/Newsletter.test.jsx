import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import '../../config/i18n';
import Newsletter from './Newsletter';

const api = vi.fn();
vi.mock('../../hooks/useApi', () => ({ useApi: () => api }));

/** Une ligne de `GET /newsletters`, avec les seules colonnes que le back sert. */
function newsletter(overrides = {}) {
  return {
    id: 1,
    object: 'Le programme 2026',
    content: 'Bonjour à tous, voici le programme.',
    createdAt: '2026-05-10T09:00:00.000Z',
    sendAt: null,
    sent: 0,
    ...overrides,
  };
}

function serve(newsletters) {
  api.mockImplementation(() => ({ ok: true, json: async () => newsletters }));
}

beforeEach(() => {
  api.mockReset();
});

it('remonte la campagne la plus récente en tête de liste', async () => {
  serve([
    newsletter({
      id: 1,
      object: 'Appel à films',
      createdAt: '2026-04-01T09:00:00.000Z',
    }),
    newsletter({
      id: 2,
      object: 'Le programme',
      createdAt: '2026-05-01T09:00:00.000Z',
    }),
  ]);
  render(<Newsletter />);

  const titres = await screen.findAllByRole('heading', { level: 3 });
  expect(titres.map(titre => titre.textContent)).toEqual([
    'Le programme',
    'Appel à films',
  ]);
});

/**
 * Le cas le plus courant : « envoyer maintenant » laisse `send_at` à NULL, et la
 * table n'a pas de colonne `sent_at`. Sans repli sur la création, la carte
 * affichait « Sent at: Not set » sous une campagne pourtant bien partie.
 */
it('date une campagne envoyée sur-le-champ par sa création', async () => {
  serve([newsletter({ sendAt: null, sent: 1 })]);
  render(<Newsletter />);

  expect(await screen.findByText(/Envoyée le/)).toBeInTheDocument();
  expect(screen.queryByText(/Date inconnue/)).not.toBeInTheDocument();
});

/**
 * Une campagne sans date ni drapeau n'a pas échoué : `findAllToSend` reprend les
 * lignes `send_at IS NULL AND sent = 0` au passage suivant du cron. L'ancienne
 * page les annonçait « Failed », ce qui poussait l'admin à renvoyer une campagne
 * déjà en route.
 */
it('annonce un envoi en cours plutôt qu’un échec', async () => {
  serve([newsletter({ sendAt: null, sent: 0 })]);
  render(<Newsletter />);

  expect(await screen.findByText('Envoi en cours')).toBeInTheDocument();
});

it('compte les campagnes envoyées et celles qui attendent leur heure', async () => {
  serve([
    newsletter({ id: 1, sent: 1 }),
    newsletter({ id: 2, sent: 1 }),
    newsletter({ id: 3, sendAt: '2099-05-10T18:00:00.000Z', sent: 0 }),
  ]);
  render(<Newsletter />);

  expect(await screen.findByText('2')).toBeInTheDocument();
  expect(screen.getByText('1')).toBeInTheDocument();
  expect(screen.getByText(/sur 3 campagnes écrites/)).toBeInTheDocument();
});

it('signale une lecture en échec plutôt qu’une page vide', async () => {
  api.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
  render(<Newsletter />);

  expect(await screen.findByRole('alert')).toHaveTextContent(
    /Erreur lors de la récupération des newsletters/
  );
});

/**
 * `useApi` rend `null` quand la session est morte : il a déjà déconnecté, une
 * erreur de plus ne dirait rien à personne.
 */
it('reste muet quand la session a expiré', async () => {
  api.mockResolvedValue(null);
  render(<Newsletter />);

  expect(await screen.findByText(/Aucune newsletter/)).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('annonce une liste vide', async () => {
  serve([]);
  render(<Newsletter />);

  expect(await screen.findByText(/Aucune newsletter/)).toBeInTheDocument();
});

it('ouvre le contenu intégral au clic sur une campagne', async () => {
  const user = userEvent.setup();
  serve([
    newsletter({
      object: 'Le programme',
      content: 'Le festival ouvre ses portes le 15 mai.',
    }),
  ]);
  render(<Newsletter />);

  await user.click(await screen.findByRole('button', { name: /Le programme/ }));

  const dialogue = screen.getByRole('dialog');
  expect(dialogue).toHaveTextContent('Le festival ouvre ses portes le 15 mai.');
});

it('ferme le contenu à la touche Échap', async () => {
  const user = userEvent.setup();
  serve([newsletter({ object: 'Le programme' })]);
  render(<Newsletter />);

  await user.click(await screen.findByRole('button', { name: /Le programme/ }));
  await user.keyboard('{Escape}');

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('ouvre le formulaire de rédaction', async () => {
  const user = userEvent.setup();
  serve([]);
  render(<Newsletter />);

  await user.click(
    await screen.findByRole('button', { name: /Rédiger une newsletter/ })
  );

  expect(screen.getByLabelText('Objet')).toBeInTheDocument();
});

/**
 * La liste est relue après un envoi : la campagne qui vient de partir doit
 * apparaître, et son statut ne se devine pas depuis le formulaire — c'est le
 * serveur qui pose `sent`.
 */
it('relit la liste après un envoi', async () => {
  const user = userEvent.setup();
  api.mockImplementation((path, init) => {
    if (init?.method === 'POST') return { ok: true, json: async () => ({}) };
    return {
      ok: true,
      json: async () => (api.mock.calls.length > 2 ? [newsletter()] : []),
    };
  });
  render(<Newsletter />);

  await user.click(
    await screen.findByRole('button', { name: /Rédiger une newsletter/ })
  );
  await user.type(screen.getByLabelText('Objet'), 'Le programme 2026');
  await user.type(screen.getByLabelText('Contenu'), 'Bonjour à tous');
  await user.click(screen.getByRole('button', { name: /Envoyer maintenant/ }));

  expect(await screen.findByText('Le programme 2026')).toBeInTheDocument();
});
