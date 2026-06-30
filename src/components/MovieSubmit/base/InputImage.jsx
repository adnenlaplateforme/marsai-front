import { IoImageOutline } from 'react-icons/io5';
import { useState, useEffect } from 'react';
import { IoMdClose } from 'react-icons/io';
import FormErrors from './FormErrors';
import { useTranslation } from 'react-i18next';

function InputImage({
  label,
  id,
  name,
  form,
  description,
  subDescription,
  validation = false,
  maxSize = 0,
  iconSize = 40,
  className = '',
  errorClassName = '',
  existingUrl = null,
}) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState(existingUrl);
  const { register, resetField } = form;
  const errors = 'submitMovieForm.formErrors.';
  const [error, setError] = useState('');

  if (!validation) {
    validation = { required: false };
  }

  const { onChange: onFormChange, ref } = register(name, validation);

  function handlePreview(e) {
    setError('');
    onFormChange(e);
    const file = e.target.files[0];
    if (file.size > maxSize * 1024 * 1024) {
      resetField(name);
      setError(t(errors + 'maxSize15MB'));
      return;
    }
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  }

  function removePreview(e) {
    e.preventDefault();
    resetField(name);
    setPreview(null);
  }

  useEffect(() => {
    return () => preview && URL.revokeObjectURL(preview);
  }, [preview]);

  return (
    <>
      {preview ? (
        <div className="relative group w-fit">
          <img
            className={`rounded-xl outline-2 outline-dashed outline-zinc-300 ${className}`}
            src={preview}
            alt="preview"
          />
          <button
            type="button"
            className="absolute top-2 right-2 bg-zinc-700 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-zinc-800"
            onClick={removePreview}
            aria-label="Remove image"
          >
            <IoMdClose size={24} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={`flex flex-col items-center justify-center bg-zinc-800 rounded-xl outline-2 outline-zinc-300 outline-dashed hover:bg-zinc-900 focus-within:bg-zinc-900 cursor-pointer ${className}`}
        >
          <div className="flex flex-col items-center my-2">
            <IoImageOutline className="text-zinc-500" size={iconSize} />
            <input
              className="sr-only"
              type="file"
              id={id}
              name={name}
              ref={ref}
              onBlur={() => setError('')}
              onChange={handlePreview}
              accept="image/*"
              aria-label={label}
            />
            {description && (
              <p className="uppercase text-zinc-200 font-bold mt-2 text-center">
                {description}
              </p>
            )}
            {subDescription && (
              <p className="py-2 px-4 bg-zinc-700 text-zinc-200 rounded-3xl text-sm mt-2 text-center">
                {subDescription}
              </p>
            )}
          </div>
        </label>
      )}
      <div className={`absolute text-red-500 ${errorClassName}`}> {error}</div>
      <FormErrors form={form} name={name} />
    </>
  );
}

export default InputImage;
