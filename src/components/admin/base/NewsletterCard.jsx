import { useTranslation } from 'react-i18next';
import {
  formatDate,
  newsletterDate,
  newsletterStatus,
  STATUS_BADGE,
} from './newsletterStatus';

/**
 * Une campagne dans la grille de `/admin/newsletter`.
 *
 * La carte entière ouvre le contenu intégral : c'est un bouton et non un `div`
 * cliquable, pour que la lecture reste atteignable au clavier — l'admin qui
 * parcourt la liste à la tabulation doit pouvoir relire ce qui est parti.
 */
function NewsletterCard({ newsletter, onOpen }) {
  const { t, i18n } = useTranslation();
  const target = 'admin.newsletterManager.';

  const status = newsletterStatus(newsletter);
  const date = newsletterDate(newsletter);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t(target + 'card.open', { object: newsletter.object })}
      className="bg-secondary border border-white/10 rounded-xl p-5 flex flex-col text-left h-full hover:border-white/30 transition-colors cursor-pointer"
    >
      <div className="flex justify-between items-start gap-3 mb-3">
        <h3 className="text-lg font-bold leading-snug">{newsletter.object}</h3>
        <span
          className={`px-2.5 py-1 rounded-full border text-[0.65rem] font-bold uppercase tracking-wider whitespace-nowrap ${STATUS_BADGE[status]}`}
        >
          {t(target + 'status.' + status)}
        </span>
      </div>

      <p className="text-sm text-neutral-400 grow line-clamp-3 mb-5 whitespace-pre-wrap">
        {newsletter.content}
      </p>

      <p className="border-t border-white/10 pt-4 mt-auto w-full text-xs uppercase tracking-wider text-neutral-500">
        {date
          ? t(target + 'date.' + status, {
              date: formatDate(date, i18n.language),
            })
          : t(target + 'date.unknown')}
      </p>
    </button>
  );
}

export default NewsletterCard;
