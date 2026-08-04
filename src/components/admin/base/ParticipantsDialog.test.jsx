import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi, describe } from 'vitest';
import '../../../config/i18n';
import ParticipantsDialog from './ParticipantsDialog';

const api = vi.fn();
vi.mock('../../../hooks/useApi', () => ({ useApi: () => api }));

const workshop = {
  id: 3,
  title: 'Masterclass: prompt engineering vidéo',
  date: '2026-05-17T10:00:00',
};

const bookings = [
  {
    id: 1,
    participant_id: 10,
    firstname: 'Alice',
    lastname: 'Martin',
    email: 'alice@test.com',
    created_at: '2026-05-01T08:00:00.000Z',
  },
  {
    id: 2,
    participant_id: 11,
    firstname: 'Bob',
    lastname: 'Durand',
    email: 'bob@test.com',
    created_at: '2026-05-02T08:00:00.000Z',
  },
];

const respondWith = data =>
  api.mockResolvedValue({ ok: true, status: 200, json: async () => data });

beforeEach(() => {
  api.mockReset();
});

describe('ParticipantsDialog', () => {
  it('demande les réservations de l’événement à l’ouverture', async () => {
    respondWith(bookings);
    render(<ParticipantsDialog event={workshop} onClose={() => {}} />);

    await waitFor(() =>
      expect(api).toHaveBeenCalledWith('/events/3/bookings')
    );
  });

  it('liste les inscrits avec leur adresse', async () => {
    respondWith(bookings);
    render(<ParticipantsDialog event={workshop} onClose={() => {}} />);

    const dialogue = await screen.findByRole('dialog');
    expect(await within(dialogue).findByText('Alice Martin')).toBeInTheDocument();
    expect(within(dialogue).getByText('alice@test.com')).toBeInTheDocument();
    expect(within(dialogue).getByText('Bob Durand')).toBeInTheDocument();
  });

  /**
   * `firstname` et `lastname` sont nullables en base — seul l'e-mail est
   * obligatoire à la réservation. Afficher une ligne vide ferait croire à une
   * inscription corrompue alors que l'e-mail suffit à contacter la personne.
   */
  it('se rabat sur l’adresse quand le participant n’a pas de nom', async () => {
    respondWith([{ ...bookings[0], firstname: null, lastname: null }]);
    render(<ParticipantsDialog event={workshop} onClose={() => {}} />);

    const dialogue = await screen.findByRole('dialog');
    expect(await within(dialogue).findByText('alice@test.com')).toBeInTheDocument();
  });

  it('annonce qu’aucune réservation n’a été posée', async () => {
    respondWith([]);
    render(<ParticipantsDialog event={workshop} onClose={() => {}} />);

    expect(await screen.findByText(/Personne n'a réservé/)).toBeInTheDocument();
  });

  it('affiche le refus du serveur', async () => {
    api.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Event not found' }),
    });
    render(<ParticipantsDialog event={workshop} onClose={() => {}} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Event not found'
    );
  });

  /** `useApi` rend `null` quand la session est morte : il a déjà déconnecté. */
  it('ne montre pas d’erreur quand la session a expiré', async () => {
    api.mockResolvedValue(null);
    render(<ParticipantsDialog event={workshop} onClose={() => {}} />);

    await waitFor(() => expect(api).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('ferme sur demande', async () => {
    respondWith(bookings);
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ParticipantsDialog event={workshop} onClose={onClose} />);

    await user.click(await screen.findByRole('button', { name: /Fermer/ }));

    expect(onClose).toHaveBeenCalled();
  });
});

/**
 * L'icône de la maquette est un téléchargement : le bouton doit produire un
 * fichier, pas afficher un tableau de plus. jsdom ne sait pas télécharger, on
 * vérifie donc le blob fabriqué et le nom proposé.
 */
describe('ParticipantsDialog — export CSV', () => {
  let createdBlob;
  let clicked;

  beforeEach(() => {
    createdBlob = null;
    clicked = null;
    vi.spyOn(URL, 'createObjectURL').mockImplementation(blob => {
      createdBlob = blob;
      return 'blob:fake';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      function () {
        clicked = this;
      }
    );
  });

  it('exporte les inscrits en CSV', async () => {
    respondWith(bookings);
    const user = userEvent.setup();
    render(<ParticipantsDialog event={workshop} onClose={() => {}} />);

    await user.click(await screen.findByRole('button', { name: /Exporter/ }));

    expect(createdBlob).toBeInstanceOf(Blob);
    expect(await createdBlob.text()).toContain('Martin,Alice,alice@test.com');
    expect(clicked.download).toMatch(/\.csv$/);
  });

  it('ne propose pas d’export quand personne n’a réservé', async () => {
    respondWith([]);
    render(<ParticipantsDialog event={workshop} onClose={() => {}} />);

    await screen.findByText(/Personne n'a réservé/);
    expect(
      screen.queryByRole('button', { name: /Exporter/ })
    ).not.toBeInTheDocument();
  });
});
