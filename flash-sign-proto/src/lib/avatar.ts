// Avatars (tables.txt users.avatar_file_id): a person's uploaded photo, or their initials on a
// colour. The colour is never stored or chosen: it's worked out from the person's id, so the
// same person always gets the same colour everywhere.

const AVATAR_COLORS = [
  '#009882', '#2563eb', '#7c3aed', '#db2777', '#d97706',
  '#059669', '#0891b2', '#4f46e5', '#c2410c', '#475569',
];

export function avatarColorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
