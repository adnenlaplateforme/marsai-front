import { Link } from 'react-router-dom';
import { FaArrowRightLong } from 'react-icons/fa6';

function PrimaryButton({ to, children, hasIcon = true, className = '' }) {
  return (
    <Link
      to={to}
      className={`button flex items-center gap-2 text-white bg-accent transition-colors duration-200 hover:bg-accent/90 ${className}`}
    >
      {children}
      {hasIcon && <FaArrowRightLong />}
    </Link>
  );
}
export default PrimaryButton;
