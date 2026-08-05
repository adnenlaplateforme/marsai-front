import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import TitlePage from '../components/base/TitlePage';
import EventForm from '../components/admin/EventForm';
import { useApi } from '../hooks/useApi';

/**
 * L'édition d'un événement, dans ses deux langues.
 *
 * Le back range le titre et la description dans `event_translation`, une ligne
 * par langue, et tout le reste dans `event`. Il n'existe donc pas de lecture ni
 * d'écriture « bilingue » : la page lit `GET /events/:id` deux fois, une par
 * langue, et enregistre par un `PUT` par langue.
 *
 * Le second appel de lecture peut légitimement répondre 404 — `findById` joint
 * `event_translation`, si bien qu'un événement saisi en français seulement n'a
 * rien à rendre en anglais. C'est un formulaire vide à remplir, pas une panne,
 * et c'est l'upsert du `PUT` qui rend la traduction manquante créable.
 */
function EventsEditManagerPage() {
  const { t } = useTranslation();
  const target = 'admin.eventsManager.editPage.';
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const form = useForm({ criteriaMode: 'all' });
  const { handleSubmit } = form;

  const [loaded, setLoaded] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function read(path) {
      const res = await api(path);
      if (!res) return null;
      return res.ok ? await res.json() : null;
    }

    async function load() {
      try {
        // Les deux langues sont lues de front : elles ne dépendent pas l'une de
        // l'autre, et l'absence de l'une est un cas normal.
        const [fr, en] = await Promise.all([
          read(`/events/${id}`),
          read(`/events/${id}?lang=EN`),
        ]);
        if (cancelled) return;

        // Aucune des deux langues ne répond : l'événement n'existe pas. Un
        // événement existant en a forcément au moins une, sa création en pose
        // toujours une.
        if (!fr && !en) {
          setError(t(target + 'notFound'));
          return;
        }

        setLoaded({ fr, en, shared: fr ?? en });
      } catch (e) {
        console.error('event read error: ', e);
        if (!cancelled) setError(t(target + 'notFound'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [api, id, t]);

  /**
   * Un `PUT` par langue. Le premier porte les champs communs — ils vivent dans
   * `event`, une seule ligne pour les deux langues — le second ne porte que la
   * traduction anglaise.
   *
   * Aucun `slug` n'est envoyé : c'est l'adresse publique de l'événement, elle
   * naît du titre français à la création et le back ne la recalcule plus.
   */
  async function onSubmit(data) {
    setError(null);

    const write = async body => {
      const res = await api(`/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // `useApi` rend null quand la session est morte : il a déjà déconnecté.
      if (!res) return false;
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.message || t(target + 'error'));
        return false;
      }
      return true;
    };

    // Le champ des places disparaît pour une conférence : il n'y a alors rien à
    // lire, et la base impose pourtant `CHECK (capacity > 0)`. 1 satisfait la
    // contrainte sans rien promettre.
    const isBookable = data.isBookable === 'true';

    try {
      const frOk = await write({
        lang: 'FR',
        title: data.titleFr,
        description: data.descriptionFr,
        location: data.location,
        date: data.date,
        duration: Number(data.duration),
        capacity: isBookable ? Number(data.capacity) : 1,
        isBookable,
      });
      if (!frOk) return;

      // La seconde écriture ne doit pas passer inaperçue : la traduction
      // anglaise resterait à l'ancienne valeur alors que la page annoncerait
      // un succès et quitterait l'écran.
      const enOk = await write({
        lang: 'EN',
        title: data.titleEn,
        description: data.descriptionEn,
      });
      if (!enOk) return;

      navigate('/admin/events');
    } catch (e) {
      console.error('event update error: ', e);
      setError(t(target + 'error'));
    }
  }

  if (isLoading && !error) {
    return (
      <p className="text-neutral-300 py-12 text-center">
        {t(target + 'loading')}
      </p>
    );
  }

  if (!loaded) {
    return (
      <p
        role="alert"
        className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3 m-6"
      >
        {error}
      </p>
    );
  }

  const { fr, en, shared } = loaded;

  return (
    <div className="pb-25 pt-10 flex flex-col items-center text-white">
      <TitlePage>{t(target + 'title')}</TitlePage>

      <form
        className="flex flex-col items-center gap-7 w-full"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <EventForm
          form={form}
          submitLabel={t(target + 'submit')}
          error={error}
          defaults={{
            titleFr: fr?.title ?? '',
            titleEn: en?.title ?? '',
            descriptionFr: fr?.description ?? '',
            descriptionEn: en?.description ?? '',
            location: shared.location ?? '',
            // `datetime-local` n'accepte que « YYYY-MM-DDTHH:mm » ; l'API rend
            // une date complète, secondes comprises.
            date: (shared.date ?? '').slice(0, 16),
            duration: String(shared.duration ?? ''),
            capacity: String(shared.capacity ?? ''),
            isBookable: !!shared.is_bookable,
          }}
        />
      </form>
    </div>
  );
}

export default EventsEditManagerPage;
