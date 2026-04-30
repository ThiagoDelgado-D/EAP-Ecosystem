import type { Entity, Person, TimestampedEntity } from "domain-lib";

export const FeatureKey = {
  LEARNING_PATHS: "learning-paths",
  KNOWLEDGE_GRAPH: "knowledge-graph",
  POMODORO: "pomodoro",
  SPACED_REPETITION: "spaced-repetition",
} as const;

export type FeatureKey = (typeof FeatureKey)[keyof typeof FeatureKey];

export const WidgetKey = {
  SYSTEM_CHECK: "system-check",
  IDEAL_MATCH: "ideal-match",
  FOCUS_PULSE: "focus-pulse",
  ARCHITECTS_PULSE: "architects-pulse",
  PENDING_TASKS: "pending-tasks",
} as const;

export type WidgetKey = (typeof WidgetKey)[keyof typeof WidgetKey];

export interface User extends Entity, Person, TimestampedEntity {
  userName?: string | null;
  enabled: boolean;
  onboardingCompleted: boolean;
  featureConfig: FeatureKey[];
  widgetConfig: WidgetKey[];
}
