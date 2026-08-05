import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import '../config/i18n';
import Workshops from './Workshops';

const atelier = {
  id: 7,
  slug: 'masterclass-prompt',
  title: 'Masterclass prompt',
  description: 'Cohérence temporelle.',
  date: '2099-05-15T10:00:00',
  remaining_seats: 8,
};

function renderWorkshops(data) {
  return render(
    <MemoryRouter>
      <Workshops data={data} loading={false} error={null} />
    </MemoryRouter>
  );
}

/**
 * Le lien porte l'identifiant parce que c'est lui, et lui seul, que la page de
 * réservation sait envoyer à l'API. Réduit au slug, il ne lui laissait rien
 * d'exploitable : la réservation publique était cassée de bout en bout, sur
 * chaque atelier du programme.
 */
it("mène à la réservation par l'identifiant suivi du slug", () => {
  renderWorkshops([atelier]);

  expect(screen.getByRole('link')).toHaveAttribute(
    'href',
    '/events/7-masterclass-prompt'
  );
});
