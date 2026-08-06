import { Link } from 'react-router-dom';
import { FaArrowLeftLong } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import stars from '../../assets/stars.png';
import TopPageTwo from './TopPageTwo';
import TitlePage from './TitlePage';

// Coquille commune aux écrans d'authentification : accroche, titre, carte
// de formulaire, retour à l'accueil. Connexion et inscription du jury
// étaient deux copies du même balisage et divergeaient à chaque retouche.
function AuthLayout({ eyebrow, title, children, width = 'max-w-md' }) {
  const { t } = useTranslation();

  return (
    <div>
      <TopPageTwo />

      <section className="section">
        <div className={`mx-auto flex flex-col items-center ${width}`}>
          <div className="mb-4 flex items-center justify-center gap-3 text-accent">
            <img className="size-6" src={stars} alt="" />
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">
              {eyebrow}
            </p>
          </div>

          <TitlePage hasUnderline className="mb-10">
            {title}
          </TitlePage>

          {children}

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

export default AuthLayout;
