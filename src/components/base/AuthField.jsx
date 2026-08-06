import { useState } from 'react';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';

// Champ des écrans d'authentification : libellé, cadre, icône, message
// d'erreur. `type="password"` suffit à obtenir la bascule d'affichage, sans
// que l'appelant ait à gérer son état.
//
// `field` reçoit le retour de register() de react-hook-form et est étalé
// directement sur l'input : la ref atterrit sur l'élément natif, sans
// traverser ce composant.
function AuthField({
  id,
  label,
  icon: Icon,
  error,
  field,
  type = 'text',
  ...inputProps
}) {
  const { t } = useTranslation();
  const [shown, setShown] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="flex flex-col gap-2">
      <label
        className="text-xs font-bold uppercase tracking-wider text-dark"
        htmlFor={id}
      >
        {label}
      </label>

      <div className="flex h-14 items-center gap-3 rounded-xl bg-secondary px-4 text-white outline-1 outline-white/10 focus-within:outline-2 focus-within:outline-accent">
        {Icon && <Icon size={22} className="shrink-0 text-dark" />}

        <input
          id={id}
          type={isPassword && shown ? 'text' : type}
          aria-invalid={error ? 'true' : 'false'}
          className="w-full outline-0 placeholder:text-dark disabled:cursor-not-allowed disabled:text-dark"
          {...inputProps}
          {...field}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShown(visible => !visible)}
            aria-label={t(shown ? 'login.hidePassword' : 'login.showPassword')}
            className="shrink-0 text-dark transition-colors hover:text-white"
          >
            {shown ? (
              <HiOutlineEyeSlash size={22} />
            ) : (
              <HiOutlineEye size={22} />
            )}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default AuthField;
