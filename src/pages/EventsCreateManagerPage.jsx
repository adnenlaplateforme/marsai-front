import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import TitlePage from '../components/base/TitlePage';
import EventForm from '../components/admin/EventForm';
import { defaultPublishedAt } from '../components/admin/base/eventDefaults';
import { useApi } from '../hooks/useApi';

/**
 * La création d'un événement, dans ses deux langues.
 *
 * Le back n'a pas d'écriture bilingue : le titre et la description vivent dans
 * `event_translation`, une ligne par langue, et `POST /events` n'en pose qu'une.
 * La création se fait donc en deux temps — `POST` en français, qui rend
 * l'identifiant, puis `PUT` en anglais, que l'upsert de la modification rend
 * possible sur une traduction encore absente.
 *
 * Exiger les deux langues est une règle du formulaire, pas du schéma : l'API
 * accepte parfaitement un événement unilingue, mais un site bilingue ne veut pas
 * d'un atelier absent de la moitié de son programme.
 */
function EventsCreateManagerPage() {
  const { t } = useTranslation();
  const target = 'admin.eventsManager.addPage.';
  const navigate = useNavigate();
  const api = useApi();
  const form = useForm({ criteriaMode: 'all' });
  const { handleSubmit } = form;

  const [error, setError] = useState(null);
  // L'identifiant rendu par une création déjà réussie. Il fait basculer un
  // second envoi en modification : sans lui, l'échec de la seule traduction
  // anglaise ferait naître un doublon à chaque nouvelle tentative.
  const [createdId, setCreatedId] = useState(null);

  /**
   * Un formulaire HTML ne rend que des chaînes, là où le schéma attend deux
   * entiers et un booléen : envoyés tels quels, « 60 » et « true » repartent
   * en 400.
   *
   * `capacity` vaut 1 pour une conférence. Son champ n'est pas affiché — le
   * nombre de places d'un événement qu'on ne réserve pas ne veut rien dire —
   * mais la base impose `CHECK (capacity > 0)` et le schéma un entier
   * strictement positif : 1 satisfait la contrainte sans rien promettre.
   */
  function sharedFields(data) {
    const isBookable = data.isBookable === 'true';
    return {
      location: data.location,
      date: data.date,
      duration: Number(data.duration),
      capacity: isBookable ? Number(data.capacity) : 1,
      isBookable,
    };
  }

  async function send(path, method, body) {
    const res = await api(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // `useApi` rend null quand la session est morte : il a déjà déconnecté.
    if (!res) return null;
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.message || t(target + 'error'));
      return null;
    }
    return res;
  }

  async function onSubmit(data) {
    setError(null);

    const french = {
      lang: 'FR',
      title: data.titleFr,
      description: data.descriptionFr,
      publishedAt: data.publishedAt,
      ...sharedFields(data),
    };

    try {
      let id = createdId;

      if (id === null) {
        const res = await send('/events', 'POST', french);
        if (!res) return;
        // Aucun slug n'est envoyé : le back le dérive du titre français et ne
        // le recalcule plus ensuite. C'est l'adresse publique de l'événement.
        ({ id } = await res.json());
        setCreatedId(id);
      } else {
        // L'événement existe déjà : le second envoi le corrige au lieu d'en
        // créer un autre.
        if (!(await send(`/events/${id}`, 'PUT', french))) return;
      }

      const en = await send(`/events/${id}`, 'PUT', {
        lang: 'EN',
        title: data.titleEn,
        description: data.descriptionEn,
      });

      // L'événement français est enregistré, l'anglais non : le dire, plutôt
      // que de quitter l'écran sur un succès qui n'est que la moitié du travail.
      if (!en) {
        setError(t(target + 'partial'));
        return;
      }

      navigate('/admin/events');
    } catch (e) {
      console.error('event create error: ', e);
      setError(t(target + 'error'));
    }
  }

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
          withPublishedAt
          defaults={{
            isBookable: true,
            publishedAt: defaultPublishedAt(new Date()),
          }}
        />
      </form>
    </div>
  );
}

export default EventsCreateManagerPage;
