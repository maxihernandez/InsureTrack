export const pinColors = [
  "#0f766e", "#1d4ed8", "#7c3aed", "#be123c", "#b45309", "#047857", "#4338ca", "#c2410c", "#0369a1", "#9d174d",
  "#4d7c0f", "#6d28d9", "#0e7490", "#a21caf", "#b91c1c", "#ca8a04", "#15803d", "#2563eb", "#9333ea", "#e11d48",
  "#ea580c", "#65a30d", "#0891b2", "#8b5cf6", "#db2777", "#dc2626", "#d97706", "#16a34a", "#0284c7", "#7e22ce",
] as const;

export function pinColorValue(pinColor: number) {
  return pinColors[pinColor - 1] ?? "#52525b";
}
