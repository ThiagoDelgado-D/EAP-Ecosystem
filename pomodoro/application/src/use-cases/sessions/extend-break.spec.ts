import { beforeEach, describe, expect, test } from "vitest";
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
    const { breakRepository, requestingUserId, startActiveBreak } = fixture;
    const activeBreak = await startActiveBreak();

    const result = await extendBreak(
      { breakRepository },
      { userId: requestingUserId, breakId: activeBreak.id, seconds: 60 },
    );

    expect(result).toMatchObject({
      id: activeBreak.id,
      durationSec: activeBreak.durationSec + 60,
    });
  });

  test("should return BreakNotFoundError when the break does not exist", async () => {
    const { breakRepository, cryptoService, requestingUserId } = fixture;
    const nonExistentBreakId = await cryptoService.generateUUID();

    const result = await extendBreak(
      { breakRepository },
      { userId: requestingUserId, breakId: nonExistentBreakId, seconds: 60 },
    );

    expect(result).toBeInstanceOf(BreakNotFoundError);
  });

  test("should return BreakForbiddenError when the break belongs to another user", async () => {
    const { breakRepository, cryptoService, startActiveBreak } = fixture;
    const activeBreak = await startActiveBreak();
    const intruderId = await cryptoService.generateUUID();

    const result = await extendBreak(
      { breakRepository },
      { userId: intruderId, breakId: activeBreak.id, seconds: 60 },
    );

    expect(result).toBeInstanceOf(BreakForbiddenError);
  });

  test("should return BreakNotActiveError when the break already ended", async () => {
    const { breakRepository, requestingUserId, startActiveBreak } = fixture;
    const activeBreak = await startActiveBreak();
    await breakRepository.update({ ...activeBreak, endedAt: new Date() });

    const result = await extendBreak(
      { breakRepository },
      { userId: requestingUserId, breakId: activeBreak.id, seconds: 60 },
    );

    expect(result).toBeInstanceOf(BreakNotActiveError);
  });
});
