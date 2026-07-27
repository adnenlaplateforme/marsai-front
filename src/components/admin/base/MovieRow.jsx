import { Link } from 'react-router-dom';

function MovieRow({ data }) {
  function dateDiffString(date1) {
    let datediff = (new Date() - date1.getTime()) / (24 * 60 * 60 * 1000);

    if (datediff > 1) {
      return '' + Math.floor(datediff) + ' days';
    } else return '' + Math.floor(datediff * 24) + ' hours';
  }

  return (
    <tr className="md:*:p-5 *:text-center relative">
      <td className="absolute top-0 left-0 w-full h-full">
        <Link
          to={'/movies/' + data.id + '-' + data.slug}
          className="hover:bg-gray-400 hover:opacity-15 rounded-xl absolute top-0 left-0 w-full h-full"
        ></Link>
      </td>
      <td className="hidden lg:block">
        <img
          className="md:max-w-20 rounded-xl bg-primary"
          src={data.cover_path}
          alt=""
        />
      </td>
      <td className="max-w-xs lg:max-w-md  lg:min-w-md truncate">
        {data.english_title}
      </td>
      <td className="hidden lg:table-cell md:max-w-20">
        {data.director.firstname}
        <br />
        {data.director.lastname}
      </td>
      <td className="">{data.status}</td>
      <td className="" title={new Date(data.submitted_at).toLocaleString()}>
        {dateDiffString(new Date(data.submitted_at))}
      </td>
    </tr>
  );
}

export default MovieRow;
