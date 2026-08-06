// Les campagnes telles que la page /admin/newsletter les montre.
//
// `GET /newsletters` sert les lignes brutes de la table : ni tri, ni état
// calculé, et `sent` en 0/1. Ces fonctions en tirent ce que l'écran affiche,
// sans toucher au réseau, pour rester testables telles quelles.

// Les quatre états d'une campagne, comme `STATUS_BADGE` le fait des statuts de
// film. Seule `sent` est verte : une campagne programmée n'a encore rien fait,
// et « en attente » signale que le cron a du retard, pas que tout va bien.
export const STATUS_BADGE = {
  sent: 'bg-green-500/10 text-green-400 border-green-500/20',
  sending: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  scheduled: 'bg-accent/10 text-accent border-accent/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

/**
 * Où en est une campagne.
 *
 * Le drapeau `sent` prime sur la date : une newsletter programmée puis traitée
 * garde une `send_at` passée, et se lirait « en attente » alors qu'elle est
 * partie. Vient ensuite le cas sans date — l'envoi immédiat, que
 * `newsletterService.create` poste dans la foulée du POST avant que `sendMail`
 * ne pose le drapeau. Le voir ici veut dire que l'envoi n'a pas encore abouti,
 * et non qu'il a échoué : `findAllToSend` reprend justement les lignes
 * `send_at IS NULL AND sent = 0` au passage suivant du cron, chaque minute.
 */
export function newsletterStatus(newsletter, now = new Date()) {
  if (newsletter.sent) return 'sent';
  if (!newsletter.sendAt) return 'sending';

  return new Date(newsletter.sendAt) > now ? 'scheduled' : 'pending';
}

/**
 * La date à afficher sous une campagne, ou `null` si elle n'en a aucune.
 *
 * La table `newsletter` n'a pas de colonne `sent_at` : d'une campagne partie
 * sur-le-champ, on ne connaît que l'heure de création. Sans ce repli, le cas le
 * plus courant — envoyer maintenant — s'afficherait sans date du tout.
 */
export function newsletterDate(newsletter) {
  const value = newsletter.sendAt ?? newsletter.createdAt;

  return value ? new Date(value) : null;
}

/**
 * Les campagnes de la plus récente à la plus ancienne.
 *
 * `newsletterModel.findAll` n'a pas d'`ORDER BY` : MySQL rend les lignes dans
 * l'ordre où il les trouve, en pratique la plus ancienne en tête. Or c'est la
 * dernière écrite que l'admin vient relire. Le tri se fait ici plutôt qu'en SQL
 * pour ne pas toucher à une route déjà servie ailleurs.
 */
export function sortNewsletters(newsletters) {
  return [...newsletters].sort(
    (a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt) ||
      // Deux campagnes de la même seconde — la table date à la seconde près :
      // l'identifiant auto-incrémenté dit laquelle est arrivée après.
      b.id - a.id
  );
}

/**
 * Une date dans la langue de l'interface, et non celle du navigateur.
 *
 * `toLocaleString()` sans argument suit les réglages du poste : l'admin qui
 * bascule le site en anglais garderait des dates françaises au milieu d'une page
 * traduite. L'heure reste locale — le serveur date en UTC, et un envoi de
 * 23 h 30 à Marseille s'afficherait au lendemain autrement.
 */
export function formatDate(date, language) {
  return date.toLocaleString(language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Les deux chiffres de l'en-tête : ce qui est parti, ce qui attend son heure. */
export function newsletterStats(newsletters, now = new Date()) {
  const stats = { sent: 0, scheduled: 0 };

  for (const newsletter of newsletters) {
    const status = newsletterStatus(newsletter, now);
    if (status === 'sent') stats.sent += 1;
    if (status === 'scheduled') stats.scheduled += 1;
  }

  return stats;
}
