import { Link } from 'react-router-dom';

// Dimensionné en hauteur : le ratio du logo (2,9:1) rend une largeur fixe
// imprévisible. L'alignement appartient au parent, pas au logo.
function Logo({
  src,
  alt,
  className = '',
  imgClassName = 'h-7 w-auto lg:h-8',
}) {
  return (
    <Link
      to="/"
      aria-label="Back to homepage"
      className={`inline-flex items-center ${className}`}
    >
      {src && <img src={src} alt={alt} className={imgClassName} />}
    </Link>
  );
}
export default Logo;
