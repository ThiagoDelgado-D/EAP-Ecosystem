const SECONDS_PER_MINUTE = 60;

export function durationInWords(seconds: number): string {
  if (seconds < SECONDS_PER_MINUTE) {
    return countOf(seconds, 'second');
  }
  return countOf(Math.ceil(seconds / SECONDS_PER_MINUTE), 'minute');
}

function countOf(amount: number, unit: string): string {
  if (amount === 1) {
    return `1 ${unit}`;
  }
  return `${amount} ${unit}s`;
}
