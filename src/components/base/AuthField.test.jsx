import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { expect, it } from 'vitest';
import '../../config/i18n';
import AuthField from './AuthField';

function Harness(props) {
  const { register } = useForm();
  return (
    <AuthField
      id="password"
      type="password"
      label="Mot de passe"
      field={register('password')}
      {...props}
    />
  );
}

/**
 * La bascule vit dans AuthField et non chez l'appelant : les deux écrans
 * d'authentification l'obtiennent en posant type="password", sans dupliquer
 * l'état ni les libellés d'accessibilité.
 */
it('bascule le champ mot de passe entre masqué et visible', async () => {
  const user = userEvent.setup();
  render(<Harness />);

  const input = screen.getByLabelText('Mot de passe');
  expect(input).toHaveAttribute('type', 'password');

  await user.click(screen.getByRole('button', { name: /afficher/i }));
  expect(input).toHaveAttribute('type', 'text');

  await user.click(screen.getByRole('button', { name: /masquer/i }));
  expect(input).toHaveAttribute('type', 'password');
});

/**
 * register() renvoie une ref que react-hook-form doit poser sur l'input
 * natif. Elle est étalée dans AuthField même, pas passée de composant en
 * composant : si elle n'arrivait pas, la saisie ne serait jamais collectée.
 */
it("transmet la saisie au formulaire par la ref de register()", async () => {
  const user = userEvent.setup();
  render(<Harness type="text" label="Prénom" id="firstname" />);

  const input = screen.getByLabelText('Prénom');
  await user.type(input, 'Camille');

  expect(input).toHaveValue('Camille');
});

it("signale l'erreur au champ et l'affiche", () => {
  render(<Harness error="Le mot de passe est requis" />);

  expect(screen.getByLabelText('Mot de passe')).toHaveAttribute(
    'aria-invalid',
    'true'
  );
  expect(screen.getByText('Le mot de passe est requis')).toBeInTheDocument();
});
