import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import '../../../config/i18n';
import JuryCard from './JuryCard';

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

  expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
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
