import { beforeEach, describe, expect, test } from "vitest";
import { BaseError, mockCurrentUser } from "domain-lib";
import { createBreakLifecycleFixture, type BreakLifecycleFixture } from "../../mocks/index.js";
import { endBreak } from "./end-break.js";
import { getActiveBreak } from "./get-active-break.js";
import { BreakNotFoundError } from "../../errors/break-not-found.js";
import { BreakForbiddenError } from "../../errors/break-forbidden.js";
import { BreakNotActiveError } from "../../errors/break-not-active.js";

describe("endBreak", () => {
  let fixture: BreakLifecycleFixture;

  beforeEach(async () => {
    fixture = await createBreakLifecycleFixture();
  });

  test("should set endedAt and clear the active break", async () => {
    const { breakRepository, currentUser, startActiveBreak } = fixture;
    const activeBreak = await startActiveBreak();

    const result = await endBreak(
      { breakRepository, currentUser },
      { breakId: activeBreak.id },
    );
    if (result instanceof BaseError) throw result;

    expect(result.id).toBe(activeBreak.id);
    expect(result.endedAt).toBeInstanceOf(Date);

    const activeAfterEnd = await getActiveBreak({ breakRepository, currentUser });
    expect(activeAfterEnd).toBeNull();
  });

  test("should return BreakNotFoundError when the break does not exist", async () => {
    const { breakRepository, cryptoService, currentUser } = fixture;
    const nonExistentBreakId = await cryptoService.generateUUID();

    const result = await endBreak(
      { breakRepository, currentUser },
      { breakId: nonExistentBreakId },
    );

    expect(result).toBeInstanceOf(BreakNotFoundError);
  });

  test("should return BreakForbiddenError when the break belongs to another user", async () => {
    const { breakRepository, cryptoService, startActiveBreak } = fixture;
    const activeBreak = await startActiveBreak();
    const intruder = await mockCurrentUser(cryptoService);

    const result = await endBreak(
      { breakRepository, currentUser: intruder },
      { breakId: activeBreak.id },
    );

    expect(result).toBeInstanceOf(BreakForbiddenError);
  });

  test("should return BreakNotActiveError when the break already ended", async () => {
    const { breakRepository, currentUser, startActiveBreak } = fixture;
    const activeBreak = await startActiveBreak();
    await endBreak({ breakRepository, currentUser }, { breakId: activeBreak.id });

    const result = await endBreak(
      { breakRepository, currentUser },
      { breakId: activeBreak.id },
    );

    expect(result).toBeInstanceOf(BreakNotActiveError);
  });
});
