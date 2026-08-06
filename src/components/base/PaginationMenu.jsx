import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { useTranslation } from 'react-i18next';
import { MOVIES_PER_PAGE } from '../../config/pagination';

const buttonClass =
  'flex size-10 items-center justify-center rounded-lg text-white transition-colors disabled:cursor-not-allowed disabled:opacity-30';

function PaginationMenu({
  page,
  setPage,
  total,
  perPage = MOVIES_PER_PAGE,
  className = '',
}) {
  const { t } = useTranslation();
  const target = 'gallery.page.';
  const lastPage = Math.max(1, Math.ceil(total / perPage));

  if (lastPage <= 1) return null;

  // Fenêtre de 3 numéros glissante, ramenée dans les bornes en début et fin
  // de liste pour ne pas afficher de page inexistante.
  const start = Math.min(Math.max(1, page - 1), Math.max(1, lastPage - 2));
  const pages = [start, start + 1, start + 2].filter(p => p <= lastPage);

  return (
    <nav
      aria-label={t(target + 'pagination')}
      className={`flex justify-center gap-2 ${className}`}
    >
      <button
        type="button"
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
        aria-label={t(target + 'previousPage')}
        className={`${buttonClass} hover:bg-primary`}
      >
        <IoIosArrowBack size={20} />
      </button>

      {pages.map(p => (
        <button
          key={p}
          type="button"
          onClick={() => setPage(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`${buttonClass} ${
            p === page
              ? 'bg-accent font-semibold text-white'
              : 'bg-primary hover:bg-neutral-600'
          }`}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        onClick={() => setPage(page + 1)}
        disabled={page === lastPage}
        aria-label={t(target + 'nextPage')}
        className={`${buttonClass} hover:bg-primary`}
      >
        <IoIosArrowForward size={20} />
      </button>
    </nav>
  );
}

export default PaginationMenu;
