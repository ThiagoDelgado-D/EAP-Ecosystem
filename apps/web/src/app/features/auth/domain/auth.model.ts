export const FEATURE_KEY = {
  LEARNING_PATHS: 'learning-paths',
  KNOWLEDGE_GRAPH: 'knowledge-graph',
  POMODORO: 'pomodoro',
  SPACED_REPETITION: 'spaced-repetition',
} as const;

export type FeatureKey = (typeof FEATURE_KEY)[keyof typeof FEATURE_KEY];

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  onboardingCompleted: boolean;
  featureConfig: FeatureKey[];
}
