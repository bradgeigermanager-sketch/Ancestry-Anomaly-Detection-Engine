// Normalize a vector to [0,1]
export function normalizeVector(vec) {
  if (!vec || vec.length === 0) return [];

  const min = Math.min(...vec);
  const max = Math.max(...vec);
  const range = max - min || 1;

  return vec.map(v => (v - min) / range);
}
