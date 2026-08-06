import { useTranslation } from 'react-i18next';
import flag_english from '../assets/united-kingdom.png';
import flag_french from '../assets/france.png';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isFrench = i18n.language === 'fr';

  const handleLanguageChange = () => {
    i18n.changeLanguage(isFrench ? 'en' : 'fr');
  };

  return (
    <button
      onClick={handleLanguageChange}
      aria-label={isFrench ? 'Switch to English' : 'Passer en français'}
      className="flex size-8 items-center justify-center rounded-full ring-1 ring-white/15 transition-colors hover:ring-white/40"
    >
      <img
        src={isFrench ? flag_english : flag_french}
        alt={isFrench ? 'English' : 'Français'}
        className="size-5 rounded-full object-cover"
      />
    </button>
  );
}
