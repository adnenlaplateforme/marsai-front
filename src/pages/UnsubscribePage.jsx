import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useTranslation } from 'react-i18next';
import TopPageTwo from '../components/base/TopPageTwo';
import Card from '../components/base/Card';
import { FaCheck } from 'react-icons/fa';
import { VscError } from 'react-icons/vsc';

const UnsubscribePage = () => {
  const { token } = useParams();
  const fetchApi = useApi();
  const { t } = useTranslation();
  const [status, setStatus] = useState('loading'); // loading, success, error

  useEffect(() => {
    const unsubscribe = async () => {
      if (!token) {
        setStatus('error');
        return;
      }

      try {
        const response = await fetchApi(`/bookings/unsubscribe/${token}`);
        if (response && response.ok) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Unsubscribe error:', error);
        setStatus('error');
      }
    };

    unsubscribe();
  }, [token, fetchApi]);

  return (
    <>
      <TopPageTwo />
      <section className="section">
        <div className="max-w-xl mx-auto">
          <div className="bg-primary text-white p-8 rounded-lg shadow-md text-center">
            {status === 'loading' && (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-600">
                  {t('unsubscribe.loading', 'Désinscription en cours...')}
                </p>
              </div>
            )}

            {status === 'success' && (
              <Card
                icon={<FaCheck className="text-green-500" />}
                title={t('unsubscribe.success_title', 'Désinscription réussie')}
                text={t(
                  'unsubscribe.success_message',
                  'Vous avez été désinscrit avec succès de cet événement.'
                )}
                className="flex flex-col items-center justify-center"
              />
            )}

            {status === 'error' && (
              <Card
                icon={<VscError />}
                title={t('unsubscribe.error_title', 'Erreur')}
                text={t(
                  'unsubscribe.error_message',
                  'Une erreur est survenue lors de la désinscription. Le lien est peut-être invalide ou a déjà été utilisé.'
                )}
                className="flex flex-col items-center justify-center"
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default UnsubscribePage;
