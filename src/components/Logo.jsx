import { Link } from 'react-router-dom';

function Logo({ src, alt, imgClassName = 'w-[60px]' }) {
  return (
    <Link
      to="/"
      aria-label="Back to homepage"
      className="flex flex-col items-center md:items-start justify-center ml-2 mr-2 lg:ml-0 lg:mr-0 lg:justify-start"
    >
      {src && <img src={src} alt={alt} className={imgClassName} />}
    </Link>
  );
}
export default Logo;
