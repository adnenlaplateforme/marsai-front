import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import '../../config/i18n';
import JuryDistributionPanel from './JuryDistributionPanel';

it('annonce le découpage à partir des vrais compteurs', () => {
  render(<JuryDistributionPanel movieCount={600} juryCount={4} />);

  expect(
    screen.getByText(/répartit les 600 films acceptés entre les 4 jurés/)
  ).toBeInTheDocument();
  expect(screen.getByText('1200')).toBeInTheDocument();
  expect(screen.getByText('300')).toBeInTheDocument();
});

it('bloque le lancement quand un film ne peut pas être vu par deux jurés', () => {
  render(<JuryDistributionPanel movieCount={600} juryCount={1} />);

  expect(
    screen.getByRole('button', { name: /Lancer l’attribution|attribution/i })
  ).toBeDisabled();
  expect(screen.getByText(/au moins 2 jurés/)).toBeInTheDocument();
});

it('signale l’absence de film à répartir plutôt qu’un découpage vide', () => {
  render(<JuryDistributionPanel movieCount={0} juryCount={4} />);

  expect(screen.getByText(/Aucun film accepté à répartir/)).toBeInTheDocument();
});

it('demande confirmation avant de lancer l’attribution', async () => {
  const user = userEvent.setup();
  render(<JuryDistributionPanel movieCount={5} juryCount={3} />);

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /Lancer/i }));

  const dialog = screen.getByRole('dialog');
  expect(dialog).toBeInTheDocument();
  // 5 films × 2 évaluations = 10, sur 3 jurés : 3 chacun, +1 pour l'un d'eux.
  expect(dialog).toHaveTextContent('3 (+1 pour 1 juré)');
});

it('laisse la confirmation inactive tant que la route n’existe pas', async () => {
  const user = userEvent.setup();
  render(<JuryDistributionPanel movieCount={600} juryCount={4} />);

  await user.click(screen.getByRole('button', { name: /Lancer/i }));

  expect(screen.getByRole('button', { name: 'Confirmer' })).toBeDisabled();
  expect(
    screen.getByText(/n'existe pas encore côté serveur/)
  ).toBeInTheDocument();
});

it('ferme la confirmation sur Annuler', async () => {
  const user = userEvent.setup();
  render(<JuryDistributionPanel movieCount={600} juryCount={4} />);

  await user.click(screen.getByRole('button', { name: /Lancer/i }));
  await user.click(screen.getByRole('button', { name: 'Annuler' }));

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('garde le mode manuel inactif, faute de lot à déplacer', () => {
  render(<JuryDistributionPanel movieCount={600} juryCount={4} />);

  expect(screen.getByRole('button', { name: /Mode manuel/i })).toBeDisabled();
});
