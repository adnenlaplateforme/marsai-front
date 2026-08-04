import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import '../../../config/i18n';
import JuryCard from './JuryCard';

// Même parti que JuryDistributionPanel.test : `useApi` traîne un routeur et un
// contexte d'authentification, la carte n'a besoin que du verbe « appelle telle
// route ».
const api = vi.fn();
vi.mock('../../../hooks/useApi', () => ({ useApi: () => api }));

const jury = {
  id: 7,
  email: 'alice.martin@example.com',
  firstname: 'Alice',
  lastname: 'Martin',
};

it('affiche le nom et l’e-mail du juré', () => {
  render(<JuryCard jury={jury} />);

  expect(screen.getByText('Alice Martin')).toBeInTheDocument();
  expect(screen.getByText('alice.martin@example.com')).toBeInTheDocument();
});

it('annonce un lot non attribué plutôt qu’une progression inventée', () => {
  render(<JuryCard jury={jury} />);

  expect(screen.getByText('Lot non attribué')).toBeInTheDocument();
  expect(screen.queryByText('0%')).not.toBeInTheDocument();
});

it('affiche la progression dès qu’un lot lui est transmis', () => {
  render(<JuryCard jury={jury} progress={{ assigned: 100, rated: 85 }} />);

  expect(screen.getByText('85%')).toBeInTheDocument();
  expect(screen.getByText('85/100 films')).toBeInTheDocument();
});

it('garde le détail du lot fermé tant qu’on ne l’ouvre pas', () => {
  render(<JuryCard jury={jury} />);

  expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByText('Films attribués')).not.toBeInTheDocument();
});

it('ouvre le détail du lot au clic sur le chevron', async () => {
  const user = userEvent.setup();
  render(<JuryCard jury={jury} progress={{ assigned: 100, rated: 85 }} />);

  await user.click(screen.getByRole('button'));

  // Nommé, et non `getByRole('button')` : le détail ouvert contient aussi le
  // bouton de suppression, et la requête au singulier échouerait sur deux
  // résultats.
  expect(screen.getByRole('button', { name: /Voir le lot/ })).toHaveAttribute(
    'aria-expanded',
    'true'
  );
  expect(screen.getByText('Films attribués')).toBeInTheDocument();
  expect(screen.getByText('15')).toBeInTheDocument();
});

it('propose d’écrire au juré depuis le détail', async () => {
  const user = userEvent.setup();
  render(<JuryCard jury={jury} />);

  await user.click(screen.getByRole('button'));

  expect(screen.getByRole('link')).toHaveAttribute(
    'href',
    'mailto:alice.martin@example.com'
  );
});

it('retombe sur l’e-mail quand le juré n’a pas encore de nom', () => {
  render(<JuryCard jury={{ id: 8, email: 'nouveau@example.com' }} />);

  expect(screen.getAllByText('nouveau@example.com').length).toBeGreaterThan(0);
});

/** La suppression vit dans le détail replié : l'ouvrir est un préalable. */
async function ouvrirDetail(user) {
  await user.click(screen.getByRole('button', { name: /Voir le lot/ }));
}

beforeEach(() => {
  api.mockReset();
});

it('ne supprime rien tant que la confirmation n’est pas donnée', async () => {
  const user = userEvent.setup();
  render(<JuryCard jury={jury} />);

  await ouvrirDetail(user);
  await user.click(screen.getByRole('button', { name: /Supprimer/ }));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(api).not.toHaveBeenCalled();
});

/**
 * Le test qui justifie le dialogue. Le panneau de distribution promet, à trois
 * centimètres de là, que « les notes déjà posées ne sont pas effacées » : ici
 * c'est l'inverse, et l'admin qui vient de lire l'autre message doit voir la
 * différence avant de confirmer, pas après.
 */
it('prévient que les notes du juré partent avec lui', async () => {
  const user = userEvent.setup();
  render(<JuryCard jury={jury} progress={{ assigned: 12, rated: 5 }} />);

  await ouvrirDetail(user);
  await user.click(screen.getByRole('button', { name: /Supprimer/ }));

  const dialogue = screen.getByRole('dialog');
  expect(dialogue).toHaveTextContent(/notes/i);
  expect(dialogue).toHaveTextContent(/irréversible/i);
});

it('supprime le juré et prévient le parent', async () => {
  const user = userEvent.setup();
  const onDeleted = vi.fn();
  api.mockResolvedValue({ ok: true, status: 204 });
  render(<JuryCard jury={jury} onDeleted={onDeleted} />);

  await ouvrirDetail(user);
  await user.click(screen.getByRole('button', { name: /Supprimer/ }));
  await user.click(screen.getByRole('button', { name: /Confirmer/ }));

  await waitFor(() => expect(onDeleted).toHaveBeenCalled());
  expect(api).toHaveBeenCalledWith('/juries/7', { method: 'DELETE' });
});

/**
 * Sur un refus, le parent n'est pas prévenu : recharger la liste laisserait
 * croire que la suppression a eu lieu, alors que le juré est toujours là.
 */
it('affiche le refus du serveur sans prévenir le parent', async () => {
  const user = userEvent.setup();
  const onDeleted = vi.fn();
  api.mockResolvedValue({
    ok: false,
    status: 404,
    json: async () => ({ message: 'Jury not found' }),
  });
  render(<JuryCard jury={jury} onDeleted={onDeleted} />);

  await ouvrirDetail(user);
  await user.click(screen.getByRole('button', { name: /Supprimer/ }));
  await user.click(screen.getByRole('button', { name: /Confirmer/ }));

  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(onDeleted).not.toHaveBeenCalled();
});

it('renonce sans rien appeler', async () => {
  const user = userEvent.setup();
  render(<JuryCard jury={jury} />);

  await ouvrirDetail(user);
  await user.click(screen.getByRole('button', { name: /Supprimer/ }));
  await user.click(screen.getByRole('button', { name: /Annuler/ }));

  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  expect(api).not.toHaveBeenCalled();
});
