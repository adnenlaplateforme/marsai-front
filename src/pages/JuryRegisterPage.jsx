import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineEnvelope, HiOutlineLockClosed } from 'react-icons/hi2';
import { MdOutlineReportGmailerrorred } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../components/base/AuthLayout';
import AuthField from '../components/base/AuthField';
import { useApi } from '../hooks/useApi';

function JuryRegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const api = useApi();
  const [email, setEmail] = useState('');
  const token = useParams().token;

  if (!token) {
    console.error('No token param');
    navigate('/', { replace: true });
  }

  async function onSubmit(data) {
    setError(null);
    const res = await api('/juries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, token }),
    });
    if (res) {
      if (res.ok) {
        navigate('/login', { replace: true });
      } else {
        const body = await res.json();
        console.error('errors: ', body.errors);
        setError(body.message);
      }
    }
  }

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await api('/jury-invites/' + token);
        const body = await res.json();
        if (res.ok) {
          setEmail(body.email);
        } else {
          console.error('Fetch invite error', body);
          navigate('/', { replace: true });
        }
      } catch (e) {
        console.error('Failed to fetch invite, ', e);
      }
    };
    fetchInvite();
  }, []);

  return (
    <AuthLayout
      eyebrow={t('register.subTitle')}
      title={t('register.title')}
      width="max-w-lg"
    >
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

        {/* L'e-mail vient de l'invitation : affiché pour situer le compte,
            jamais modifiable. */}
        <AuthField
          id="email"
          type="email"
          label={t('login.emailLabel')}
          icon={HiOutlineEnvelope}
          value={email}
          readOnly
          disabled
        />

        <div className="flex flex-col gap-6 md:flex-row md:gap-4">
          <div className="flex-1">
            <AuthField
              id="firstname"
              label={t('register.firstname')}
              autoComplete="given-name"
              placeholder={t('register.firstnamePlaceholder')}
              error={errors.firstname?.message}
              field={register('firstname', {
                required: t('register.errors.firstnameRequired'),
              })}
            />
          </div>
          <div className="flex-1">
            <AuthField
              id="lastname"
              label={t('register.lastname')}
              autoComplete="family-name"
              placeholder={t('register.lastnamePlaceholder')}
              error={errors.lastname?.message}
              field={register('lastname', {
                required: t('register.errors.lastnameRequired'),
              })}
            />
          </div>
        </div>

        <AuthField
          id="password"
          type="password"
          label={t('login.passwordLabel')}
          icon={HiOutlineLockClosed}
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.password?.message}
          field={register('password', {
            required: t('register.errors.passwordRequired'),
          })}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-14 rounded-xl bg-accent font-bold uppercase tracking-wide text-white transition-colors duration-200 hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t('register.submitting') : t('register.submitBtn')}
        </button>
      </form>
    </AuthLayout>
  );
}

export default JuryRegisterPage;
