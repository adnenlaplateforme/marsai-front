import { useTranslation } from 'react-i18next';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import FormSection from '../MovieSubmit/base/FormSection';
import BasicFormInput from '../MovieSubmit/base/BasicFormInput';
import FormTextArea from '../MovieSubmit/base/FormTextArea';

/**
 * Les champs d'un événement, partagés par l'ajout et la modification.
 *
 * Les deux écrans posent les mêmes questions ; ils ne diffèrent que par ce
 * qu'ils en font. La création envoie un `POST` puis un `PUT`, la modification
 * deux `PUT`, et seule la création réclame une date de publication — le back
 * l'exige à la création et l'ignore ensuite.
 *
 * Le composant ne connaît ni l'API ni sa forme : il reçoit des valeurs déjà
 * mises au format d'un champ HTML et rend un formulaire. C'est la page qui sait
 * traduire l'un vers l'autre.
 */
function EventForm({
  form,
  defaults = {},
  withPublishedAt = false,
  submitLabel,
  error,
}) {
  const { t } = useTranslation();
  const target = 'admin.eventsManager.form.';
  const {
    formState: { isSubmitting },
  } = form;

  return (
    <>
      <FormSection className="text-zinc-200">
        <div className="flex flex-col w-full md:flex-row md:justify-between md:gap-20">
          <BasicFormInput
            label={t(target + 'titleFr')}
            id="form-title-fr"
            name="titleFr"
            title={t(target + 'titleFr')}
            form={form}
            defaultValue={defaults.titleFr ?? ''}
            validation={{ required: t(target + 'required') }}
          />
          <BasicFormInput
            label={t(target + 'titleEn')}
            id="form-title-en"
            name="titleEn"
            title={t(target + 'titleEn')}
            form={form}
            defaultValue={defaults.titleEn ?? ''}
            validation={{ required: t(target + 'required') }}
          />
        </div>

        <div className="flex flex-col items-center w-full md:flex-row md:justify-between md:gap-20">
          <FormTextArea
            label={t(target + 'descriptionFr')}
            maxCount={1000}
            id="form-description-fr"
            name="descriptionFr"
            title={t(target + 'descriptionFr')}
            form={form}
            defaultValue={defaults.descriptionFr ?? ''}
          />
          <FormTextArea
            label={t(target + 'descriptionEn')}
            maxCount={1000}
            id="form-description-en"
            name="descriptionEn"
            title={t(target + 'descriptionEn')}
            form={form}
            defaultValue={defaults.descriptionEn ?? ''}
          />
        </div>

        <div className="flex flex-col w-full md:flex-row md:justify-between md:gap-20">
          <BasicFormInput
            label={t(target + 'location')}
            id="form-location"
            name="location"
            title={t(target + 'location')}
            form={form}
            defaultValue={defaults.location ?? ''}
            validation={{ required: t(target + 'required') }}
          />
          <BasicFormInput
            label={t(target + 'date')}
            type="datetime-local"
            id="form-date"
            name="date"
            title={t(target + 'date')}
            form={form}
            defaultValue={defaults.date ?? ''}
            validation={{ required: t(target + 'required') }}
          />
        </div>

        <div className="flex flex-col w-full md:flex-row md:justify-between md:gap-20">
          <BasicFormInput
            label={t(target + 'duration')}
            id="form-duration"
            name="duration"
            title={t(target + 'duration')}
            form={form}
            defaultValue={defaults.duration ?? ''}
            validation={{ required: t(target + 'required') }}
          />
          <BasicFormInput
            label={t(target + 'capacity')}
            id="form-capacity"
            name="capacity"
            title={t(target + 'capacity')}
            form={form}
            defaultValue={defaults.capacity ?? ''}
            validation={{ required: t(target + 'required') }}
          />
        </div>

        {withPublishedAt && (
          <div className="flex flex-col w-full md:flex-row md:justify-between md:gap-20">
            <BasicFormInput
              label={t(target + 'publishedAt')}
              type="datetime-local"
              id="form-published-at"
              name="publishedAt"
              title={t(target + 'publishedAt')}
              form={form}
              defaultValue={defaults.publishedAt ?? ''}
              validation={{ required: t(target + 'required') }}
            />
          </div>
        )}

        <fieldset className="flex flex-col w-full gap-3 pb-4">
          <legend className="pb-2">{t(target + 'type')}</legend>
          <div className="flex flex-row justify-around gap-3 w-full">
            <label
              className="flex items-center justify-center h-16 border border-gray rounded-sm cursor-pointer has-checked:bg-secondary has-checked:border-accent w-1/2 p-1"
              htmlFor="form-conference"
            >
              {t(target + 'conference')}
              <input
                className="appearance-none"
                type="radio"
                id="form-conference"
                value="false"
                defaultChecked={!defaults.isBookable}
                {...form.register('isBookable')}
              />
            </label>
            <label
              className="flex items-center justify-center h-16 border border-gray rounded-sm cursor-pointer has-checked:bg-secondary has-checked:border-accent w-1/2 p-1"
              htmlFor="form-workshop"
            >
              {t(target + 'workshop')}
              <input
                className="appearance-none"
                type="radio"
                id="form-workshop"
                value="true"
                defaultChecked={!!defaults.isBookable}
                {...form.register('isBookable')}
              />
            </label>
          </div>
        </fieldset>
      </FormSection>

      {error && (
        <p
          role="alert"
          className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3"
        >
          {error}
        </p>
      )}

      <button
        className="flex justify-center items-center border p-3 w-1/3 rounded-md bg-accent border-red-500 uppercase cursor-pointer font-bold hover:bg-red-600 transition-all disabled:bg-primary disabled:cursor-not-allowed"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <AiOutlineLoading3Quarters className="animate-spin size-6" />
        ) : (
          submitLabel
        )}
      </button>
    </>
  );
}

export default EventForm;
