import { beforeEach, describe, expect, test } from "vitest";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import { generateUser } from "../../mocks/factories.js";
import { mockEntitlementsProvider } from "../../mocks/mock-entitlements-provider.js";
import { getEnabledModules } from "./get-enabled-modules.js";
import { UserNotFoundError } from "../../errors/user-not-found.js";
import {
  CapabilityKey,
  CapabilityState,
  ModuleKey,
  OPTIONAL_MODULES,
  type User,
} from "@user/domain";

describe("getEnabledModules", () => {
  let userRepository: ReturnType<typeof mockUserRepository>;
  let entitlementsProvider: ReturnType<typeof mockEntitlementsProvider>;
  let existingUser: User;

  beforeEach(async () => {
    userRepository = mockUserRepository();
    entitlementsProvider = mockEntitlementsProvider();

    existingUser = generateUser({ enabledModules: [ModuleKey.LEARNING_PATHS, ModuleKey.POMODORO] });
  });

  const deps = () => ({ userRepository, entitlementsProvider });

  test("Should return UserNotFoundError when user does not exist", async () => {
    const result = await getEnabledModules(deps(), { userId: "non-existent-id" });

    expect(result).toBeInstanceOf(UserNotFoundError);
  });

  test("Should return the enabled modules for an existing user", async () => {
    await userRepository.save(existingUser);

    const result = await getEnabledModules(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.enabledModules).toEqual([ModuleKey.LEARNING_PATHS, ModuleKey.POMODORO]);
  });

  test("Should return an empty array when every optional module is off", async () => {
    const userWithEveryModuleOff: User = { ...existingUser, enabledModules: [] };
    await userRepository.save(userWithEveryModuleOff);

    const result = await getEnabledModules(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.enabledModules).toEqual([]);
  });

  test("Should return every optional module when all are on", async () => {
    const everyOptionalModule = [...OPTIONAL_MODULES];
    await userRepository.save({ ...existingUser, enabledModules: everyOptionalModule });

    const result = await getEnabledModules(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.enabledModules).toEqual(everyOptionalModule);
  });

  test("Should not modify the user record", async () => {
    await userRepository.save(existingUser);

    await getEnabledModules(deps(), { userId: existingUser.id });

    const unchanged = await userRepository.findById(existingUser.id);
    expect(unchanged!.enabledModules).toEqual(existingUser.enabledModules);
    expect(unchanged!.updatedAt).toEqual(existingUser.updatedAt);
  });

  test("Should return an empty array when enabledModules is null at runtime (defensive null-coalescing)", async () => {
    await userRepository.save({ ...existingUser, enabledModules: null as any });

    const result = await getEnabledModules(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.enabledModules).toEqual([]);
  });

  test("Should return capabilities that follow the stored modules", async () => {
    await userRepository.save(existingUser);

    const result = await getEnabledModules(deps(), { userId: existingUser.id });
    if (result instanceof UserNotFoundError) throw result;

    expect(result.capabilities[CapabilityKey.POMODORO].state).toBe(CapabilityState.ENABLED);
    expect(result.capabilities[CapabilityKey.RECOMMENDATION].state).toBe(
      CapabilityState.DISABLED,
    );
  });
});
