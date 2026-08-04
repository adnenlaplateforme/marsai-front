import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import '../../../config/i18n';
import EventCard from './EventCard';

// Comme pour JuryCard : `useApi` traîne un routeur et un contexte
// d'authentification, la carte n'a besoin que du verbe « appelle telle route ».
const api = vi.fn();
vi.mock('../../../hooks/useApi', () => ({ useApi: () => api }));

const workshop = {
  id: 3,
  date: '2026-05-17T10:00:00',
  duration: 120,
  title: 'Masterclass: prompt engineering vidéo',
  description:
    'Apprenez à maîtriser la cohérence temporelle avec Runway Gen-3.',
  location: 'Auditorium MuCEM',
  lang: 'FR',
  is_bookable: 1,
  capacity: 20,
  remaining_seats: 8,
};

beforeEach(() => {
  api.mockReset();
});

it('affiche le créneau, le titre et le lieu', () => {
  render(<EventCard event={workshop} />);

  expect(screen.getByText('10:00 – 12:00')).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: workshop.title })
  ).toBeInTheDocument();
  expect(screen.getByText('Auditorium MuCEM')).toBeInTheDocument();
});

it('annonce les inscriptions et les places restantes', () => {
  render(<EventCard event={workshop} />);

  expect(screen.getByText(/Nombre d'inscriptions : 12/)).toBeInTheDocument();
  expect(screen.getByText(/8 places restantes/)).toBeInTheDocument();
});

/**
 * Une conférence n'a pas zéro inscrit : elle n'en attend aucun. Afficher
 * « 0 inscription » ferait passer une salle libre pour un atelier boudé.
 */
it('dit qu’une conférence ne se réserve pas au lieu de compter zéro', () => {
  render(
    <EventCard
      event={{
        ...workshop,
        is_bookable: 0,
        capacity: null,
        remaining_seats: null,
      }}
    />
  );

  expect(screen.getByText(/Entrée libre/)).toBeInTheDocument();
  expect(screen.queryByText(/Nombre d'inscriptions/)).not.toBeInTheDocument();
});

/**
 * Un événement qui n'existe qu'en anglais s'affiche quand même — sinon il
 * disparaîtrait du planning — mais l'admin doit voir que la version française
 * manque, plutôt que de croire à un titre mal saisi.
 */
it('signale la traduction manquante dans la langue de l’interface', () => {
  render(<EventCard event={{ ...workshop, lang: 'EN' }} />);

  expect(screen.getByText('EN')).toBeInTheDocument();
});

it('ne signale rien quand la traduction est celle de l’interface', () => {
  render(<EventCard event={workshop} />);

  expect(screen.queryByText('EN')).not.toBeInTheDocument();
});

/**
 * La dernière action de la maquette que rien ne sert encore : le formulaire
 * d'édition n'existe pas. Elle reste à sa place, désactivée et motivée — comme
 * le « mode manuel » du panneau de distribution — plutôt que de promettre un
 * clic sans effet.
 */
it('désactive la modification en donnant la raison', () => {
  render(<EventCard event={workshop} />);

  const edit = screen.getByRole('button', { name: /Modifier/ });

  expect(edit).toBeDisabled();
  expect(edit).toHaveAccessibleDescription(/formulaire/i);
});

it('ouvre la liste des participants sans rien charger avant le clic', async () => {
  const user = userEvent.setup();
  api.mockResolvedValue({ ok: true, status: 200, json: async () => [] });
  render(<EventCard event={workshop} />);

  const participants = screen.getByRole('button', {
    name: /Liste participants/,
  });
  expect(participants).toBeEnabled();
  // Une carte par créneau : charger les inscrits de chacune à l'affichage
  // ferait une requête par atelier du programme pour un panneau que l'admin
  // n'ouvrira peut-être jamais.
  expect(api).not.toHaveBeenCalled();

  await user.click(participants);

  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith('/events/3/bookings')
  );
});

it('ne supprime rien tant que la confirmation n’est pas donnée', async () => {
  const user = userEvent.setup();
  render(<EventCard event={workshop} />);

  await user.click(screen.getByRole('button', { name: /Supprimer/ }));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(api).not.toHaveBeenCalled();
});

/**
 * `booking` est en `ON DELETE CASCADE` sur `event` : supprimer l'événement
 * efface les réservations sans prévenir personne. L'admin doit le lire avant de
 * confirmer, pas le découvrir quand douze participants se présentent.
 */
it('prévient que les réservations partent avec l’événement', async () => {
  const user = userEvent.setup();
  render(<EventCard event={workshop} />);

  await user.click(screen.getByRole('button', { name: /Supprimer/ }));

  const dialogue = screen.getByRole('dialog');
  expect(dialogue).toHaveTextContent(/12 réservations/);
  expect(dialogue).toHaveTextContent(/irréversible/i);
});

it('supprime l’événement et prévient le parent', async () => {
  const user = userEvent.setup();
  const onDeleted = vi.fn();
  api.mockResolvedValue({ ok: true, status: 204 });
  render(<EventCard event={workshop} onDeleted={onDeleted} />);

  await user.click(screen.getByRole('button', { name: /Supprimer/ }));
  await user.click(screen.getByRole('button', { name: /Confirmer/ }));

  await waitFor(() => expect(onDeleted).toHaveBeenCalled());
  expect(api).toHaveBeenCalledWith('/events/3', { method: 'DELETE' });
});

it('affiche le refus du serveur sans prévenir le parent', async () => {
  const user = userEvent.setup();
  const onDeleted = vi.fn();
  api.mockResolvedValue({
    ok: false,
    status: 404,
    json: async () => ({ message: 'Event not found' }),
  });
  render(<EventCard event={workshop} onDeleted={onDeleted} />);

  await user.click(screen.getByRole('button', { name: /Supprimer/ }));
  await user.click(screen.getByRole('button', { name: /Confirmer/ }));

  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(onDeleted).not.toHaveBeenCalled();
});

it('renonce sans rien appeler', async () => {
  const user = userEvent.setup();
  render(<EventCard event={workshop} />);

  await user.click(screen.getByRole('button', { name: /Supprimer/ }));
  await user.click(screen.getByRole('button', { name: /Annuler/ }));

  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  expect(api).not.toHaveBeenCalled();
});
