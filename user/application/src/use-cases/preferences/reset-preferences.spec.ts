import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService } from "domain-lib";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import { mockEntitlementsProvider } from "../../mocks/mock-entitlements-provider.js";
import { resetPreferences } from "./reset-preferences.js";
import { UserNotFoundError } from "../../errors/user-not-found.js";
import {
  CapabilityState,
  DEFAULT_ENABLED_MODULES,
  ModuleKey,
  type User,
} from "@user/domain";

describe("resetPreferences", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let entitlementsProvider: ReturnType<typeof mockEntitlementsProvider>;
  let existingUser: User;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    userRepository = mockUserRepository();
    entitlementsProvider = mockEntitlementsProvider();

    existingUser = {
      id: await cryptoService.generateUUID(),
      email: "thiago@example.com",
      firstName: "Thiago",
      lastName: "Delgado",
      userName: null,
      enabled: true,
      onboardingCompleted: true,
      enabledModules: [ModuleKey.LEARNING_PATHS],
      widgetConfig: ["focus-pulse", "architects-pulse"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const deps = () => ({ userRepository, entitlementsProvider });

  test("Should return UserNotFoundError when user does not exist", async () => {
    const result = await resetPreferences(deps(), {
      userId: "non-existent-id",
    });

    expect(result).toBeInstanceOf(UserNotFoundError);
  });

  test("Should turn every optional module back on", async () => {
    await userRepository.save(existingUser);

    await resetPreferences(deps(), { userId: existingUser.id });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.enabledModules).toEqual(DEFAULT_ENABLED_MODULES);
  });

  test("Should set widgetConfig to an empty array", async () => {
    await userRepository.save(existingUser);

    await resetPreferences(deps(), { userId: existingUser.id });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.widgetConfig).toEqual([]);
  });

  test("Should reset both enabledModules and widgetConfig in a single call", async () => {
    await userRepository.save(existingUser);

    await resetPreferences(deps(), { userId: existingUser.id });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.enabledModules).toEqual(DEFAULT_ENABLED_MODULES);
    expect(updated!.widgetConfig).toEqual([]);
  });

  test("Should return the reset preferences in the response", async () => {
    await userRepository.save(existingUser);

    const result = await resetPreferences(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.enabledModules).toEqual(DEFAULT_ENABLED_MODULES);
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

  test("Should complete without error when preferences are already at their defaults", async () => {
    const userAtDefaults: User = {
      ...existingUser,
      enabledModules: [...DEFAULT_ENABLED_MODULES],
      widgetConfig: [],
    };
    await userRepository.save(userAtDefaults);

    const result = await resetPreferences(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.enabledModules).toEqual(DEFAULT_ENABLED_MODULES);
    expect(result.widgetConfig).toEqual([]);
  });

  test("Should return every module enabled again after a reset", async () => {
    await userRepository.save(existingUser);

    const result = await resetPreferences(deps(), { userId: existingUser.id });
    if (result instanceof UserNotFoundError) throw result;

    for (const module of DEFAULT_ENABLED_MODULES) {
      expect(result.capabilities[module].state).toBe(CapabilityState.ENABLED);
    }
  });
});
