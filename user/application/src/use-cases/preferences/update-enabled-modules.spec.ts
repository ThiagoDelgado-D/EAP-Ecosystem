import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService } from "domain-lib";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import { updateEnabledModules } from "./update-enabled-modules.js";
import { UserNotFoundError } from "../../errors/user-not-found.js";
import { ModuleKey, OPTIONAL_MODULES, type User } from "@user/domain";

describe("updateEnabledModules", () => {
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
      enabledModules: [ModuleKey.LEARNING_PATHS],
      widgetConfig: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const deps = () => ({ userRepository });

  test("Should return UserNotFoundError when user does not exist", async () => {
    const result = await updateEnabledModules(deps(), {
      userId: "non-existent-id",
      enabledModules: [ModuleKey.POMODORO],
    });

    expect(result).toBeInstanceOf(UserNotFoundError);
  });

  test("Should persist the new enabled modules", async () => {
    await userRepository.save(existingUser);

    await updateEnabledModules(deps(), {
      userId: existingUser.id,
      enabledModules: [ModuleKey.POMODORO, ModuleKey.RECOMMENDATION],
    });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.enabledModules).toEqual([ModuleKey.POMODORO, ModuleKey.RECOMMENDATION]);
  });

  test("Should return the updated enabled modules in the response", async () => {
    await userRepository.save(existingUser);

    const result = await updateEnabledModules(deps(), {
      userId: existingUser.id,
      enabledModules: [ModuleKey.RECOMMENDATION],
    });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.enabledModules).toEqual([ModuleKey.RECOMMENDATION]);
  });

  test("Should fully replace the previous enabled modules", async () => {
    await userRepository.save(existingUser);

    await updateEnabledModules(deps(), {
      userId: existingUser.id,
      enabledModules: [ModuleKey.POMODORO],
    });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.enabledModules).not.toContain(ModuleKey.LEARNING_PATHS);
    expect(updated!.enabledModules).toEqual([ModuleKey.POMODORO]);
  });

  test("Should accept an empty array, turning every optional module off", async () => {
    await userRepository.save(existingUser);

    const result = await updateEnabledModules(deps(), {
      userId: existingUser.id,
      enabledModules: [],
    });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.enabledModules).toEqual([]);

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.enabledModules).toEqual([]);
  });

  test("Should accept every optional module at once", async () => {
    await userRepository.save(existingUser);
    const everyOptionalModule = [...OPTIONAL_MODULES];

    const result = await updateEnabledModules(deps(), {
      userId: existingUser.id,
      enabledModules: everyOptionalModule,
    });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.enabledModules).toEqual(everyOptionalModule);
  });

  test("Should not modify fields unrelated to enabled modules", async () => {
    await userRepository.save(existingUser);

    await updateEnabledModules(deps(), {
      userId: existingUser.id,
      enabledModules: [ModuleKey.POMODORO],
    });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.email).toBe(existingUser.email);
    expect(updated!.firstName).toBe(existingUser.firstName);
    expect(updated!.widgetConfig).toEqual(existingUser.widgetConfig);
    expect(updated!.onboardingCompleted).toBe(existingUser.onboardingCompleted);
    expect(updated!.enabled).toBe(existingUser.enabled);
  });
});
