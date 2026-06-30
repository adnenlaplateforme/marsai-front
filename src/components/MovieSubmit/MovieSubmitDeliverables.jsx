import InputImage from './base/InputImage';
import FormSectionTitle from './base/FormSectionTitle';
import FormSection from './base/FormSection';
import { useTranslation } from 'react-i18next';
import InputMovie from './base/InputMovie';

function MovieSubmitDeliverables({ form, movie }) {
  const { t } = useTranslation();
  const target = 'submitMovieForm.deliverables.';
  const errors = 'submitMovieForm.formErrors.';

  return (
    <FormSection className=" text-zinc-200">
      <FormSectionTitle text={t(target + 'title')} />

      <div className="flex flex-col gap-2 w-full">
        <InputMovie
          id="form-movie-upload"
          name="video"
          form={form}
          maxSize={300}
          description={t(target + 'video.description')}
          subDescription={t(target + 'video.subDescription')}
          validation={{ required: !movie?.video_path && t(errors + 'required') }}
          existingUrl={movie?.video_path}
        />

        <div className="flex flex-col gap-2 pb-10 pt-1 items-center">
          <div className="flex flex-row items">
            <input
              className="mr-3"
              type="checkbox"
              id="form-has-subtitles"
              name="has-subtitles"
              value="true"
              title={t(target + 'hasSubs.title')}
              {...form.register('hasSubs')}
            ></input>
            <label htmlFor="form-has-subtitles">
              {t(target + 'hasSubs.label')}
            </label>
          </div>
        </div>
      </div>

      <div className="w-5/6 flex flex-col justify-center md:flex-row md:justify-evenly gap-6">
        <div className="relative flex flex-col justify-center items-center gap-3 w-full">
          <p className="">{t(target + 'coverImage.header')}</p>
          <InputImage
            className="aspect-video w-full max-w-sm object-scale-down"
            errorClassName="sm:right-35 sm:top-65 right-15 top-60"
            label={t(target + 'coverImage.label')}
            id="poster"
            name="coverImage"
            iconSize={80}
            maxSize={15}
            description={t(target + 'coverImage.description')}
            subDescription={t(target + 'coverImage.subDescription')}
            form={form}
            validation={{ required: !movie?.cover_path && t(errors + 'required') }}
            existingUrl={movie?.cover_path}
          />
        </div>
        <div className="relative flex flex-col items-center gap-3 w-full">
          <p>{t(target + 'stills.header')}</p>
          <div className="flex justify-center items-center gap-3">
            <InputImage
              className="aspect-3/4 w-20 justify-center object-cover"
              errorClassName="sm:right-31 sm:top-38 right-15 top-38"
              maxSize={15}
              label={t(target + 'stills.stillA')}
              id="still-image-a"
              name="stillImageA"
              form={form}
              existingUrl={movie?.stills?.[0]}
            />
            <InputImage
              className="aspect-3/4 w-20 justify-center object-cover"
              errorClassName="sm:right-31 sm:top-38 right-15 top-38"
              maxSize={15}
              label={t(target + 'stills.stillB')}
              id="still-image-b"
              name="stillImageB"
              form={form}
              existingUrl={movie?.stills?.[1]}
            />
            <InputImage
              className="aspect-3/4 w-20 justify-center object-cover"
              errorClassName="sm:right-31 sm:top-38 right-15 top-38"
              maxSize={15}
              label={t(target + 'stills.stillC')}
              id="still-image-c"
              name="stillImageC"
              form={form}
              existingUrl={movie?.stills?.[2]}
            />
          </div>
        </div>
      </div>
    </FormSection>
  );
}

export default MovieSubmitDeliverables;
