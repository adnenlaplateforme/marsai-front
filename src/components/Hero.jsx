import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import PrimaryButton from './base/PrimaryButton';

function Hero() {
  const { t } = useTranslation();
  const target = 'home.hero.';

  return (
    <section className="relative isolate flex min-h-[30rem] items-center overflow-hidden bg-black bg-[url(/src/assets/banner-mobile.png)] md:bg-[url(/src/assets/banner.png)] bg-no-repeat bg-cover bg-center px-4 pt-28 pb-16 text-white md:min-h-[34rem] md:pt-32 lg:min-h-[38rem] lg:pb-24">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-secondary"
      />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
        <h1 className="hero-rise text-balance tracking-tight text-white">
          <Trans
            i18nKey={target + 'title'}
            components={[<strong key="highlight" className="text-accent" />]}
          />
        </h1>
        <p className="hero-rise [animation-delay:120ms] max-w-xl text-pretty pb-8 text-base text-white/80 md:text-lg">
          {t(target + 'subtitle')}
        </p>
        <div className="hero-rise [animation-delay:240ms] flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <PrimaryButton
            to="/submit"
            hasIcon={true}
            className="shadow-lg shadow-accent/25"
          >
            {t(target + 'ctaParticipate')}
          </PrimaryButton>
          <Link
            to="/events"
            className="button inline-flex items-center gap-2 text-black bg-white transition-colors duration-200 hover:bg-white/85"
          >
            <Trans
              i18nKey={target + 'ctaLearn_more'}
              components={[<strong key="highlight" className="text-accent" />]}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
export default Hero;
