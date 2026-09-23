// colors come from the database id, so the same book / author always gets
// the same color and books added one after another never look the same

const COVER_GRADIENTS = [
  ['#2dd4bf', '#0284c7'],
  ['#fb923c', '#ec4899'],
  ['#38bdf8', '#6366f1'],
  ['#34d399', '#0d9488'],
  ['#c084fc', '#db2777'],
  ['#fbbf24', '#ea580c'],
  ['#818cf8', '#7c3aed'],
  ['#fb7185', '#e11d48'],
  ['#a3e635', '#16a34a'],
  ['#f472b6', '#9333ea']
];

const AVATAR_COLORS = [
  { background: '#e0f2fe', color: '#0369a1' },
  { background: '#dcfce7', color: '#15803d' },
  { background: '#e0e7ff', color: '#4338ca' },
  { background: '#ffedd5', color: '#c2410c' },
  { background: '#fae8ff', color: '#a21caf' },
  { background: '#ffe4e6', color: '#be123c' },
  { background: '#fef9c3', color: '#a16207' },
  { background: '#ccfbf1', color: '#0f766e' }
];

export function coverGradient(bookId: number): string {
  const [from, to] = COVER_GRADIENTS[bookId % COVER_GRADIENTS.length];
  return `linear-gradient(150deg, ${from}, ${to})`;
}

export function avatarColors(authorId: number) {
  return AVATAR_COLORS[authorId % AVATAR_COLORS.length];
}

// "R. K. Narayan" -> "KN", "Sudha Murty" -> "SM"
export function initials(name: string): string {
  return name
    .replace(/\./g, ' ')
    .split(' ')
    .filter((word) => word)
    .slice(-2)
    .map((word) => word[0].toUpperCase())
    .join('');
}
