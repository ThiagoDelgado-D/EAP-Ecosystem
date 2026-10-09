import { beforeEach, describe, expect, test } from "vitest";
import { InvalidDataError, mockCryptoService } from "domain-lib";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import { updateUserAppearance } from "./update-user-appearance.js";
import { UserNotFoundError } from "../../errors/user-not-found.js";
import {
  DEFAULT_APPEARANCE,
  LanguageCode,
  StartOfWeek,
  WEEKLY_GOAL_MINUTES_RANGE,
  type User,
} from "@user/domain";

const TWELVE_HOUR_WEEKLY_GOAL = 720;
const FRACTIONAL_WEEKLY_GOAL = 720.5;

describe("updateUserAppearance", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let existingUser: User;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    userRepository = mockUserRepository();

    existingUser = {
      id: await cryptoService.generateUUID(),
      email: "thiago@example.com",
      firstName: "Thiago",
      lastName: "Delgado",
      userName: null,
      enabled: true,
      onboardingCompleted: true,
      featureConfig: [],
      widgetConfig: [],
      appearance: DEFAULT_APPEARANCE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const deps = () => ({ userRepository });

  test("Should return UserNotFoundError when user does not exist", async () => {
    const result = await updateUserAppearance(deps(), {
      userId: "non-existent-id",
      appearance: { language: LanguageCode.ES },
    });

    expect(result).toBeInstanceOf(UserNotFoundError);
  });

  test("Should persist the updated appearance", async () => {
    await userRepository.save(existingUser);

    await updateUserAppearance(deps(), {
      userId: existingUser.id,
      appearance: { language: LanguageCode.ES },
    });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.appearance.language).toBe(LanguageCode.ES);
  });

  test("Should return the updated appearance in the response", async () => {
    await userRepository.save(existingUser);

    const result = await updateUserAppearance(deps(), {
      userId: existingUser.id,
      appearance: { timezone: "America/Argentina/Buenos_Aires" },
    });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.appearance.timezone).toBe("America/Argentina/Buenos_Aires");
  });

  test("Should perform a partial update, preserving fields not included in the request", async () => {
    await userRepository.save(existingUser);

    await updateUserAppearance(deps(), {
      userId: existingUser.id,
      appearance: { language: LanguageCode.ES },
    });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.appearance.language).toBe(LanguageCode.ES);
    expect(updated!.appearance.timezone).toBe(DEFAULT_APPEARANCE.timezone);
    expect(updated!.appearance.startOfWeek).toBe(DEFAULT_APPEARANCE.startOfWeek);
    expect(updated!.appearance.reduceMotion).toBe(DEFAULT_APPEARANCE.reduceMotion);
    expect(updated!.appearance.compactMode).toBe(DEFAULT_APPEARANCE.compactMode);
    expect(updated!.appearance.weeklyGoalMinutes).toBe(DEFAULT_APPEARANCE.weeklyGoalMinutes);
  });

  test("Should update all appearance fields at once", async () => {
    await userRepository.save(existingUser);

    const fullUpdate = {
      language: LanguageCode.ES,
      timezone: "America/Argentina/Buenos_Aires",
      startOfWeek: StartOfWeek.SUNDAY,
      reduceMotion: true,
      compactMode: true,
      weeklyGoalMinutes: TWELVE_HOUR_WEEKLY_GOAL,
    };

    const result = await updateUserAppearance(deps(), {
      userId: existingUser.id,
      appearance: fullUpdate,
    });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.appearance).toEqual(fullUpdate);
  });

  test("Should not modify fields unrelated to appearance", async () => {
    await userRepository.save(existingUser);

    await updateUserAppearance(deps(), {
      userId: existingUser.id,
      appearance: { compactMode: true },
    });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.email).toBe(existingUser.email);
    expect(updated!.firstName).toBe(existingUser.firstName);
    expect(updated!.featureConfig).toEqual(existingUser.featureConfig);
    expect(updated!.widgetConfig).toEqual(existingUser.widgetConfig);
    expect(updated!.onboardingCompleted).toBe(existingUser.onboardingCompleted);
  });

  test("Should update updatedAt when appearance is changed", async () => {
    await userRepository.save(existingUser);
    const before = existingUser.updatedAt;

    await updateUserAppearance(deps(), {
      userId: existingUser.id,
      appearance: { reduceMotion: true },
    });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  test("Should keep stored fields when the request carries them as undefined", async () => {
    await userRepository.save(existingUser);

    const result = await updateUserAppearance(deps(), {
      userId: existingUser.id,
      appearance: { language: undefined, weeklyGoalMinutes: TWELVE_HOUR_WEEKLY_GOAL },
    });

    if (result instanceof Error) throw result;
    expect(result.appearance).toEqual({
      ...DEFAULT_APPEARANCE,
      weeklyGoalMinutes: TWELVE_HOUR_WEEKLY_GOAL,
    });
  });

  test("Should persist the weekly goal minutes", async () => {
    await userRepository.save(existingUser);

    await updateUserAppearance(deps(), {
      userId: existingUser.id,
      appearance: { weeklyGoalMinutes: TWELVE_HOUR_WEEKLY_GOAL },
    });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.appearance.weeklyGoalMinutes).toBe(TWELVE_HOUR_WEEKLY_GOAL);
  });

  test.each([
    ["below the minimum", WEEKLY_GOAL_MINUTES_RANGE.MIN - 1],
    ["above the maximum", WEEKLY_GOAL_MINUTES_RANGE.MAX + 1],
    ["not an integer", FRACTIONAL_WEEKLY_GOAL],
  ])(
    "Should return InvalidDataError and keep the stored goal when weekly goal minutes is %s",
    async (_scenario, invalidWeeklyGoal) => {
      await userRepository.save(existingUser);

      const result = await updateUserAppearance(deps(), {
        userId: existingUser.id,
        appearance: { weeklyGoalMinutes: invalidWeeklyGoal },
      });

      expect(result).toBeInstanceOf(InvalidDataError);
      const stored = await userRepository.findById(existingUser.id);
      expect(stored!.appearance.weeklyGoalMinutes).toBe(DEFAULT_APPEARANCE.weeklyGoalMinutes);
    },
  );
});
