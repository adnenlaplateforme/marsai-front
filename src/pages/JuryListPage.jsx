import { useTranslation } from 'react-i18next';
import { FaRegUser, FaQuoteLeft } from 'react-icons/fa';
import TopPageTwo from '../components/base/TopPageTwo';
import { president, members } from '../data/juryMembers';

function initials(name) {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('');
}

// Aplat + initiales tant qu'aucun portrait n'est fourni : mieux qu'une image
// cassée, et ça garde le gabarit des cartes stable.
function Portrait({ photo, name, className = '' }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        loading="lazy"
        className={`size-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex size-full items-center justify-center bg-gradient-to-br from-neutral-700 to-neutral-900 ${className}`}
    >
      <span className="text-5xl font-bold uppercase tracking-widest text-white/20">
        {initials(name)}
      </span>
    </div>
  );
}

function JuryListPage() {
  const { t } = useTranslation();
  const target = 'jury.';
  const criteria = t(target + 'charter.criteria', { returnObjects: true });

  return (
    <>
      <TopPageTwo />

      <section className="section text-white">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-3 text-accent">
            <FaRegUser />
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">
              {t(target + 'eyebrow')}
            </p>
          </div>

          <h1 className="pb-10 text-4xl font-semibold uppercase leading-tight md:text-6xl">
            {t(target + 'titleLine1')}
            <br />
            {t(target + 'titleLine2')}
            <br />
            <span className="text-accent">{t(target + 'titleLine3')}</span>
          </h1>

          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl md:aspect-[16/9]">
            <Portrait photo={president.photo} name={president.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-10">
              <p className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                {t(target + 'president.role')}
              </p>
              <p className="text-3xl font-bold uppercase md:text-4xl">
                {president.name}
              </p>
            </div>
          </div>

          <blockquote className="mt-8 rounded-3xl border border-white/10 p-6 md:p-10">
            <FaQuoteLeft className="mb-6 text-4xl text-accent" />
            <p className="text-lg leading-relaxed md:text-2xl">
              « {t(target + 'president.quote')} »
            </p>
            <footer className="mt-4 text-sm leading-relaxed text-dark">
              {t(target + 'president.bio')}
            </footer>
          </blockquote>

          <a
            href="#"
            className="button mt-8 inline-block bg-accent px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors duration-200 hover:bg-accent/90"
          >
            {t(target + 'president.cta')}
          </a>
        </div>
      </section>

      <section className="section bg-white text-primary">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="text-4xl font-semibold uppercase leading-tight md:text-5xl">
              {t(target + 'members.titleLine1')}
              <br />
              <span className="text-accent">
                {t(target + 'members.titleLine2')}
              </span>
            </h2>
            <p className="max-w-sm text-neutral-600 md:text-right">
              {t(target + 'members.intro')}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {members.map(member => (
              <article
                key={member.key}
                className="relative aspect-[3/4] overflow-hidden rounded-2xl"
              >
                <Portrait photo={member.photo} name={member.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="text-xs font-bold uppercase tracking-wider text-accent">
                    {t(`${target}members.${member.key}.role`)}
                  </p>
                  <p className="pb-2 text-2xl font-bold uppercase">
                    {member.name}
                  </p>
                  <p className="text-sm leading-snug text-white/80">
                    {t(`${target}members.${member.key}.text`)}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-16 rounded-3xl bg-primary p-8 text-white md:p-12">
            <h2 className="text-4xl font-semibold uppercase leading-tight md:text-5xl">
              {t(target + 'charter.titleLine1')}
              <br />
              <span className="text-accent">
                {t(target + 'charter.titleLine2')}
              </span>
            </h2>
            <p className="mb-10 mt-4 max-w-2xl text-sm leading-relaxed text-dark">
              {t(target + 'charter.intro')}
            </p>

            <ol className="flex flex-col gap-4">
              {criteria.map((criterion, index) => (
                <li
                  key={criterion.title}
                  className="flex items-center gap-6 rounded-2xl border border-white/10 p-4 md:p-6"
                >
                  <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-accent text-2xl font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="p-0 text-base uppercase tracking-wide lg:text-lg">
                      {criterion.title}
                    </h3>
                    <p className="text-sm text-dark">{criterion.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </>
  );
}

export default JuryListPage;
