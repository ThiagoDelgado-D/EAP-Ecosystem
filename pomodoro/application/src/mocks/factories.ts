import { faker } from "@faker-js/faker";
import {
  SegmentTargetKind,
  type Break,
  type Segment,
  type Session,
} from "@pomodoro/domain";
import type { UUID } from "domain-lib";
import type { MockedSessionRepository } from "./mock-session-repository.js";
import type { MockedBreakRepository } from "./mock-break-repository.js";

export const generateSession = (opts?: Partial<Session>): Session => ({
  id: faker.string.uuid() as UUID,
  userId: faker.string.uuid() as UUID,
  startedAt: faker.date.recent({ days: 14 }),
  plannedMin: faker.helpers.arrayElement([15, 25, 50, 90]),
  ...opts,
});

export const generateSegment = (opts?: Partial<Segment>): Segment => {
  const base = {
    id: faker.string.uuid() as UUID,
    sessionId: faker.string.uuid() as UUID,
    startSec: 0,
    targetKind: SegmentTargetKind.FREE,
  };
  return { ...base, ...opts } as Segment;
};

export const generateBreak = (opts?: Partial<Break>): Break => ({
  id: faker.string.uuid() as UUID,
  userId: faker.string.uuid() as UUID,
  startedAt: faker.date.recent({ days: 14 }),
  durationSec: 300,
  ...opts,
});

export const seedSession = (
  repo: MockedSessionRepository,
  opts?: Partial<Session>,
): Session => {
  const session = generateSession(opts);
  repo.sessions.push(session);
  return session;
};

export const seedSegment = (
  repo: MockedSessionRepository,
  opts?: Partial<Segment>,
): Segment => {
  const segment = generateSegment(opts);
  repo.segments.push(segment);
  return segment;
};

export const seedBreak = (
  repo: MockedBreakRepository,
  opts?: Partial<Break>,
): Break => {
  const activeBreak = generateBreak(opts);
  repo.breaks.push(activeBreak);
  return activeBreak;
};
