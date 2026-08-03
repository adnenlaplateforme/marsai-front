import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import '../../config/i18n';
import JuryDistributionPanel from './JuryDistributionPanel';

// `useApi` traîne un routeur et un contexte d'authentification derrière lui.
// Le panneau n'a besoin que du verbe « appelle telle route » : on le lui donne
// directement plutôt que d'assembler la moitié de l'application autour.
const api = vi.fn();
vi.mock('../../hooks/useApi', () => ({ useApi: () => api }));

const ok = (status, body) => ({ ok: true, status, json: async () => body });
const ko = (status, message) => ({
  ok: false,
  status,
  json: async () => ({ message }),
});

/** L'état renvoyé par `GET /jury-assignments` avant toute attribution. */
const vierge = { juries: [], unassigned: 0 };

const attribue = {
  juries: [
    { user_id: 1, assigned: 3, rated: 1 },
    { user_id: 2, assigned: 2, rated: 0 },
  ],
  unassigned: 0,
};

beforeEach(() => {
  api.mockReset();
});

it('annonce le découpage à partir des vrais compteurs', () => {
  render(
    <JuryDistributionPanel movieCount={600} juryCount={4} assignment={vierge} />
  );

  expect(
    screen.getByText(/répartit les 600 films acceptés entre les 4 jurés/)
  ).toBeInTheDocument();
  expect(screen.getByText('1200')).toBeInTheDocument();
  expect(screen.getByText('300')).toBeInTheDocument();
});

it('bloque le lancement quand un film ne peut pas être vu par deux jurés', () => {
  render(
    <JuryDistributionPanel movieCount={600} juryCount={1} assignment={vierge} />
  );

  expect(screen.getByRole('button', { name: /Lancer/i })).toBeDisabled();
  expect(screen.getByText(/au moins 2 jurés/)).toBeInTheDocument();
});

it('signale l’absence de film à répartir plutôt qu’un découpage vide', () => {
  render(
    <JuryDistributionPanel movieCount={0} juryCount={4} assignment={vierge} />
  );

  expect(screen.getByText(/Aucun film accepté à répartir/)).toBeInTheDocument();
});

it('demande confirmation avant de lancer l’attribution', async () => {
  const user = userEvent.setup();
  render(
    <JuryDistributionPanel movieCount={5} juryCount={3} assignment={vierge} />
  );

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /Lancer/i }));

  const dialog = screen.getByRole('dialog');
  // 5 films × 2 évaluations = 10, sur 3 jurés : 3 chacun, +1 pour l'un d'eux.
  expect(dialog).toHaveTextContent('3 (+1 pour 1 juré)');
  expect(api).not.toHaveBeenCalled();
});

it('lance l’attribution et prévient le parent', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  api.mockResolvedValue(
    ok(201, { movies: 5, juries: 3, assignments: 10, perJury: [] })
  );

  render(
    <JuryDistributionPanel
      movieCount={5}
      juryCount={3}
      assignment={vierge}
      onChange={onChange}
    />
  );

  await user.click(screen.getByRole('button', { name: /Lancer/i }));
  await user.click(screen.getByRole('button', { name: 'Confirmer' }));

  await waitFor(() => expect(onChange).toHaveBeenCalled());
  expect(api).toHaveBeenCalledWith('/jury-assignments', { method: 'POST' });
});

/**
 * Le refus qu'un front distrait avalerait le plus facilement : le serveur dit
 * « déjà attribué », et sans ce traitement l'admin repartirait convaincu d'avoir
 * relancé une attribution qui n'a pas eu lieu.
 */
it('explique le refus quand les films sont déjà attribués', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  api.mockResolvedValue(
    ko(409, 'Films already assigned, reset the assignments first')
  );

  render(
    <JuryDistributionPanel
      movieCount={5}
      juryCount={3}
      assignment={vierge}
      onChange={onChange}
    />
  );

  await user.click(screen.getByRole('button', { name: /Lancer/i }));
  await user.click(screen.getByRole('button', { name: 'Confirmer' }));

  expect(await screen.findByText(/déjà attribués/i)).toBeInTheDocument();
  expect(onChange).not.toHaveBeenCalled();
});

it('remonte le refus du serveur quand l’attribution est impossible', async () => {
  const user = userEvent.setup();
  api.mockResolvedValue(ko(422, 'No accepted movie to assign'));

  render(
    <JuryDistributionPanel movieCount={5} juryCount={3} assignment={vierge} />
  );

  await user.click(screen.getByRole('button', { name: /Lancer/i }));
  await user.click(screen.getByRole('button', { name: 'Confirmer' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'No accepted movie to assign'
  );
});

/**
 * Une fois l'attribution faite, les chiffres affichés doivent venir de la base
 * et non du calcul de prévisualisation : c'est la seule façon de voir un
 * rattrapage manuel ou un film accepté après coup.
 */
it('affiche les compteurs réels une fois l’attribution faite', () => {
  render(
    <JuryDistributionPanel
      movieCount={5}
      juryCount={2}
      assignment={attribue}
    />
  );

  expect(screen.getByText('5')).toBeInTheDocument(); // 3 + 2 attributions
  expect(screen.queryByRole('button', { name: /Lancer/i })).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /Réinitialiser/i })
  ).toBeInTheDocument();
});

it('signale les films accepted qu’aucun juré ne couvre', () => {
  render(
    <JuryDistributionPanel
      movieCount={6}
      juryCount={2}
      assignment={{ ...attribue, unassigned: 2 }}
    />
  );

  expect(screen.getByText(/2 films acceptés/)).toBeInTheDocument();
});

it('remet l’attribution à zéro après confirmation', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  api.mockResolvedValue({ ok: true, status: 204 });

  render(
    <JuryDistributionPanel
      movieCount={5}
      juryCount={2}
      assignment={attribue}
      onChange={onChange}
    />
  );

  await user.click(screen.getByRole('button', { name: /Réinitialiser/i }));
  await user.click(screen.getByRole('button', { name: 'Confirmer' }));

  await waitFor(() => expect(onChange).toHaveBeenCalled());
  expect(api).toHaveBeenCalledWith('/jury-assignments', { method: 'DELETE' });
});

it('ferme la confirmation sur Annuler sans rien appeler', async () => {
  const user = userEvent.setup();
  render(
    <JuryDistributionPanel movieCount={600} juryCount={4} assignment={vierge} />
  );

  await user.click(screen.getByRole('button', { name: /Lancer/i }));
  await user.click(screen.getByRole('button', { name: 'Annuler' }));

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(api).not.toHaveBeenCalled();
});

/**
 * Les routes d'ajustement à l'unité existent côté serveur, mais rien ne renvoie
 * la *liste* des films d'un lot : l'admin choisirait à l'aveugle ce qu'il
 * retire. Le bouton reste donc inactif, et le dit.
 */
it('garde le mode manuel inactif, faute de route listant un lot', () => {
  render(
    <JuryDistributionPanel movieCount={600} juryCount={4} assignment={vierge} />
  );

  expect(screen.getByRole('button', { name: /Mode manuel/i })).toBeDisabled();
});
