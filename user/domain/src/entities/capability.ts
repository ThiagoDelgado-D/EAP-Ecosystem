import { ModuleKey } from "./module.js";

export const CapabilityKey = {
  RESOURCE_LIBRARY: ModuleKey.RESOURCE_LIBRARY,
  RESOURCE_LIBRARY_URL_IMPORT: "resource-library.url-import",
  RESOURCE_LIBRARY_VOICE_CAPTURE: "resource-library.voice-capture",
  RESOURCE_LIBRARY_FILE_IMPORT: "resource-library.file-import",
  LEARNING_PATHS: ModuleKey.LEARNING_PATHS,
  LEARNING_PATHS_GRAPH: "learning-paths.graph",
  POMODORO: ModuleKey.POMODORO,
  POMODORO_BREAKS: "pomodoro.breaks",
  POMODORO_WEEKLY_SUMMARY: "pomodoro.weekly-summary",
  POMODORO_PATH_FOCUS: "pomodoro.path-focus",
  POMODORO_SUGGESTION: "pomodoro.suggestion",
  RECOMMENDATION: ModuleKey.RECOMMENDATION,
  RECOMMENDATION_CALIBRATION: "recommendation.calibration",
  RECOMMENDATION_PATH_STEPS: "recommendation.path-steps",
  BETA_CHANNEL: "beta-channel",
} as const;

export type CapabilityKey = (typeof CapabilityKey)[keyof typeof CapabilityKey];

export const CapabilityState = {
  ENABLED: "enabled",
  DISABLED: "disabled",
  LOCKED: "locked",
} as const;

export type CapabilityState =
  (typeof CapabilityState)[keyof typeof CapabilityState];

export const CapabilityStage = {
  STABLE: "stable",
  BETA: "beta",
} as const;

export type CapabilityStage =
  (typeof CapabilityStage)[keyof typeof CapabilityStage];

export interface CapabilityDefinition {
  key: CapabilityKey;
  parent?: CapabilityKey;
  requires: readonly CapabilityKey[];
  stage: CapabilityStage;
}

export interface ResolvedCapability {
  state: CapabilityState;
  stage: CapabilityStage;
}

export type Capabilities = Record<CapabilityKey, ResolvedCapability>;

export interface CapabilityPreferences {
  enabledModules: readonly ModuleKey[];
  joinedBetaChannel: boolean;
}
