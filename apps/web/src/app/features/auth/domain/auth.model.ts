export const MODULE_KEY = {
  RESOURCE_LIBRARY: 'resource-library',
  LEARNING_PATHS: 'learning-paths',
  POMODORO: 'pomodoro',
  RECOMMENDATION: 'recommendation',
} as const;

export type ModuleKey = (typeof MODULE_KEY)[keyof typeof MODULE_KEY];

export type OptionalModuleKey = Exclude<ModuleKey, typeof MODULE_KEY.RESOURCE_LIBRARY>;

export const OPTIONAL_MODULES: readonly OptionalModuleKey[] = [
  MODULE_KEY.LEARNING_PATHS,
  MODULE_KEY.POMODORO,
  MODULE_KEY.RECOMMENDATION,
];

export const isOptionalModule = (key: string): key is OptionalModuleKey =>
  (OPTIONAL_MODULES as readonly string[]).includes(key);

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  onboardingCompleted: boolean;
  enabledModules: OptionalModuleKey[];
}
