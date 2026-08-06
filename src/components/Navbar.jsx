import { useContext, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import marsaiLogo from '../assets/marsai-logo.svg';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import PrimaryButton from './base/PrimaryButton';
import { Toaster } from 'react-hot-toast';
import { useApi } from '../hooks/useApi';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn, isJury, isAdmin, logout } = useContext(AuthContext);
  const api = useApi();

  // `end` sur les routes qui en préfixent d'autres : sans ça « Accueil » reste
  // actif partout, et « Jury » s'allume aussi sur /jury/dashboard.
  const links = [
    { to: '/', label: t('navbar.home'), end: true },
    { to: '/movies', label: t('navbar.gallery') },
    { to: '/events', label: t('navbar.programmeInfo') },
    { to: '/jury', label: t('navbar.jury'), end: true },
    ...(isJury
      ? [{ to: '/jury/dashboard', label: t('navbar.jurySpace') }]
      : []),
    ...(isAdmin ? [{ to: '/admin', label: t('navbar.admin') }] : []),
  ];

  const closeNavbar = () => setNavbarOpen(false);

  const handleLogout = async () => {
    try {
      const res = await api('/auth/logout');
      if (res && res.ok) {
        logout();
        closeNavbar();
        navigate('/');
      }
    } catch (e) {
      console.error('error: ', e);
    }
  };

  useEffect(() => {
    const handleStickyNavbar = () => setSticky(window.scrollY >= 80);
    handleStickyNavbar();
    window.addEventListener('scroll', handleStickyNavbar, { passive: true });
    return () => window.removeEventListener('scroll', handleStickyNavbar);
  }, []);

  // text-sm + py-2 sur desktop cale les liens sur la hauteur du CTA (36px),
  // ce qui fixe la navbar à 68px — la valeur que les pages réservent.
  const linkClass =
    'flex py-3 text-base font-medium tracking-wide lg:inline-flex lg:px-0 lg:py-2 lg:text-sm';

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 lg:px-6 lg:pt-4">
        <div
          className={`relative mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl border px-3 py-2 transition-colors duration-300 lg:px-6 ${
            sticky
              ? 'border-white/10 bg-[rgba(3,3,3,0.55)] shadow-lg shadow-black/30 backdrop-blur-lg'
              : 'border-transparent bg-transparent'
          }`}
        >
          <Logo src={marsaiLogo} alt="logo marsai" />

          <nav
            id="navbarCollapse"
            className={`absolute inset-x-0 top-full z-30 mt-2 rounded-2xl border border-white/10 bg-[rgba(3,3,3,0.92)] p-4 backdrop-blur-lg transition-all duration-300 lg:static lg:mt-0 lg:w-auto lg:translate-y-0 lg:border-none lg:bg-transparent lg:p-0 lg:opacity-100 lg:backdrop-blur-none ${
              navbarOpen
                ? 'visible translate-y-0 opacity-100'
                : 'invisible -translate-y-2 opacity-0 lg:visible'
            }`}
          >
            <ul className="block lg:flex lg:items-center lg:gap-8">
              {links.map(link => (
                <li
                  key={link.to}
                  className="group relative text-white/85 transition-colors hover:text-white"
                >
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={linkClass}
                    onClick={closeNavbar}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}

              <li className="text-white/85 transition-colors hover:text-white">
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={linkClass}
                  >
                    {t('navbar.logout')}
                  </button>
                ) : (
                  <NavLink
                    to="/login"
                    className={linkClass}
                    onClick={closeNavbar}
                  >
                    {t('navbar.login')}
                  </NavLink>
                )}
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-3 lg:gap-5">
            <span
              aria-hidden="true"
              className="hidden h-5 w-px bg-white/15 lg:block"
            />
            <LanguageSwitcher />
            <PrimaryButton
              to="/submit"
              hasIcon={false}
              className="text-sm font-semibold tracking-wide"
            >
              {t('submit')}
            </PrimaryButton>
            <button
              onClick={() => setNavbarOpen(open => !open)}
              id="navbarToggler"
              aria-label="Mobile Menu"
              aria-expanded={navbarOpen}
              aria-controls="navbarCollapse"
              className="flex size-10 flex-col items-center justify-center gap-1.5 rounded-lg ring-white focus:ring-2 lg:hidden"
            >
              <span
                className={`block h-0.5 w-6 bg-white transition-all duration-300 ${
                  navbarOpen ? 'translate-y-2 rotate-45' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-6 bg-white transition-all duration-300 ${
                  navbarOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-6 bg-white transition-all duration-300 ${
                  navbarOpen ? '-translate-y-2 -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      <Toaster
        containerClassName="text-center"
        position="top-center"
        reverseOrder={false}
      />
    </>
  );
}
export default Navbar;
