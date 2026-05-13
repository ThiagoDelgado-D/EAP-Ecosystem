import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService } from "domain-lib";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import { updateFeatureConfig } from "./update-feature-config.js";
import { UserNotFoundError } from "../../errors/user-not-found.js";
import { FeatureKey, type User } from "@user/domain";

describe("updateFeatureConfig", () => {
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
      featureConfig: [FeatureKey.LEARNING_PATHS],
      widgetConfig: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const deps = () => ({ userRepository });

  test("Should return UserNotFoundError when user does not exist", async () => {
    const result = await updateFeatureConfig(deps(), {
      userId: "non-existent-id",
      featureConfig: [FeatureKey.POMODORO],
    });

    expect(result).toBeInstanceOf(UserNotFoundError);
  });

  test("Should persist the new featureConfig", async () => {
    await userRepository.save(existingUser);

    await updateFeatureConfig(deps(), {
      userId: existingUser.id,
      featureConfig: [FeatureKey.POMODORO, FeatureKey.KNOWLEDGE_GRAPH],
    });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.featureConfig).toEqual([FeatureKey.POMODORO, FeatureKey.KNOWLEDGE_GRAPH]);
  });

  test("Should return the updated featureConfig in the response", async () => {
    await userRepository.save(existingUser);

    const result = await updateFeatureConfig(deps(), {
      userId: existingUser.id,
      featureConfig: [FeatureKey.SPACED_REPETITION],
    });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.featureConfig).toEqual([FeatureKey.SPACED_REPETITION]);
  });

  test("Should fully replace the previous featureConfig", async () => {
    await userRepository.save(existingUser);

    await updateFeatureConfig(deps(), {
      userId: existingUser.id,
      featureConfig: [FeatureKey.POMODORO],
    });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.featureConfig).not.toContain(FeatureKey.LEARNING_PATHS);
    expect(updated!.featureConfig).toEqual([FeatureKey.POMODORO]);
  });

  test("Should accept an empty array, clearing all enabled features", async () => {
    await userRepository.save(existingUser);

    const result = await updateFeatureConfig(deps(), {
      userId: existingUser.id,
      featureConfig: [],
    });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.featureConfig).toEqual([]);

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.featureConfig).toEqual([]);
  });

  test("Should accept all valid feature keys simultaneously", async () => {
    await userRepository.save(existingUser);
    const allKeys = Object.values(FeatureKey) as FeatureKey[];

    const result = await updateFeatureConfig(deps(), {
      userId: existingUser.id,
      featureConfig: allKeys,
    });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.featureConfig).toEqual(allKeys);
  });

  test("Should not modify fields unrelated to featureConfig", async () => {
    await userRepository.save(existingUser);

    await updateFeatureConfig(deps(), {
      userId: existingUser.id,
      featureConfig: [FeatureKey.POMODORO],
    });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.email).toBe(existingUser.email);
    expect(updated!.firstName).toBe(existingUser.firstName);
    expect(updated!.widgetConfig).toEqual(existingUser.widgetConfig);
    expect(updated!.onboardingCompleted).toBe(existingUser.onboardingCompleted);
    expect(updated!.enabled).toBe(existingUser.enabled);
  });
});
