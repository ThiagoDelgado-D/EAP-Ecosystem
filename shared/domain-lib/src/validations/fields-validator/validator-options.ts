/**
 * Common options for all validators
 */
export interface ValidatorOptions {
  /**
   * Whether the field is required
   * @default true
   */
  required?: boolean;

  /**
   * Custom error message when field is required but missing
   */
  requiredMessage?: string;

  /**
   * Custom error message when type is invalid
   */
  typeMessage?: string;
}
