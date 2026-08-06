import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { IoMdClose } from 'react-icons/io';
import { useApi } from '../../hooks/useApi';

/**
 * La composition d'une campagne.
 *
 * `POST /newsletters` n'a que deux comportements : `sendAt: null` poste les
 * mails dans la foulée de la requête, une date les confie au cron. Le formulaire
 * n'expose donc qu'une case à cocher — mais l'écart entre les deux est celui
 * d'un envoi irrévocable et d'un envoi qu'on peut encore devancer.
 */
function NewsletterForm({ onCreated, onClose }) {
  const { t } = useTranslation();
  const target = 'admin.newsletterManager.form.';
  const api = useApi();

  // L'échec du serveur, `null` tant qu'il n'y en a pas. L'ancien formulaire
  // n'en montrait aucun : la modale restait ouverte, le bouton reprenait son
  // libellé, et l'admin croyait la campagne partie.
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { object: '', content: '', isScheduled: false, sendAt: '' },
  });

  // `useWatch` et non `watch()` : celui-ci rend une fonction, que le compilateur
  // React refuse de mémoïser — il abandonne alors la compilation du composant
  // entier (`react-hooks/incompatible-library`).
  const isScheduled = useWatch({ control, name: 'isScheduled' });

  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const onSubmit = async data => {
    setError(null);

    try {
      const res = await api('/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object: data.object,
          content: data.content,
          // La saisie est en heure locale et part en UTC : le serveur compare
          // `send_at` à son propre NOW(), et une heure sans fuseau se lirait
          // chez lui comme la sienne.
          sendAt: data.isScheduled ? new Date(data.sendAt).toISOString() : null,
        }),
      });

      // `useApi` rend null quand la session est morte : il a déjà déconnecté.
      if (!res) return;

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || t(target + 'error'));
        return;
      }

      onCreated();
    } catch (e) {
      console.error('newsletter create error: ', e);
      setError(t(target + 'error'));
    }
  };

  return (
    <div
      className="fixed left-0 top-0 h-full w-full flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm z-50 p-4"
      onClick={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="newsletter-form-title"
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-y-auto bg-secondary border border-neutral-700 rounded-lg shadow-xl p-6 space-y-5"
      >
        <div className="flex justify-between items-center gap-4 border-b border-neutral-700 pb-4">
          <h3
            id="newsletter-form-title"
            className="font-bold uppercase tracking-wide"
          >
            {t(target + 'title')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(target + 'cancel')}
            className="hover:text-accent transition-colors cursor-pointer"
          >
            <IoMdClose size={24} />
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3"
          >
            {error}
          </p>
        )}

        <div>
          <label htmlFor="newsletter-object" className={labelClass}>
            {t(target + 'object')}
          </label>
          <input
            id="newsletter-object"
            autoFocus
            // `newsletter.object` est un VARCHAR(100) et le schéma zod ne pose
            // aucune borne : au-delà, MySQL refuse l'insertion en mode strict et
            // la route répond 500.
            {...register('object', {
              required: t(target + 'objectRequired'),
              maxLength: { value: 100, message: t(target + 'objectTooLong') },
            })}
            className={fieldClass(errors.object)}
          />
          <FieldError error={errors.object} />
        </div>

        <div className="grow flex flex-col">
          <label htmlFor="newsletter-content" className={labelClass}>
            {t(target + 'content')}
          </label>
          <textarea
            id="newsletter-content"
            rows="8"
            placeholder={t(target + 'contentPlaceholder')}
            {...register('content', {
              required: t(target + 'contentRequired'),
            })}
            className={`${fieldClass(errors.content)} grow resize-none`}
          />
          <FieldError error={errors.content} />
        </div>

        <div className="bg-primary/50 border border-white/10 rounded-lg p-4">
          <label
            htmlFor="newsletter-schedule"
            className="flex items-center gap-3 w-max cursor-pointer text-sm font-bold uppercase tracking-wider"
          >
            <input
              id="newsletter-schedule"
              type="checkbox"
              {...register('isScheduled')}
              className="size-4 accent-accent cursor-pointer"
            />
            {t(target + 'schedule')}
          </label>

          {isScheduled && (
            <div className="mt-3">
              <label htmlFor="newsletter-send-at" className={labelClass}>
                {t(target + 'sendAt')}
              </label>
              <input
                id="newsletter-send-at"
                type="datetime-local"
                {...register('sendAt', {
                  required: isScheduled ? t(target + 'sendAtRequired') : false,
                  validate: value =>
                    !isScheduled ||
                    new Date(value) > new Date() ||
                    t(target + 'sendAtPast'),
                })}
                className={`${fieldClass(errors.sendAt)} [color-scheme:dark]`}
              />
              <FieldError error={errors.sendAt} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          >
            {t(target + 'cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-bold uppercase tracking-wider rounded-lg bg-accent/90 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isSubmitting
              ? t(target + 'submitting')
              : isScheduled
                ? t(target + 'submitScheduled')
                : t(target + 'submit')}
          </button>
        </div>
      </form>
    </div>
  );
}

const labelClass =
  'block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5';

function fieldClass(error) {
  return `w-full bg-primary border rounded-lg p-3 outline-none transition-colors placeholder:text-neutral-500 ${
    error ? 'border-red-500' : 'border-white/10 focus:border-accent'
  }`;
}

function FieldError({ error }) {
  if (!error) return null;

  return (
    <span className="block text-red-400 text-xs mt-1.5">{error.message}</span>
  );
}

export default NewsletterForm;
