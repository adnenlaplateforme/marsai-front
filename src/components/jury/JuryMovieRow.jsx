import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';

function JuryMovieRow({ data }) {
  return (
    <tr className="md:*:p-5 *:text-center relative">
      <td className="hidden lg:block">
        <img
          className="md:max-w-20 rounded-xl bg-primary"
          src={data.cover_path}
          alt=""
        />
      </td>
      <td className="max-w-xs lg:max-w-md lg:min-w-md truncate">
        {data.english_title}
      </td>
      <td className="hidden lg:table-cell md:max-w-20">
        {data.director.firstname}
        <br />
        {data.director.lastname}
      </td>
      <td>
        <Link
          to={`/jury/dashboard/movies/${data.id}/ratings`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-sm rounded-md hover:opacity-80 transition-opacity"
        >
          <FaStar className="size-3.5" />
          Voter
        </Link>
      </td>
    </tr>
  );
}

export default JuryMovieRow;
