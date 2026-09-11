const PATH_COLORS = ['#818cf8', '#a78bfa', '#f472b6', '#34d399', '#f87171', '#c084fc', '#2dd4bf', '#fbbf24'];

export function pathColor(pathId: string): string {
  let hash = 0;
  for (let i = 0; i < pathId.length; i++) {
    hash = (hash * 31 + pathId.charCodeAt(i)) >>> 0;
  }
  return PATH_COLORS[hash % PATH_COLORS.length];
}
