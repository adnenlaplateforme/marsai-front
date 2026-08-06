import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiPlus } from 'react-icons/bi';
import { FiClock, FiSend } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';
import NewsletterForm from './NewsletterForm';
import NewsletterCard from './base/NewsletterCard';
import NewsletterDialog from './base/NewsletterDialog';
import { newsletterStats, sortNewsletters } from './base/newsletterStatus';

/**
 * Les campagnes envoyées aux abonnés, vues de l'administration.
 *
 * `GET /newsletters` sert la table brute : pas d'`ORDER BY`, pas d'état
 * calculé, `sent` en 0/1. La page en fait un journal — la dernière campagne en
 * tête — et `base/newsletterStatus.js` porte la lecture de ces colonnes.
 */
function Newsletter() {
  const { t } = useTranslation();
  const target = 'admin.newsletterManager.';
  const api = useApi();

  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openedId, setOpenedId] = useState(null);
  const [isComposing, setIsComposing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api('/newsletters');

      // `useApi` rend null quand la session est morte : il a déjà déconnecté,
      // afficher une erreur de plus ne dirait rien à personne.
      if (!res) return;

      if (!res.ok) {
        setError(t(target + 'error'));
        return;
      }

      setNewsletters(await res.json());
      setError(null);
    } catch (e) {
      console.error('newsletter manager error: ', e);
      setError(t(target + 'error'));
    } finally {
      setLoading(false);
    }
  }, [api, t]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => sortNewsletters(newsletters), [newsletters]);
  const stats = useMemo(() => newsletterStats(newsletters), [newsletters]);
  // La campagne ouverte se relit dans la liste plutôt que de se figer dans
  // l'état : après un envoi, la liste relue porte le statut posé par le serveur.
  const opened = sorted.find(newsletter => newsletter.id === openedId);

  return (
    <div className="p-4 md:p-6 space-y-5 text-white">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            {t(target + 'overline')}
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase mt-2">
            {t(target + 'title')}
          </h1>
          <p className="text-neutral-400 mt-2">{t(target + 'subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsComposing(true)}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-accent/90 hover:bg-accent text-sm font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors"
        >
          {t(target + 'compose')}
          <BiPlus className="size-5" />
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm"
        >
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-16 text-neutral-300">
          <p className="text-sm">{t(target + 'loading')}</p>
          <AiOutlineLoading3Quarters className="animate-spin size-10" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <StatCard
              icon={<FiSend className="size-7" />}
              iconClass="bg-primary text-neutral-200"
              label={t(target + 'stats.sent')}
              value={stats.sent}
              hint={t(target + 'stats.sentHint', {
                count: newsletters.length,
              })}
            />
            <StatCard
              icon={<FiClock className="size-7" />}
              iconClass="bg-accent/10 text-accent"
              label={t(target + 'stats.scheduled')}
              value={stats.scheduled}
              hint={
                stats.scheduled > 0
                  ? t(target + 'stats.scheduledHint', {
                      count: stats.scheduled,
                    })
                  : t(target + 'stats.noScheduled')
              }
            />
          </div>

          {sorted.length === 0 ? (
            <p className="bg-secondary border border-white/10 rounded-xl text-center text-neutral-500 text-sm py-10">
              {t(target + 'empty')}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map(newsletter => (
                <NewsletterCard
                  key={newsletter.id}
                  newsletter={newsletter}
                  onOpen={() => setOpenedId(newsletter.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {opened && (
        <NewsletterDialog
          newsletter={opened}
          onClose={() => setOpenedId(null)}
        />
      )}

      {isComposing && (
        <NewsletterForm
          onCreated={() => {
            setIsComposing(false);
            load();
          }}
          onClose={() => setIsComposing(false)}
        />
      )}
    </div>
  );
}

function StatCard({ icon, iconClass, label, value, hint }) {
  return (
    <div className="flex items-center gap-4 bg-secondary border border-white/10 rounded-xl p-4 md:p-5">
      <div
        className={`flex items-center justify-center size-16 rounded-2xl flex-shrink-0 ${iconClass}`}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          {label}
        </p>
        <p className="text-3xl md:text-4xl font-extrabold tabular-nums my-0.5">
          {value}
        </p>
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          {hint}
        </p>
      </div>
    </div>
  );
}

export default Newsletter;
