import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError } from "domain-lib";
import {
  CapabilityKey,
  CapabilityState,
  ModuleKey,
  WEEKLY_GOAL_MINUTES_RANGE,
  type User,
} from "@user/domain";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import { mockEntitlementsProvider } from "../../mocks/mock-entitlements-provider.js";
import {
  generateIntakeAnswers,
  generateUser,
  generateWeeklyGoalMinutes,
} from "../../mocks/factories.js";
import { UserNotFoundError } from "../../errors/user-not-found.js";
import { applyIntake } from "./apply-intake.js";

const FRACTIONAL_WEEKLY_GOAL = WEEKLY_GOAL_MINUTES_RANGE.MIN + 0.5;

describe("applyIntake", () => {
  let userRepository: ReturnType<typeof mockUserRepository>;
  let entitlementsProvider: ReturnType<typeof mockEntitlementsProvider>;
  let learnerRetakingIntake: User;

  beforeEach(() => {
    userRepository = mockUserRepository();
    entitlementsProvider = mockEntitlementsProvider();

    learnerRetakingIntake = generateUser({
      intake: generateIntakeAnswers(),
      enabledModules: [ModuleKey.LEARNING_PATHS, ModuleKey.POMODORO],
    });
  });

  const deps = () => ({ userRepository, entitlementsProvider });

  const confirmedSetup = () => ({
    userId: learnerRetakingIntake.id,
    intake: generateIntakeAnswers(),
    enabledModules: [ModuleKey.POMODORO],
    weeklyGoalMinutes: generateWeeklyGoalMinutes(),
  });

  test("Should return UserNotFoundError when user does not exist", async () => {
    const result = await applyIntake(deps(), confirmedSetup());

    expect(result).toBeInstanceOf(UserNotFoundError);
  });

  test("Should replace the stored answers, modules and weekly goal with the confirmed setup", async () => {
    await userRepository.save(learnerRetakingIntake);
    const setup = confirmedSetup();

    await applyIntake(deps(), setup);

    const stored = await userRepository.findById(learnerRetakingIntake.id);
    expect(stored!.intake).toEqual(setup.intake);
    expect(stored!.enabledModules).toEqual(setup.enabledModules);
    expect(stored!.appearance.weeklyGoalMinutes).toBe(setup.weeklyGoalMinutes);
  });

  test("Should keep the rest of the appearance unchanged", async () => {
    await userRepository.save(learnerRetakingIntake);
    const setup = confirmedSetup();

    await applyIntake(deps(), setup);

    const stored = await userRepository.findById(learnerRetakingIntake.id);
    expect(stored!.appearance).toEqual({
      language: learnerRetakingIntake.appearance.language,
      timezone: learnerRetakingIntake.appearance.timezone,
      startOfWeek: learnerRetakingIntake.appearance.startOfWeek,
      reduceMotion: learnerRetakingIntake.appearance.reduceMotion,
      compactMode: learnerRetakingIntake.appearance.compactMode,
      weeklyGoalMinutes: setup.weeklyGoalMinutes,
    });
  });

  test("Should return the applied setup with capabilities that follow the new modules", async () => {
    await userRepository.save(learnerRetakingIntake);
    const setup = confirmedSetup();

    const result = await applyIntake(deps(), setup);
    if (result instanceof UserNotFoundError || result instanceof InvalidDataError) throw result;

    expect(result.intake).toEqual(setup.intake);
    expect(result.enabledModules).toEqual(setup.enabledModules);
    expect(result.weeklyGoalMinutes).toBe(setup.weeklyGoalMinutes);
    expect(result.capabilities[CapabilityKey.POMODORO].state).toBe(CapabilityState.ENABLED);
    expect(result.capabilities[CapabilityKey.LEARNING_PATHS].state).toBe(
      CapabilityState.DISABLED,
    );
  });

  test.each([
    ["below the minimum", WEEKLY_GOAL_MINUTES_RANGE.MIN - 1],
    ["above the maximum", WEEKLY_GOAL_MINUTES_RANGE.MAX + 1],
    ["not an integer", FRACTIONAL_WEEKLY_GOAL],
  ])(
    "Should return InvalidDataError and keep the stored setup when weekly goal minutes is %s",
    async (_scenario, invalidWeeklyGoal) => {
      await userRepository.save(learnerRetakingIntake);

      const result = await applyIntake(deps(), {
        ...confirmedSetup(),
        weeklyGoalMinutes: invalidWeeklyGoal,
      });

      expect(result).toBeInstanceOf(InvalidDataError);
      const stored = await userRepository.findById(learnerRetakingIntake.id);
      expect(stored!.intake).toEqual(learnerRetakingIntake.intake);
      expect(stored!.enabledModules).toEqual(learnerRetakingIntake.enabledModules);
    },
  );
});
