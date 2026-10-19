import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService } from "domain-lib";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import { completeOnboarding } from "./complete-onboarding.js";
import { UserNotFoundError } from "../../errors/user-not-found.js";
import { ModuleKey, type User } from "@user/domain";

describe("completeOnboarding", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let existingUser: User;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    userRepository = mockUserRepository();

    existingUser = {
      id: await cryptoService.generateUUID(),
      email: "thiago@example.com",
      firstName: "",
      lastName: "",
      userName: null,
      enabled: true,
      onboardingCompleted: false,
      enabledModules: [],
      widgetConfig: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  test("Should return UserNotFoundError when user does not exist", async () => {
    const result = await completeOnboarding(
      { userRepository },
      { userId: "non-existent-id", firstName: "Thiago", enabledModules: [] },
    );

    expect(result).toBeInstanceOf(UserNotFoundError);
  });

  test("Should set onboardingCompleted to true", async () => {
    await userRepository.save(existingUser);

    await completeOnboarding(
      { userRepository },
      { userId: existingUser.id, firstName: "Thiago", enabledModules: [] },
    );

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.onboardingCompleted).toBe(true);
  });

  test("Should persist the provided firstName", async () => {
    await userRepository.save(existingUser);

    await completeOnboarding(
      { userRepository },
      { userId: existingUser.id, firstName: "Thiago", enabledModules: [] },
    );

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.firstName).toBe("Thiago");
  });

  test("Should persist the provided enabledModules", async () => {
    await userRepository.save(existingUser);

    await completeOnboarding(
      { userRepository },
      {
        userId: existingUser.id,
        firstName: "Thiago",
        enabledModules: [ModuleKey.LEARNING_PATHS, ModuleKey.POMODORO],
      },
    );

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.enabledModules).toEqual([ModuleKey.LEARNING_PATHS, ModuleKey.POMODORO]);
  });

  test("Should return the updated user data", async () => {
    await userRepository.save(existingUser);

    const result = await completeOnboarding(
      { userRepository },
      {
        userId: existingUser.id,
        firstName: "Thiago",
        enabledModules: [ModuleKey.LEARNING_PATHS],
      },
    );

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.user.id).toBe(existingUser.id);
    expect(result.user.email).toBe(existingUser.email);
    expect(result.user.firstName).toBe("Thiago");
    expect(result.user.onboardingCompleted).toBe(true);
    expect(result.user.enabledModules).toEqual([ModuleKey.LEARNING_PATHS]);
  });

  test("Should not modify fields unrelated to onboarding", async () => {
    await userRepository.save(existingUser);

    await completeOnboarding(
      { userRepository },
      { userId: existingUser.id, firstName: "Thiago", enabledModules: [] },
    );

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.email).toBe(existingUser.email);
    expect(updated!.widgetConfig).toEqual([]);
    expect(updated!.enabled).toBe(true);
  });

  test("Should complete onboarding with every optional module turned off", async () => {
    await userRepository.save(existingUser);

    const result = await completeOnboarding(
      { userRepository },
      { userId: existingUser.id, firstName: "Thiago", enabledModules: [] },
    );

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.user.enabledModules).toEqual([]);
  });
});
