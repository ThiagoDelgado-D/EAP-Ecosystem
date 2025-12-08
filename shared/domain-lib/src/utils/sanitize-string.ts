export interface SanitizeOptions {
  toLowerCase?: boolean;
  collapseSpaces?: boolean;
}

export function sanitizeString(
  value: string,
  opts: SanitizeOptions = {}
): string {
  const { toLowerCase = false, collapseSpaces = true } = opts;

  let result = value.trim();
  result = result.normalize("NFC");
  result = result.replace(/[\u0000-\u001F\u007F]/g, "");

  if (collapseSpaces) {
    result = result.replace(/\s+/g, " ");
  }

  if (toLowerCase) {
    result = result.toLowerCase();
  }

  return result;
}
