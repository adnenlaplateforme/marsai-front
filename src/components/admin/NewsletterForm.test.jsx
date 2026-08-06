import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import '../../config/i18n';
import NewsletterForm from './NewsletterForm';

const api = vi.fn();
vi.mock('../../hooks/useApi', () => ({ useApi: () => api }));

const onCreated = vi.fn();
const onClose = vi.fn();

function renderForm() {
  return render(<NewsletterForm onCreated={onCreated} onClose={onClose} />);
}

function set(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fill() {
  set('Objet', 'Le programme 2026');
  set('Contenu', 'Le festival ouvre ses portes le 15 mai.');
}

function submit() {
  return userEvent.click(
    screen.getByRole('button', { name: /Envoyer|Programmer/ })
  );
}

/** Le corps du dernier POST, tel que le serveur le recevrait. */
function postedBody() {
  const [, init] = api.mock.calls.find(([, init]) => init?.method === 'POST');
  return JSON.parse(init.body);
}

beforeEach(() => {
  api.mockReset();
  api.mockResolvedValue({ ok: true, json: async () => ({}) });
  onCreated.mockReset();
  onClose.mockReset();
});

/**
 * `sendAt: null` est ce qui déclenche l'envoi immédiat : `newsletterService.create`
 * ne poste les mails que sur cette valeur. L'omettre ferait entrer la campagne
 * dans la file du cron sans jamais en sortir — le schéma zod la ramène à `null`,
 * mais rien ne le garantit côté formulaire.
 */
it('poste un envoi immédiat avec une date nulle', async () => {
  renderForm();
  fill();
  await submit();

  expect(postedBody()).toEqual({
    object: 'Le programme 2026',
    content: 'Le festival ouvre ses portes le 15 mai.',
    sendAt: null,
  });
});

it('poste la date choisie quand l’envoi est programmé', async () => {
  const user = userEvent.setup();
  renderForm();
  fill();
  await user.click(screen.getByLabelText(/Programmer l'envoi/));
  set("Date et heure d'envoi", '2099-05-15T10:00');
  await submit();

  // Saisie en heure locale, transmise en UTC : le serveur compare `send_at` à
  // son propre NOW(), et une heure sans fuseau se lirait chez lui comme la
  // sienne.
  expect(postedBody().sendAt).toBe(new Date('2099-05-15T10:00').toISOString());
});

it('prévient l’envoi et referme sur un succès', async () => {
  renderForm();
  fill();
  await submit();

  expect(onCreated).toHaveBeenCalled();
});

/**
 * L'ancien formulaire ne disait rien d'un POST refusé : la modale restait
 * ouverte, le bouton reprenait son libellé, et l'admin croyait la campagne
 * partie.
 */
it('affiche l’échec du serveur sans refermer', async () => {
  api.mockResolvedValue({
    ok: false,
    status: 500,
    json: async () => ({ message: 'Data too long for column object' }),
  });
  renderForm();
  fill();
  await submit();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    /Data too long for column object/
  );
  expect(onCreated).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Objet')).toBeInTheDocument();
});

it('se rabat sur un message générique quand le serveur n’en donne aucun', async () => {
  api.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
  renderForm();
  fill();
  await submit();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    /L'envoi a échoué/
  );
});

it('exige un objet et un contenu', async () => {
  renderForm();
  await submit();

  expect(
    await screen.findByText(/L'objet est obligatoire/)
  ).toBeInTheDocument();
  expect(screen.getByText(/Le contenu est obligatoire/)).toBeInTheDocument();
  expect(api).not.toHaveBeenCalled();
});

/**
 * `newsletter.object` est un `VARCHAR(100)` et `NewsletterRequestSchema` ne pose
 * aucune borne : au-delà, MySQL refuse l'insertion en mode strict et la route
 * répond 500. La limite se dit ici, pendant la frappe.
 */
it('refuse un objet de plus de 100 caractères', async () => {
  renderForm();
  set('Objet', 'a'.repeat(101));
  set('Contenu', 'Bonjour');
  await submit();

  expect(
    await screen.findByText(/ne peut pas dépasser 100 caractères/)
  ).toBeInTheDocument();
  expect(api).not.toHaveBeenCalled();
});

it('refuse une date d’envoi déjà passée', async () => {
  const user = userEvent.setup();
  renderForm();
  fill();
  await user.click(screen.getByLabelText(/Programmer l'envoi/));
  set("Date et heure d'envoi", '2020-01-01T10:00');
  await submit();

  expect(
    await screen.findByText(/Impossible de programmer un envoi dans le passé/)
  ).toBeInTheDocument();
  expect(api).not.toHaveBeenCalled();
});

it('demande une date dès que l’envoi est programmé', async () => {
  const user = userEvent.setup();
  renderForm();
  fill();
  await user.click(screen.getByLabelText(/Programmer l'envoi/));
  await submit();

  expect(
    await screen.findByText(/Choisissez une date et une heure/)
  ).toBeInTheDocument();
  expect(api).not.toHaveBeenCalled();
});
