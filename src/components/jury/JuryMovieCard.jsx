import { NavLink } from 'react-router-dom';

function JuryMovieCard({ movie }) {
  const director = movie.director;
  const name = [director?.firstname, director?.lastname]
    .filter(Boolean)
    .join(' ');
  const subtitle = [name, director?.country].filter(Boolean).join(' – ');

  return (
    <NavLink
      to={`/jury/dashboard/movies/${movie.id}/ratings`}
      className={({ isActive }) =>
        `flex items-center gap-3 p-3 rounded-xl transition-colors ${
          isActive
            ? 'bg-accent text-white'
            : 'bg-primary text-white hover:bg-neutral-700'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <img
            src={movie.cover_path}
            alt=""
            className="size-14 rounded-lg object-cover flex-shrink-0 bg-secondary"
          />
          <div className="min-w-0">
            <p className="font-bold uppercase text-sm truncate">
              {movie.english_title}
            </p>
            <p
              className={`text-xs uppercase truncate ${
                isActive ? 'text-white/80' : 'text-neutral-400'
              }`}
            >
              {subtitle}
            </p>
          </div>
        </>
      )}
    </NavLink>
  );
}

export default JuryMovieCard;
