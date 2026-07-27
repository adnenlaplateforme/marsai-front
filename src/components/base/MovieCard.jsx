import { useTranslation } from 'react-i18next';
import languages from '../../data/languages';
import { Link } from 'react-router-dom';

function MovieCard({ data }) {
  const { i18n } = useTranslation();

  let language = languages.filter(elem => elem.lang === data.language)[0];
  if (language === undefined) {
    language = {
      lang: 'ZZ',
      text: 'Unknown',
      icon: '❌',
      textFr: 'Inconnu',
      textEn: 'Unknown',
    };
  }

  let english_title = data.english_title;
  let original_title = data.original_title;
  let director = data.director.firstname + ' ' + data.director.lastname;

  return (
    <Link
      to={'/movies/' + data.id + '-' + data.slug}
      className=" hover:opacity-60 rounded-xl"

    >
      <div className="flex flex-col uppercase rounded-xl ">

        <div className="relative">
          <img
            className={`aspect-video w-full object-cover rounded-t-xl bg-primary`}
            src={data.cover_path}
          />
          <span className="bg-secondary text-white absolute right-1 bottom-1 text-center text-xs px-4 rounded-md lowercase">
            {data.duration} s
          </span>
          <span className=" bg-white text-black absolute text-center text-[10px] px-2 rounded-md left-1 top-2">
            {data.is_hybrid ? 'Hybrid' : 'Full-AI'}
          </span>
        </div>
        <div className="p-2 bg-primary rounded-b-2xl">
          <div className="flex flex-row justify-between ">
            <div className="flex flex-col  min-w-0 max-w-100">
              <p
                className="text-lg font-bold truncate text-white"
                title={data.english_title}
              >
                {english_title}
              </p>
              <p
                className="text-xs truncate text-dark"
                title={data.original_title}
              >
                {original_title}
              </p>
            </div>
          </div>
          <div className="flex flex-row justify-between">
            <div className="flex flex-col ">
              <p className=" text-dark">{director}</p>
            </div>
            <div className="flex flex-col ">
              <p
                className="text-base text-white"
                title={i18n.language === 'fr' ? language.textFr : language.textEn}
              >
                {language.icon}{' '}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default MovieCard;
