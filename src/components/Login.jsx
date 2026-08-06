import stars from '../assets/stars.png';
import { useForm } from 'react-hook-form';
import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from 'react-icons/hi2';
import { FaArrowLeftLong } from 'react-icons/fa6';
import { MdOutlineReportGmailerrorred } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import TopPageTwo from './base/TopPageTwo';
import TitlePage from './base/TitlePage';
import { AuthContext } from '../context/AuthContext';

const FIELD =
  'flex items-center gap-3 h-14 px-4 rounded-xl bg-secondary text-white outline-1 outline-white/10 focus-within:outline-2 focus-within:outline-accent';

function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
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
    <div>
      <TopPageTwo />

      <section className="section">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <div className="mb-4 flex items-center justify-center gap-3 text-accent">
            <img className="size-6" src={stars} alt="" />
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">
              {t('login.subTitle')}
            </p>
          </div>

          <TitlePage hasUnderline className="mb-10">
            {t('login.title')}
          </TitlePage>

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

            <div className="flex flex-col gap-2">
              <label
                className="text-xs font-bold uppercase tracking-wider text-dark"
                htmlFor="email"
              >
                {t('login.emailLabel')}
              </label>
              <div className={FIELD}>
                <HiOutlineEnvelope size={22} className="shrink-0 text-dark" />
                <input
                  className="w-full outline-0 placeholder:text-dark"
                  type="email"
                  id="email"
                  autoComplete="email"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  placeholder="email@example.com"
                  {...register('email', {
                    required: t('login.errors.emailRequired'),
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-xs font-bold uppercase tracking-wider text-dark"
                htmlFor="password"
              >
                {t('login.passwordLabel')}
              </label>
              <div className={FIELD}>
                <HiOutlineLockClosed size={22} className="shrink-0 text-dark" />
                <input
                  className="w-full outline-0 placeholder:text-dark"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  placeholder="••••••••"
                  {...register('password', {
                    required: t('login.errors.passwordRequired'),
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(shown => !shown)}
                  aria-label={t(
                    showPassword ? 'login.hidePassword' : 'login.showPassword'
                  )}
                  className="shrink-0 text-dark transition-colors hover:text-white"
                >
                  {showPassword ? (
                    <HiOutlineEyeSlash size={22} />
                  ) : (
                    <HiOutlineEye size={22} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-14 rounded-xl bg-accent font-bold uppercase tracking-wide text-white transition-colors duration-200 hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t('login.submitting') : t('login.submitBtn')}
            </button>
          </form>

          <Link
            to="/"
            className="mt-8 flex items-center gap-2 text-sm uppercase tracking-wider text-dark transition-colors hover:text-white"
          >
            <FaArrowLeftLong />
            {t('login.backBtn')}
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Login;
