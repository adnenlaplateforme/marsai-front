import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import '../config/i18n';
import EventBookingPage from './EventBookingPage';

const api = vi.fn();
vi.mock('../hooks/useApi', () => ({ useApi: () => api }));

const event = {
  id: 7,
  slug: 'masterclass-prompt',
  title: 'Masterclass prompt',
  description: 'Cohérence temporelle.',
  lang: 'FR',
};

function renderPage(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/events/:idSlug" element={<EventBookingPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.mockReset();
});

/**
 * Aucune route de l'API ne connaît un slug : `/events/:id` n'accepte qu'un
 * identifiant numérique, sa garde `parseId` rejetant toute autre chaîne en 400.
 * Le slug est décoratif et ne vit que dans l'URL du front, comme sur
 * `/movies/:idSlug`.
 */
it("lit l'atelier par l'identifiant en tête de l'URL, dans la langue courante", async () => {
  api.mockResolvedValue({ ok: true, json: async () => event });

  renderPage('/events/7-masterclass-prompt');

  await waitFor(() => expect(api).toHaveBeenCalledWith('/events/7?lang=FR'));
  expect(await screen.findByText('Masterclass prompt')).toBeInTheDocument();
});

/**
 * Le slug se dérive du titre, et rien n'interdit à un atelier de s'appeler
 * « Montage 2026 avec IA » : le slug porte alors ses propres tirets et ses
 * propres chiffres. Seul le premier segment est l'identifiant.
 */
it('ne retient que le premier segment, quel que soit le slug', async () => {
  api.mockResolvedValue({ ok: true, json: async () => event });

  renderPage('/events/12-montage-2026-avec-ia');

  await waitFor(() => expect(api).toHaveBeenCalledWith('/events/12?lang=FR'));
});
