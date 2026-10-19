export const ModuleKey = {
  RESOURCE_LIBRARY: "resource-library",
  LEARNING_PATHS: "learning-paths",
  POMODORO: "pomodoro",
  RECOMMENDATION: "recommendation",
} as const;

export type ModuleKey = (typeof ModuleKey)[keyof typeof ModuleKey];

export interface ModuleDefinition {
  key: ModuleKey;
  canBeTurnedOff: boolean;
}

export const MODULE_CATALOG: readonly ModuleDefinition[] = [
  { key: ModuleKey.RESOURCE_LIBRARY, canBeTurnedOff: false },
  { key: ModuleKey.LEARNING_PATHS, canBeTurnedOff: true },
  { key: ModuleKey.POMODORO, canBeTurnedOff: true },
  { key: ModuleKey.RECOMMENDATION, canBeTurnedOff: true },
];

export const OPTIONAL_MODULES: readonly ModuleKey[] = MODULE_CATALOG.filter(
  (module) => module.canBeTurnedOff,
).map((module) => module.key);

export const isOptionalModule = (key: string): key is ModuleKey =>
  (OPTIONAL_MODULES as readonly string[]).includes(key);

export const DEFAULT_ENABLED_MODULES: readonly ModuleKey[] = OPTIONAL_MODULES;
