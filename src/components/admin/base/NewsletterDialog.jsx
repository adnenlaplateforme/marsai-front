import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IoMdClose } from 'react-icons/io';
import {
  formatDate,
  newsletterDate,
  newsletterStatus,
  STATUS_BADGE,
} from './newsletterStatus';

/**
 * Le contenu intégral d'une campagne.
 *
 * La grille tronque à trois lignes ; ce qui est parti aux abonnés doit rester
 * relisable en entier — c'est la seule trace de ce qui a été écrit, aucune
 * route ne permet de rééditer une newsletter.
 */
function NewsletterDialog({ newsletter, onClose }) {
  const { t, i18n } = useTranslation();
  const target = 'admin.newsletterManager.';

  const status = newsletterStatus(newsletter);
  const date = newsletterDate(newsletter);

  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed left-0 top-0 h-full w-full flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm z-50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`newsletter-title-${newsletter.id}`}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-secondary border border-neutral-700 rounded-lg shadow-xl p-6 space-y-5"
      >
        <div className="flex justify-between items-start gap-4 border-b border-neutral-700 pb-4">
          <div className="space-y-2">
            <h3
              id={`newsletter-title-${newsletter.id}`}
              className="font-bold uppercase tracking-wide"
            >
              {newsletter.object}
            </h3>
            <span
              className={`inline-block px-2.5 py-1 rounded-full border text-[0.65rem] font-bold uppercase tracking-wider ${STATUS_BADGE[status]}`}
            >
              {t(target + 'status.' + status)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(target + 'dialog.close')}
            className="hover:text-accent transition-colors cursor-pointer"
          >
            <IoMdClose size={24} />
          </button>
        </div>

        <p className="overflow-y-auto grow text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
          {newsletter.content}
        </p>

        <p className="border-t border-white/10 pt-4 text-xs uppercase tracking-wider text-neutral-500">
          {date
            ? t(target + 'date.' + status, {
                date: formatDate(date, i18n.language),
              })
            : t(target + 'date.unknown')}
        </p>
      </div>
    </div>
  );
}

export default NewsletterDialog;
