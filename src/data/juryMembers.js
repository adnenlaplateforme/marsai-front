// Page /jury : contenu statique, aucun appel API.
//
// `photo` pointe vers `public/images/jury/`, détouré depuis les cartes
// composées de la maquette (conservées dans `design/`) : celles-ci ont le
// rôle, le nom et la description incrustés dans le pixel, qui feraient
// doublon avec le texte rendu ici et resteraient en français en anglais.
// Une valeur nulle fait afficher un aplat avec les initiales.
//
// `key` pointe vers `jury.members.<key>` dans les traductions, où vivent le
// rôle et la description. Les noms ne sont pas traduits.

export const president = {
  name: 'Julien Valros',
  photo: '/images/jury/julien-valros.jpg',
};

export const members = [
  {
    key: 'aikoSato',
    name: 'Aiko Sato',
    photo: '/images/jury/aiko-sato.jpg',
  },
  {
    key: 'julieMasson',
    name: 'Julie Masson',
    photo: '/images/jury/julie-masson.jpg',
  },
  {
    key: 'marcAubin',
    name: 'Marc Aubin',
    photo: '/images/jury/marc-aubin.jpg',
  },
];
