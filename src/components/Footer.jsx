import { FaFacebookF, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import marsaiLogo from '../assets/marsai-logo.svg';
import Logo from './Logo';
import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks/useApi';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const socials = [
  {
    label: 'Facebook',
    Icon: FaFacebookF,
    href: '#',
    hover: 'hover:bg-[#1877F2]',
  },
  {
    label: 'Instagram',
    Icon: FaInstagram,
    href: '#',
    hover:
      'hover:bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fdf497_5%,#fd5949_45%,#d6249f_60%,#285AEB_90%)]',
  },
  { label: 'YouTube', Icon: FaYoutube, href: '#', hover: 'hover:bg-[#FF0000]' },
  { label: 'Twitter', Icon: FaTwitter, href: '#', hover: 'hover:bg-[#1DA1F2]' },
];

const legalLinks = ['legalNotice', 'press', 'contact'];

const Footer = () => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();
  const api = useApi();

  async function onSubmit(data) {
    try {
      const res = await api('/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res) {
        if (res.ok) {
          toast.success(t('footer.emailOk'));
          reset();
        } else {
          toast.error(t('footer.emailError'));
        }
      }
    } catch (e) {
      toast.error('Something went wrong: ' + e);
    }
  }

  return (
    <footer className="bg-primary text-white px-4 py-16 lg:py-20">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <Logo src={marsaiLogo} alt="logo marsai" />

            <p className="max-w-md text-sm leading-relaxed text-white/75">
              {t('footer.description')}
            </p>

            <div className="flex gap-3">
              {socials.map(({ label, Icon, href, hover }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className={`flex size-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 transition-colors duration-200 hover:ring-transparent ${hover}`}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div className="bg-secondary rounded-3xl p-8 md:p-10 text-center">
            <h2 className="mb-6 text-2xl font-bold uppercase tracking-wide">
              {t('footer.stayConnected')}
            </h2>
            <form
              className="mx-auto flex max-w-md items-center rounded-full bg-white p-1.5 focus-within:ring-2 focus-within:ring-accent/60"
              onSubmit={handleSubmit(onSubmit)}
            >
              <input
                type="email"
                placeholder={t('footer.emailPlaceholder')}
                className="w-full grow px-4 text-sm text-primary outline-none placeholder:text-neutral-400"
                {...register('email', { required: true })}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors duration-200 hover:bg-accent/90 disabled:opacity-60"
              >
                {t('footer.subscribe')}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs font-bold uppercase tracking-wider text-white/50 md:flex-row">
          <div className="flex gap-8">
            {legalLinks.map(key => (
              <a
                key={key}
                href="#"
                className="transition-colors hover:text-white"
              >
                {t('footer.' + key)}
              </a>
            ))}
          </div>

          <div>{t('footer.copyright', { year: new Date().getFullYear() })}</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
