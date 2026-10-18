const MINUTES_PER_HOUR = 60;

export function minutesLabel(minutes: number): string {
  if (minutes < MINUTES_PER_HOUR) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const remainder = minutes % MINUTES_PER_HOUR;
  if (remainder === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainder}m`;
}
