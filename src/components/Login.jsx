import { useForm } from 'react-hook-form';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineEnvelope, HiOutlineLockClosed } from 'react-icons/hi2';
import { MdOutlineReportGmailerrorred } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import AuthLayout from './base/AuthLayout';
import AuthField from './base/AuthField';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login } = useContext(AuthContext);

  async function onSubmit(data) {
    setError(null);
    try {
      const res = await fetch(
        import.meta.env.VITE_SERVER_ADDRESS + '/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          credentials: 'include',
        }
      );
      if (res.ok) {
        const user = await res.json();
        login(user);
        navigate('/');
      } else {
        setError(t('login.errors.invalidCredentials'));
      }
    } catch (e) {
      console.error('error: ', e);
      setError(t('login.errors.default'));
    }
  }

  return (
    <AuthLayout eyebrow={t('login.subTitle')} title={t('login.title')}>
      <form
        className="flex w-full flex-col gap-6 rounded-2xl bg-primary p-6 ring-1 ring-white/5 sm:p-8"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-400 ring-1 ring-red-500/30"
          >
            <MdOutlineReportGmailerrorred size={20} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <AuthField
          id="email"
          type="email"
          label={t('login.emailLabel')}
          icon={HiOutlineEnvelope}
          autoComplete="email"
          placeholder="email@example.com"
          error={errors.email?.message}
          field={register('email', {
            required: t('login.errors.emailRequired'),
          })}
        />

        <AuthField
          id="password"
          type="password"
          label={t('login.passwordLabel')}
          icon={HiOutlineLockClosed}
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          field={register('password', {
            required: t('login.errors.passwordRequired'),
          })}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-14 rounded-xl bg-accent font-bold uppercase tracking-wide text-white transition-colors duration-200 hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t('login.submitting') : t('login.submitBtn')}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Login;
