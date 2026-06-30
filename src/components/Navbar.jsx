import { useContext, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import marsaiLogo from '../assets/marsai-logo.svg';
import marsaiLogoDark from '../assets/marsai-logo-dark.svg';
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
  const navbarData = {
    logo: {
      src: marsaiLogo,
      alt: 'logo marsai',
    },
    logo_dark: {
      src: marsaiLogoDark,
      alt: 'logo marsai dark',
    },
  };
  const navbarToggleHandler = () => {
    setNavbarOpen(!navbarOpen);
  };

  const handleStickyNavbar = () => {
    if (window.scrollY >= 80) {
      setSticky(true);
    } else {
      setSticky(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await api('/auth/logout');
      if (res && res.ok) {
        logout();
        navigate('/');
      }
    } catch (e) {
      console.error('error: ', e);
    }
  }


  useEffect(() => {
    window.addEventListener('scroll', handleStickyNavbar);
  });

  return (
    <>
      <div
        className={`z-40 flex w-full items-center  py-4 lg:py-2 ${sticky
          ? 'fixed top-0 bg-opacity-0 shadow-sticky backdrop-blur-lg bg-[rgba(3,3,3,0.4)] transition duration-300'
          : `absolute bg-transparent`
          }`}
      >
        <div className="relative flex-1 flex items-center justify-between px-4 lg:px-24">
          <Logo src={navbarData.logo.src} alt={navbarData.logo.alt} />
          <button
            onClick={navbarToggleHandler}
            id="navbarToggler"
            aria-label="Mobile Menu"
            className={`absolute right-2 top-1/2 block translate-y-[-50%] rounded-lg px-3 py-1.5  focus:ring-2  ring-white lg:hidden`}
          >
            <span
              className={`relative my-1.5 block h-0.5 w-7.5 bg-white transition-all duration-300 ${navbarOpen ? ' top-1.75 rotate-45' : ' '
                }`}
            />
            <span
              className={`relative my-1.5 block h-0.5 w-7.5 bg-white transition-all duration-300 ${navbarOpen ? 'opacity-0 ' : ' '
                }`}
            />
            <span
              className={`relative my-1.5 block h-0.5 w-7.5 bg-white transition-all duration-300 ${navbarOpen ? ' -top-2 -rotate-45' : ' '
                }`}
            />
          </button>
          <nav
            id="navbarCollapse"
            className={`navbar absolute left-0 right-0 z-30 w-full bg-primary px-6 py-4 duration-300 lg:visible lg:static lg:w-auto lg:border-none lg:!bg-transparent lg:p-0 lg:opacity-100 ${navbarOpen
              ? 'visibility top-[150%] opacity-100'
              : 'invisible top-[260%] opacity-0'
              }`}
          >
            <ul className="block items-center lg:flex lg:space-x-12">

              <li className={`group relative text-white`}>
                <NavLink
                  to='/'
                  className="flex py-2 text-xl group-hover:opacity-70 lg:mr-0 lg:inline-flex lg:px-0 lg:py-4 lg:text-sm"
                  onClick={() => navbarToggleHandler(false)}
                >
                  {t('navbar.home')}
                </NavLink>
              </li>

              <li className={`group relative text-white`}>
                <NavLink
                  to='/movies'
                  className="flex py-2 text-xl group-hover:opacity-70 lg:mr-0 lg:inline-flex lg:px-0 lg:py-4 lg:text-sm"
                  onClick={() => navbarToggleHandler(false)}
                >
                  {t('navbar.gallery')}
                </NavLink>
              </li>

              <li className={`group relative text-white`}>
                <NavLink
                  to='/events'
                  className="flex py-2 text-xl group-hover:opacity-70 lg:mr-0 lg:inline-flex lg:px-0 lg:py-4 lg:text-sm"
                  onClick={() => navbarToggleHandler(false)}
                >
                  {t('navbar.programmeInfo')}
                </NavLink>
              </li>

              <li className={`group relative text-white`}>
                <NavLink
                  to='/jury'
                  className="flex py-2 text-xl group-hover:opacity-70 lg:mr-0 lg:inline-flex lg:px-0 lg:py-4 lg:text-sm"
                  onClick={() => navbarToggleHandler(false)}
                >
                  {t('navbar.jury')}
                </NavLink>
              </li>

              {isJury && (
                <li className={`group relative text-white`}>
                  <NavLink
                    to='/jury/dashboard'
                    className="flex py-2 text-xl group-hover:opacity-70 lg:mr-0 lg:inline-flex lg:px-0 lg:py-4 lg:text-sm"
                    onClick={() => navbarToggleHandler(false)}
                  >
                    Mon espace jury
                  </NavLink>
                </li>
              )}


              {isAdmin ?
                <li className={`group relative text-white`}>
                  <NavLink
                    to='/admin'
                    className="flex py-2 text-xl group-hover:opacity-70 lg:mr-0 lg:inline-flex lg:px-0 lg:py-4 lg:text-sm"
                    onClick={() => navbarToggleHandler(false)}
                  >
                    {t('navbar.admin')}
                  </NavLink>
                </li> : <></>
              }
              {
                isLoggedIn ? <p className="text-white" onClick={handleLogout}>{t('navbar.logout')}</p> :
                  <NavLink
                    to='/login'
                    className="text-white flex py-2 text-xl group-hover:opacity-70 lg:mr-0 lg:inline-flex lg:px-0 lg:py-4 lg:text-sm"
                    onClick={() => navbarToggleHandler(false)}
                  >
                    {t('navbar.login')}
                  </NavLink>
              }
            </ul>
          </nav>
          <div className="flex gap-4 items-center mr-16 lg:mr-0 lg:gap-8">
            <PrimaryButton to="/submit" className="py-1 text-sm">
              {t('submit')}
            </PrimaryButton>
            <div role="menu" className="flex gap-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      <Toaster
        containerClassName="text-center"
        position="top-center"
        reverseOrder={false}
      />
    </>
  );
}
export default Navbar;
