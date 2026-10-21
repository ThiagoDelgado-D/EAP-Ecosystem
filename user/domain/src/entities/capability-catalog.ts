import {
  CapabilityKey,
  CapabilityStage,
  type CapabilityDefinition,
} from "./capability.js";

export const CAPABILITY_CATALOG: readonly CapabilityDefinition[] = [
  { key: CapabilityKey.RESOURCE_LIBRARY, requires: [], stage: CapabilityStage.STABLE },
  {
    key: CapabilityKey.RESOURCE_LIBRARY_URL_IMPORT,
    parent: CapabilityKey.RESOURCE_LIBRARY,
    requires: [],
    stage: CapabilityStage.STABLE,
  },
  {
    key: CapabilityKey.RESOURCE_LIBRARY_VOICE_CAPTURE,
    parent: CapabilityKey.RESOURCE_LIBRARY,
    requires: [],
    stage: CapabilityStage.STABLE,
  },
  {
    key: CapabilityKey.RESOURCE_LIBRARY_FILE_IMPORT,
    parent: CapabilityKey.RESOURCE_LIBRARY,
    requires: [],
    stage: CapabilityStage.STABLE,
  },
  { key: CapabilityKey.LEARNING_PATHS, requires: [], stage: CapabilityStage.STABLE },
  {
    key: CapabilityKey.LEARNING_PATHS_GRAPH,
    parent: CapabilityKey.LEARNING_PATHS,
    requires: [],
    stage: CapabilityStage.STABLE,
  },
  { key: CapabilityKey.POMODORO, requires: [], stage: CapabilityStage.STABLE },
  {
    key: CapabilityKey.POMODORO_BREAKS,
    parent: CapabilityKey.POMODORO,
    requires: [],
    stage: CapabilityStage.STABLE,
  },
  {
    key: CapabilityKey.POMODORO_WEEKLY_SUMMARY,
    parent: CapabilityKey.POMODORO,
    requires: [],
    stage: CapabilityStage.STABLE,
  },
  {
    key: CapabilityKey.POMODORO_PATH_FOCUS,
    parent: CapabilityKey.POMODORO,
    requires: [CapabilityKey.LEARNING_PATHS],
    stage: CapabilityStage.STABLE,
  },
  {
    key: CapabilityKey.POMODORO_SUGGESTION,
    parent: CapabilityKey.POMODORO,
    requires: [CapabilityKey.RECOMMENDATION],
    stage: CapabilityStage.STABLE,
  },
  { key: CapabilityKey.RECOMMENDATION, requires: [], stage: CapabilityStage.STABLE },
  {
    key: CapabilityKey.RECOMMENDATION_CALIBRATION,
    parent: CapabilityKey.RECOMMENDATION,
    requires: [],
    stage: CapabilityStage.STABLE,
  },
  {
    key: CapabilityKey.RECOMMENDATION_PATH_STEPS,
    parent: CapabilityKey.RECOMMENDATION,
    requires: [CapabilityKey.LEARNING_PATHS],
    stage: CapabilityStage.STABLE,
  },
  { key: CapabilityKey.BETA_CHANNEL, requires: [], stage: CapabilityStage.STABLE },
];
