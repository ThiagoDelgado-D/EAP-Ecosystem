import type { Entity, Person, TimestampedEntity } from "domain-lib";

export type FeatureKey =
  | "learning-paths"
  | "knowledge-graph"
  | "pomodoro"
  | "spaced-repetition";

export type WidgetKey =
  | "system-check"
  | "ideal-match"
  | "focus-pulse"
  | "architects-pulse"
  | "pending-tasks";

export interface User extends Entity, Person, TimestampedEntity {
  userName?: string | null;
  enabled: boolean;
  featureConfig: FeatureKey[];
  widgetConfig: WidgetKey[];
}
