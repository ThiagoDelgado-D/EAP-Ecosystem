import { faker } from "@faker-js/faker";
import type { SignInChallenge } from "@user/domain";
import type { UUID } from "domain-lib";

const SIGN_IN_CODE_LENGTH = 6;
const SIGN_IN_CHALLENGE_TTL_MS = 10 * 60 * 1000;

export const generateEmail = (): string => faker.internet.email().toLowerCase();

export const generateDistinctEmails = (count: number): string[] =>
  faker.helpers.uniqueArray(generateEmail, count);

export const generateMalformedEmail = (): string => faker.lorem.word();

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
