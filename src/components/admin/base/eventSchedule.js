// Le programme du festival tel que la page /admin/events le montre.
//
// `GET /events?lang=` répond une ligne par *traduction* : la même conférence
// revient une fois en FR, une fois en EN. La page en fait un planning — une
// carte par événement, rangée par journée — et ces fonctions font la mise en
// forme, sans toucher au réseau, pour rester testables telles quelles.

/**
 * Une carte par événement, dans la langue de l'interface.
 *
 * Les deux langues sont lues côte à côte parce qu'un événement peut n'exister
 * que dans l'une des deux : la requête FR ne le renverrait pas, et il
 * disparaîtrait du planning de l'admin alors qu'il est bien au programme. La
 * traduction demandée gagne quand les deux sont là ; sinon l'autre passe, avec
 * son `lang` que la carte signale.
 */
export function mergeTranslations(events, lang = 'FR') {
  const byId = new Map();

  for (const event of events) {
    const known = byId.get(event.id);
    if (!known || (known.lang !== lang && event.lang === lang)) {
      byId.set(event.id, event);
    }
  }

  return [...byId.values()].sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * Les journées du programme, dans l'ordre du calendrier.
 *
 * La clé est la date locale, et non `toISOString()` : un atelier de 22 h
 * tomberait le lendemain en UTC dès que le serveur du festival est à l'heure de
 * Marseille, et se rangerait sous le mauvais onglet.
 */
export function groupByDay(events) {
  const days = new Map();

  for (const event of events) {
    const date = new Date(event.date);
    const key = dayKey(date);
    if (!days.has(key)) days.set(key, { key, date, events: [] });
    days.get(key).events.push(event);
  }

  return [...days.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function dayKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Les places déjà prises, ou `null` si l'événement ne se réserve pas.
 *
 * Une conférence libre n'a ni capacité ni réservation : rendre `0` la ferait
 * passer pour un atelier vide, alors qu'elle n'attend simplement personne.
 */
export function seatsTaken(event) {
  if (!isBookable(event)) return null;
  const capacity = Number(event.capacity);
  const remaining = Number(event.remaining_seats);
  if (!Number.isFinite(capacity) || !Number.isFinite(remaining)) return null;
  return Math.max(0, capacity - remaining);
}

/**
 * Les deux chiffres de l'en-tête : réservations totales et taux de remplissage.
 *
 * Le compte est celui du moment, déduit des places restantes. Le « +12
 * aujourd'hui » de la maquette ne s'en déduit pas — `remaining_seats` dit
 * combien de places sont parties, jamais quand — et vient de
 * `GET /bookings/stats`, que la page lit séparément.
 */
export function scheduleStats(events) {
  let bookings = 0;
  let capacity = 0;
  let workshops = 0;

  for (const event of events) {
    const taken = seatsTaken(event);
    if (taken === null) continue;
    bookings += taken;
    capacity += Number(event.capacity);
    workshops += 1;
  }

  return {
    bookings,
    capacity,
    workshops,
    fillRate: capacity > 0 ? Math.round((bookings / capacity) * 100) : null,
  };
}

function isBookable(event) {
  return event.is_bookable === true || event.is_bookable === 1;
}

/** Le créneau, `10:00 – 12:00`, ou la seule heure de début faute de durée. */
export function timeRange(event) {
  const start = new Date(event.date);
  const duration = Number(event.duration);
  if (!Number.isFinite(duration) || duration <= 0) return hhmm(start);
  const end = new Date(start.getTime() + duration * 60_000);
  return `${hhmm(start)} – ${hhmm(end)}`;
}

function hhmm(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
}

/**
 * L'onglet ouvert à l'arrivée : la journée en cours ou, à défaut, la prochaine.
 *
 * Une fois le festival passé, la dernière journée l'emporte sur la première :
 * l'admin qui revient consulte des réservations closes, pas l'ouverture.
 */
export function defaultDayIndex(days, now = new Date()) {
  if (days.length === 0) return 0;
  const today = dayKey(now);
  const upcoming = days.findIndex(day => day.key >= today);
  return upcoming === -1 ? days.length - 1 : upcoming;
}
