import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService } from "domain-lib";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import { getFeatureConfig } from "./get-feature-config.js";
import { UserNotFoundError } from "../../errors/user-not-found.js";
import { FeatureKey, type User } from "@user/domain";

describe("getFeatureConfig", () => {
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
      widgetConfig: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const deps = () => ({ userRepository });

  test("Should return UserNotFoundError when user does not exist", async () => {
    const result = await getFeatureConfig(deps(), { userId: "non-existent-id" });

    expect(result).toBeInstanceOf(UserNotFoundError);
  });

  test("Should return the featureConfig for an existing user", async () => {
    await userRepository.save(existingUser);

    const result = await getFeatureConfig(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.featureConfig).toEqual([FeatureKey.LEARNING_PATHS, FeatureKey.POMODORO]);
  });

  test("Should return an empty array when featureConfig is empty", async () => {
    const userWithEmptyConfig: User = { ...existingUser, featureConfig: [] };
    await userRepository.save(userWithEmptyConfig);

    const result = await getFeatureConfig(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.featureConfig).toEqual([]);
  });

  test("Should return all feature keys when all are enabled", async () => {
    const allKeys = Object.values(FeatureKey) as FeatureKey[];
    await userRepository.save({ ...existingUser, featureConfig: allKeys });

    const result = await getFeatureConfig(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.featureConfig).toEqual(allKeys);
  });

  test("Should not modify the user record", async () => {
    await userRepository.save(existingUser);

    await getFeatureConfig(deps(), { userId: existingUser.id });

    const unchanged = await userRepository.findById(existingUser.id);
    expect(unchanged!.featureConfig).toEqual(existingUser.featureConfig);
    expect(unchanged!.updatedAt).toEqual(existingUser.updatedAt);
  });

  test("Should return an empty array when featureConfig is null at runtime (defensive null-coalescing)", async () => {
    await userRepository.save({ ...existingUser, featureConfig: null as any });

    const result = await getFeatureConfig(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.featureConfig).toEqual([]);
  });
});
