function SmallCard({ title, label, subtitle, date, duration, className = '' }) {
  return (
    <div
      className={`flex h-full flex-col gap-4 rounded-xl px-6 py-6 ring-1 ring-white/5 md:flex-row md:items-center md:gap-8 lg:px-8 ${className}`}
    >
      {subtitle && (
        <div className="shrink-0 text-center">
          <span className="mb-2 block rounded bg-white px-2 py-1 text-xs uppercase text-primary">
            {date}
          </span>
          <h4 className="text-3xl uppercase text-dark"> {subtitle} </h4>
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center justify-between gap-3 pb-2">
          <p className="text-accent uppercase text-sm">{label}</p>
          {duration && (
            <span className="shrink-0 text-xs uppercase text-dark">
              {duration}
            </span>
          )}
        </div>
        <h3 className="p-0 lg:text-xl">{title}</h3>
      </div>
    </div>
  );
}

export default SmallCard;
