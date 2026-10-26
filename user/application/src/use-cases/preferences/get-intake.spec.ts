import { beforeEach, describe, expect, test } from "vitest";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import { generateIntakeAnswers, generateUser } from "../../mocks/factories.js";
import { UserNotFoundError } from "../../errors/user-not-found.js";
import { getIntake } from "./get-intake.js";

describe("getIntake", () => {
  let userRepository: ReturnType<typeof mockUserRepository>;

  beforeEach(() => {
    userRepository = mockUserRepository();
  });

  test("Should return UserNotFoundError when user does not exist", async () => {
    const result = await getIntake({ userRepository }, { userId: "non-existent-id" });

    expect(result).toBeInstanceOf(UserNotFoundError);
  });

  test("Should return the answers the learner gave", async () => {
    const intake = generateIntakeAnswers();
    const learnerWithIntake = generateUser({ intake });
    await userRepository.save(learnerWithIntake);

    const result = await getIntake({ userRepository }, { userId: learnerWithIntake.id });
    if (result instanceof UserNotFoundError) throw result;

    expect(result.intake).toEqual(intake);
  });

  test("Should return no answers for a learner who skipped the intake", async () => {
    const learnerWhoSkipped = generateUser({ intake: null });
    await userRepository.save(learnerWhoSkipped);

    const result = await getIntake({ userRepository }, { userId: learnerWhoSkipped.id });
    if (result instanceof UserNotFoundError) throw result;

    expect(result.intake).toBeNull();
  });
});
