// Les statuts de l'enum `MovieStatus` du backend (src/types/enums/movie-status.enum.ts).
// `pending_review` n'est pas dans ADMIN_ACTIONS : c'est l'état initial d'une
// soumission, l'admin n'y revient pas — et PUT /movies/:id le refuserait
// (adminUpdate ne connaît pas de template d'e-mail pour ce statut).
export const STATUS_LABELS = {
  pending_review: 'En attente',
  pending_change: 'Correction demandée',
  accepted: 'Accepté',
  selected: 'Sélectionné',
  rejected: 'Refusé',
  winner: 'Lauréat',
};

export const STATUS_BADGE = {
  pending_review: 'bg-neutral-600 text-white',
  pending_change: 'bg-orange-500 text-black',
  accepted: 'bg-green-500 text-black',
  selected: 'bg-blue-500 text-white',
  rejected: 'bg-red-500 text-white',
  winner: 'bg-amber-300 text-black',
};

export const ADMIN_ACTIONS = [
  { status: 'accepted', label: 'Accepter', className: 'bg-green-500' },
  {
    status: 'pending_change',
    label: 'Correction',
    className: 'bg-orange-500',
  },
  { status: 'rejected', label: 'Refuser', className: 'bg-red-500' },
  { status: 'selected', label: 'Sélectionner', className: 'bg-blue-500' },
  { status: 'winner', label: 'Lauréat', className: 'bg-amber-300' },
];
