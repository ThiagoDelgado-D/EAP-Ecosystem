import { beforeEach, describe, expect, test } from "vitest";
import { mockCurrentUser } from "domain-lib";
import { createBreakLifecycleFixture, type BreakLifecycleFixture } from "../../mocks/index.js";
import { extendBreak } from "./extend-break.js";
import { BreakNotFoundError } from "../../errors/break-not-found.js";
import { BreakForbiddenError } from "../../errors/break-forbidden.js";
import { BreakNotActiveError } from "../../errors/break-not-active.js";

describe("extendBreak", () => {
  let fixture: BreakLifecycleFixture;

  beforeEach(async () => {
    fixture = await createBreakLifecycleFixture();
  });

  test("should add the given seconds to the break's durationSec", async () => {
    const { breakRepository, currentUser, startActiveBreak } = fixture;
    const activeBreak = await startActiveBreak();

    const result = await extendBreak(
      { breakRepository, currentUser },
      { breakId: activeBreak.id, seconds: 60 },
    );

    expect(result).toMatchObject({
      id: activeBreak.id,
      durationSec: activeBreak.durationSec + 60,
    });
  });

  test("should return BreakNotFoundError when the break does not exist", async () => {
    const { breakRepository, cryptoService, currentUser } = fixture;
    const nonExistentBreakId = await cryptoService.generateUUID();

    const result = await extendBreak(
      { breakRepository, currentUser },
      { breakId: nonExistentBreakId, seconds: 60 },
    );

    expect(result).toBeInstanceOf(BreakNotFoundError);
  });

  test("should return BreakForbiddenError when the break belongs to another user", async () => {
    const { breakRepository, cryptoService, startActiveBreak } = fixture;
    const activeBreak = await startActiveBreak();
    const intruder = await mockCurrentUser(cryptoService);

    const result = await extendBreak(
      { breakRepository, currentUser: intruder },
      { breakId: activeBreak.id, seconds: 60 },
    );

    expect(result).toBeInstanceOf(BreakForbiddenError);
  });

  test("should return BreakNotActiveError when the break already ended", async () => {
    const { breakRepository, currentUser, startActiveBreak } = fixture;
    const activeBreak = await startActiveBreak();
    await breakRepository.update({ ...activeBreak, endedAt: new Date() });

    const result = await extendBreak(
      { breakRepository, currentUser },
      { breakId: activeBreak.id, seconds: 60 },
    );

    expect(result).toBeInstanceOf(BreakNotActiveError);
  });
});
