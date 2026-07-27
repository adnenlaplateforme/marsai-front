import { useOutletContext } from 'react-router-dom';
import { FiPlay } from 'react-icons/fi';

// Placeholder — à remplacer par la vraie date de clôture (config / API).
const DELIBERATION_DEADLINE = '15 JUIN 2026';

function JuryMoviesPage() {
  const { toRateTotal } = useOutletContext();

  return (
    <div className="flex flex-col items-center text-center px-6 py-16 max-w-2xl mx-auto">
      <div className="size-24 rounded-full border-2 border-accent flex items-center justify-center mb-8">
        <FiPlay className="size-10 text-accent ml-1" />
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold uppercase">
        Prêt pour les délibérations ?
      </h1>
      <p className="text-neutral-400 mt-4 max-w-md">
        Sélectionnez un film dans la file d&apos;attente à gauche pour commencer
        le visionnage et attribuer une note.
      </p>

      <div className="flex gap-12 mt-12">
        <div>
          <p className="text-4xl font-extrabold">{toRateTotal}</p>
          <p className="text-xs uppercase tracking-wider text-neutral-400 mt-1">
            Films à noter
          </p>
        </div>
        <div>
          <p className="text-4xl font-extrabold text-accent">
            {DELIBERATION_DEADLINE}
          </p>
          <p className="text-xs uppercase tracking-wider text-neutral-400 mt-1">
            Clôture
          </p>
        </div>
      </div>
    </div>
  );
}

export default JuryMoviesPage;
