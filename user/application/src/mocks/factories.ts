import { faker } from "@faker-js/faker";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_ENABLED_MODULES,
  IntakeGoal,
  StudyStyle,
  WEEKLY_GOAL_MINUTES_RANGE,
  type IntakeAnswers,
  type SignInChallenge,
  type User,
} from "@user/domain";
import type { UUID } from "domain-lib";
import type { RefreshTokenRotationConfig } from "../use-cases/auth/refresh-session.js";

const SIGN_IN_CODE_LENGTH = 6;
const SIGN_IN_CHALLENGE_TTL_MS = 10 * 60 * 1000;

export const generateEmail = (): string => faker.internet.email().toLowerCase();

export const generateDistinctEmails = (count: number): string[] =>
  faker.helpers.uniqueArray(generateEmail, count);

export const generateMalformedEmail = (): string => faker.lorem.word();

export const generateRefreshTokenRotationConfig =
  (): RefreshTokenRotationConfig => ({
    secret: faker.string.alphanumeric(64),
    graceSeconds: faker.number.int({ min: 10, max: 60 }),
  });

export const generateSignInCode = (): string =>
  faker.string.numeric(SIGN_IN_CODE_LENGTH);

export const generateSignInChallenge = (
  opts?: Partial<SignInChallenge>,
): SignInChallenge => {
  const createdAt = opts?.createdAt ?? faker.date.recent();
  return {
    id: faker.string.uuid() as UUID,
    email: generateEmail(),
    codeHash: faker.string.alphanumeric(60),
    expiresAt: new Date(createdAt.getTime() + SIGN_IN_CHALLENGE_TTL_MS),
    attempts: 0,
    consumed: false,
    createdAt,
    ...opts,
  };
};

export const generateUser = (opts?: Partial<User>): User => ({
  id: faker.string.uuid() as UUID,
  email: generateEmail(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  userName: null,
  enabled: true,
  onboardingCompleted: true,
  enabledModules: [...DEFAULT_ENABLED_MODULES],
  widgetConfig: [],
  appearance: { ...DEFAULT_APPEARANCE },
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  ...opts,
});

export const generateIntakeAnswers = (): IntakeAnswers => ({
  goals: faker.helpers.arrayElements(Object.values(IntakeGoal), { min: 1, max: 3 }),
  studyStyle: faker.helpers.arrayElement(Object.values(StudyStyle)),
});

export const generateWeeklyGoalMinutes = (): number =>
  faker.number.int({ min: WEEKLY_GOAL_MINUTES_RANGE.MIN, max: WEEKLY_GOAL_MINUTES_RANGE.MAX });
