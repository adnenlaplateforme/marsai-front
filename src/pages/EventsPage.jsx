import TopPageTwo from '../components/base/TopPageTwo';
import PracticalInfos from '../components/PracticalInfos';
import ConferenceProgram from '../components/ConferenceProgram';
import AccessProgram from '../components/AccessProgram';
import Workshops from '../components/Workshops';
import { useApi } from '../hooks/useApi';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

function EventsPage() {
  const [bookableEvents, setBookableEvents] = useState([]);
  const [notBookableEvents, setNotBookableEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchApi = useApi();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language.split('-')[0].toUpperCase();
  const target = 'events.conference.program.';

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetchApi(`/events?lang=${currentLang}`);
        if (response && response.ok) {
          const data = await response.json();
          // Partition sur la véracité de is_bookable plutôt que sur une liste
          // de valeurs attendues : un événement ne peut ni disparaître des
          // deux listes ni apparaître dans les deux.
          setBookableEvents(data.filter(event => Boolean(event.is_bookable)));
          setNotBookableEvents(data.filter(event => !event.is_bookable));
        } else {
          setError(t(target + 'errorFetch'));
        }
      } catch (err) {
        setError(t(target + 'errorOccurred'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [fetchApi, t, currentLang]);
  return (
    <>
      <TopPageTwo />
      <PracticalInfos />
      {/* Les événements réservables passent devant : c'est la seule section
          de la page où le visiteur a une action à faire. */}
      <Workshops data={bookableEvents} loading={loading} error={error} />
      <ConferenceProgram
        data={notBookableEvents}
        loading={loading}
        error={error}
      />
      <AccessProgram />
    </>
  );
}

export default EventsPage;
