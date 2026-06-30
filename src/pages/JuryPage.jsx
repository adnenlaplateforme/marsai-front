import { NavLink, Outlet } from 'react-router-dom';
import { BiMoviePlay } from 'react-icons/bi';

function JuryPage() {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 p-2 rounded-md transition-colors uppercase text-sm ${isActive ? 'bg-accent text-white' : 'hover:bg-neutral-700 text-neutral-200'}`;

  return (
    <div className="pt-17 md:min-h-screen flex-none md:flex">
      <div className="mt-3 md:w-70">
        <nav className="flex md:flex-col flex-row flex-wrap md:flex-nowrap md:mx-2 md:gap-2">
          <NavLink className={linkClass} to="/jury/dashboard/movies">
            <BiMoviePlay className="size-5" />
            <p className="hidden md:inline">Films</p>
          </NavLink>
        </nav>
      </div>
      <div className="w-full bg-primary text-white">
        <Outlet />
      </div>
    </div>
  );
}

export default JuryPage;
