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

export const CAPABILITY_KEY = {
  RESOURCE_LIBRARY: MODULE_KEY.RESOURCE_LIBRARY,
  RESOURCE_LIBRARY_URL_IMPORT: 'resource-library.url-import',
  RESOURCE_LIBRARY_VOICE_CAPTURE: 'resource-library.voice-capture',
  RESOURCE_LIBRARY_FILE_IMPORT: 'resource-library.file-import',
  LEARNING_PATHS: MODULE_KEY.LEARNING_PATHS,
  LEARNING_PATHS_GRAPH: 'learning-paths.graph',
  POMODORO: MODULE_KEY.POMODORO,
  POMODORO_BREAKS: 'pomodoro.breaks',
  POMODORO_WEEKLY_SUMMARY: 'pomodoro.weekly-summary',
  POMODORO_PATH_FOCUS: 'pomodoro.path-focus',
  POMODORO_SUGGESTION: 'pomodoro.suggestion',
  RECOMMENDATION: MODULE_KEY.RECOMMENDATION,
  RECOMMENDATION_CALIBRATION: 'recommendation.calibration',
  RECOMMENDATION_PATH_STEPS: 'recommendation.path-steps',
  BETA_CHANNEL: 'beta-channel',
} as const;

export type CapabilityKey = (typeof CAPABILITY_KEY)[keyof typeof CAPABILITY_KEY];

export const CAPABILITY_STATE = {
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  LOCKED: 'locked',
} as const;

export type CapabilityState = (typeof CAPABILITY_STATE)[keyof typeof CAPABILITY_STATE];

export const CAPABILITY_STAGE = {
  STABLE: 'stable',
  BETA: 'beta',
} as const;

export type CapabilityStage = (typeof CAPABILITY_STAGE)[keyof typeof CAPABILITY_STAGE];

export interface ResolvedCapability {
  state: CapabilityState;
  stage: CapabilityStage;
}

export type Capabilities = Partial<Record<CapabilityKey, ResolvedCapability>>;

export interface ModulePreferences {
  enabledModules: OptionalModuleKey[];
  capabilities: Capabilities;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  onboardingCompleted: boolean;
  enabledModules: OptionalModuleKey[];
  capabilities: Capabilities;
}
