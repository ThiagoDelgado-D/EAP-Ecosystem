export interface EnumOption<T extends string = string> {
  value: T;
  label: string;
  /** Tailwind classes applied to the badge pill (bg + text color). */
  badgeClass: string;
  /** Tailwind bg class for the small dot shown in the dropdown list. */
  dotClass: string;
}
