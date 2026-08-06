import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import TitleSection from '../components/base/TitleSection';
import TopPageTwo from '../components/base/TopPageTwo';
import BasicFormInput from '../components/MovieSubmit/base/BasicFormInput';
import { useForm } from 'react-hook-form';
import { useTranslation, Trans } from 'react-i18next';

function EventBookingPage() {
  const { idSlug } = useParams();
  const id = idSlug?.split('-')[0];
  const fetchApi = useApi();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const form = useForm({
    criteriaMode: 'all',
  });
  const currentLang = i18n.language.split('-')[0].toUpperCase();

  async function onSubmit(data) {
    try {
      const response = await fetchApi('/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: parseInt(event.id),
          ...data,
        }),
      });

      if (response && response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/events'), 3000);
      } else {
        const data = await response.json();
        setError(data.message || t('booking.errors.default'));
      }
    } catch {
      setError(t('booking.errors.connection'));
    }
  }
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetchApi(`/events/${id}?lang=${currentLang}`);
        if (response && response.ok) {
          const data = await response.json();
          setEvent(data);
        } else {
          setError(t('booking.errors.notFound'));
        }
      } catch {
        setError(t('booking.errors.fetch'));
      }
    };
    fetchEvent();
  }, [id, currentLang]);

  return (
    <>
      <TopPageTwo />
      <section className="section text-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col">
            <TitleSection hasUnderline underlineColor="bg-accent">
              <Trans
                i18nKey="booking.title"
                components={[
                  <strong key="highlight" className="text-accent" />,
                ]}
              />
            </TitleSection>
            <p className="text-dark text-2xl mb-6"> {event?.title} </p>
          </div>
          {success ? (
            <div className="bg-green-500/20 border border-green-500 p-6 rounded-lg text-center">
              <h3 className="text-xl mb-2 text-white">
                {t('booking.success_title')}
              </h3>
              <p>{t('booking.success_message')}</p>
            </div>
          ) : (
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 bg-primary p-8 rounded-xl shadow-xl"
            >
              {error && (
                <div className="text-accent bg-accent/10 p-3 rounded border border-accent/20">
                  {error}
                </div>
              )}
              <BasicFormInput
                label={t('booking.firstname.label')}
                id="firstname"
                placeholder={t('booking.firstname.placeholder')}
                title="firstname"
                form={form}
                name="firstname"
                validation={{
                  required: t('submitMovieForm.formErrors.required'),
                  minLength: {
                    value: 3,
                    message: t('submitMovieForm.formErrors.minLength3'),
                  },
                  maxLength: {
                    value: 255,
                    message: t('submitMovieForm.formErrors.maxLength255'),
                  },
                }}
              />
              <BasicFormInput
                label={t('booking.lastname.label')}
                id="lastname"
                placeholder={t('booking.lastname.placeholder')}
                title="lastname"
                form={form}
                name="lastname"
                validation={{
                  required: t('submitMovieForm.formErrors.required'),
                  minLength: {
                    value: 3,
                    message: t('submitMovieForm.formErrors.minLength3'),
                  },
                  maxLength: {
                    value: 255,
                    message: t('submitMovieForm.formErrors.maxLength255'),
                  },
                }}
              />
              <BasicFormInput
                label={t('booking.email.label')}
                id="email"
                name="email"
                placeholder={t('booking.email.placeholder')}
                title=""
                form={form}
                validation={{
                  required: t('submitMovieForm.formErrors.required'),
                  pattern: {
                    value: /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/,
                    message: t('submitMovieForm.formErrors.validEmail'),
                  },
                  minLength: {
                    value: 5,
                    message: t('submitMovieForm.formErrors.minLength5'),
                  },
                  maxLength: {
                    value: 100,
                    message: t('submitMovieForm.formErrors.maxLength100'),
                  },
                }}
              />
              <button className="border px-12 py-2 rounded-md bg-accent border-red-500 cursor-pointer font-bold hover:bg-red-600 transition-all">
                {t('booking.submit')}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}

export default EventBookingPage;
