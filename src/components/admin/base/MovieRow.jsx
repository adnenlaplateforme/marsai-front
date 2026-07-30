import { Link } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';
import { STATUS_BADGE, STATUS_LABELS } from './movieStatus';

function directorName(director) {
  return [director?.firstname, director?.lastname].filter(Boolean).join(' ');
}

function MovieRow({ data }) {
  const submittedAt = new Date(data.submitted_at);
  const director = directorName(data.director);

  return (
    <tr className="border-t border-white/5 hover:bg-white/5 transition-colors">
      <td className="px-4 py-3 hidden sm:table-cell">
        <img
          src={data.cover_path}
          alt=""
          className="size-14 rounded-lg object-cover bg-primary"
        />
      </td>
      <td className="px-4 py-3">
        <p className="font-bold uppercase text-sm truncate max-w-[16rem]">
          {data.english_title}
        </p>
        {/* Le réalisateur a sa propre colonne à partir de md : en dessous, il
            passe sous le titre plutôt que de disparaître. */}
        <p className="text-xs text-neutral-400 truncate md:hidden">
          {director}
        </p>
      </td>
      <td className="px-4 py-3 text-sm text-neutral-300 whitespace-nowrap hidden md:table-cell">
        {director || '—'}
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
            STATUS_BADGE[data.status] ?? 'bg-neutral-600 text-white'
          }`}
        >
          {STATUS_LABELS[data.status] ?? data.status}
        </span>
      </td>
      <td
        className="px-4 py-3 text-sm text-neutral-400 whitespace-nowrap tabular-nums"
        title={submittedAt.toLocaleString('fr-FR')}
      >
        {submittedAt.toLocaleDateString('fr-FR')}
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          to={'/admin/movies/' + data.id + '-' + data.slug}
          aria-label={`Ouvrir la fiche de ${data.english_title}`}
          className="inline-flex items-center justify-center size-9 rounded-lg border border-white/10 text-neutral-300 hover:text-white hover:border-accent transition-colors"
        >
          <FiChevronRight className="size-5" />
        </Link>
      </td>
    </tr>
  );
}

export default MovieRow;
