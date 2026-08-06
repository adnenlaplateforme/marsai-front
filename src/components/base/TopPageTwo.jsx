// Réserve la hauteur de la navbar (min-h-17 = 68px, sa hauteur exacte).
// Volontairement sans fond : la bande prend celui de la page, sinon elle
// tranche avec la première section juste en dessous.
function TopPageTwo({ children, className = '' }) {
  className =
    'min-h-17 flex flex-col items-center justify-center' + ' ' + className;
  return <div className={className}>{children}</div>;
}
export default TopPageTwo;
