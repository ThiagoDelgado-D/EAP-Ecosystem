import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService } from "domain-lib";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import { resetPreferences } from "./reset-preferences.js";
import { UserNotFoundError } from "../../errors/user-not-found.js";
import { FeatureKey, type User } from "@user/domain";

describe("resetPreferences", () => {
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
      featureConfig: [FeatureKey.LEARNING_PATHS, FeatureKey.POMODORO],
      widgetConfig: ["focus-pulse", "architects-pulse"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const deps = () => ({ userRepository });

  test("Should return UserNotFoundError when user does not exist", async () => {
    const result = await resetPreferences(deps(), {
      userId: "non-existent-id",
    });

    expect(result).toBeInstanceOf(UserNotFoundError);
  });

  test("Should set featureConfig to an empty array", async () => {
    await userRepository.save(existingUser);

    await resetPreferences(deps(), { userId: existingUser.id });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.featureConfig).toEqual([]);
  });

  test("Should set widgetConfig to an empty array", async () => {
    await userRepository.save(existingUser);

    await resetPreferences(deps(), { userId: existingUser.id });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.widgetConfig).toEqual([]);
  });

  test("Should clear both featureConfig and widgetConfig in a single call", async () => {
    await userRepository.save(existingUser);

    await resetPreferences(deps(), { userId: existingUser.id });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.featureConfig).toEqual([]);
    expect(updated!.widgetConfig).toEqual([]);
  });

  test("Should return empty arrays in the response", async () => {
    await userRepository.save(existingUser);

    const result = await resetPreferences(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.featureConfig).toEqual([]);
    expect(result.widgetConfig).toEqual([]);
  });

  test("Should not modify fields unrelated to preferences", async () => {
    await userRepository.save(existingUser);

    await resetPreferences(deps(), { userId: existingUser.id });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.email).toBe(existingUser.email);
    expect(updated!.firstName).toBe(existingUser.firstName);
    expect(updated!.onboardingCompleted).toBe(true);
    expect(updated!.enabled).toBe(true);
  });

  test("Should complete without error when preferences are already empty", async () => {
    const userWithEmptyConfig: User = {
      ...existingUser,
      featureConfig: [],
      widgetConfig: [],
    };
    await userRepository.save(userWithEmptyConfig);

    const result = await resetPreferences(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.featureConfig).toEqual([]);
    expect(result.widgetConfig).toEqual([]);
  });
});
