import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import MovieRow from './MovieRow';
import { MemoryRouter } from 'react-router-dom';

const data = {
  id: 12,
  slug: 'slug',
  cover_path: 'cover_path',
  english_title: 'Spiderman',
  status: 'pending_review',
  director: {
    firstname: 'Bob',
    lastname: 'Eponge',
  },
  submitted_at: '2026-05-20 11:20:45',
};

it('Affiche le prenom du directeur', () => {
  render(
    <MemoryRouter>
      <MovieRow data={data} />
    </MemoryRouter>
  );

  expect(screen.getByRole('row')).toHaveTextContent('Bob');
});

it('Affiche le nom du directeur', () => {
  render(
    <MemoryRouter>
      <MovieRow data={data} />
    </MemoryRouter>
  );

  expect(screen.getByRole('row')).toHaveTextContent('Eponge');
});

it('Affiche le titre du film', () => {
  render(
    <MemoryRouter>
      <MovieRow data={data} />
    </MemoryRouter>
  );

  expect(screen.getByText('Spiderman')).toBeInTheDocument();
});

it('Affiche le libellé du status du film, pas la valeur brute', () => {
  render(
    <MemoryRouter>
      <MovieRow data={data} />
    </MemoryRouter>
  );

  expect(screen.getByText('En attente')).toBeInTheDocument();
  expect(screen.queryByText('pending_review')).not.toBeInTheDocument();
});

it('Affiche la date de soumission', () => {
  render(
    <MemoryRouter>
      <MovieRow data={data} />
    </MemoryRouter>
  );

  expect(screen.getByText('20/05/2026')).toBeInTheDocument();
});

it('Lie la ligne à la fiche admin du film', () => {
  render(
    <MemoryRouter>
      <MovieRow data={data} />
    </MemoryRouter>
  );

  expect(screen.getByRole('link')).toHaveAttribute(
    'href',
    '/admin/movies/12-slug'
  );
});
