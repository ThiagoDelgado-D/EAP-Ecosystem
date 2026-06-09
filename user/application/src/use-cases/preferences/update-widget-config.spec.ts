import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService } from "domain-lib";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import { updateWidgetConfig } from "./update-widget-config.js";
import { UserNotFoundError } from "../../errors/user-not-found.js";
import { WidgetKey, type User } from "@user/domain";

describe("updateWidgetConfig", () => {
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
      widgetConfig: [WidgetKey.FOCUS_PULSE],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const deps = () => ({ userRepository });

  test("Should return UserNotFoundError when user does not exist", async () => {
    const result = await updateWidgetConfig(deps(), {
      userId: "non-existent-id",
      widgetConfig: [WidgetKey.SYSTEM_CHECK],
    });

    expect(result).toBeInstanceOf(UserNotFoundError);
  });

  test("Should persist the new widgetConfig", async () => {
    await userRepository.save(existingUser);

    await updateWidgetConfig(deps(), {
      userId: existingUser.id,
      widgetConfig: [WidgetKey.ARCHITECTS_PULSE, WidgetKey.PENDING_TASKS],
    });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.widgetConfig).toEqual([WidgetKey.ARCHITECTS_PULSE, WidgetKey.PENDING_TASKS]);
  });

  test("Should return the updated widgetConfig in the response", async () => {
    await userRepository.save(existingUser);

    const result = await updateWidgetConfig(deps(), {
      userId: existingUser.id,
      widgetConfig: [WidgetKey.IDEAL_MATCH],
    });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.widgetConfig).toEqual([WidgetKey.IDEAL_MATCH]);
  });

  test("Should fully replace the previous widgetConfig", async () => {
    await userRepository.save(existingUser);

    await updateWidgetConfig(deps(), {
      userId: existingUser.id,
      widgetConfig: [WidgetKey.SYSTEM_CHECK],
    });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.widgetConfig).not.toContain(WidgetKey.FOCUS_PULSE);
    expect(updated!.widgetConfig).toEqual([WidgetKey.SYSTEM_CHECK]);
  });

  test("Should accept an empty array, clearing all configured widgets", async () => {
    await userRepository.save(existingUser);

    const result = await updateWidgetConfig(deps(), {
      userId: existingUser.id,
      widgetConfig: [],
    });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.widgetConfig).toEqual([]);

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.widgetConfig).toEqual([]);
  });

  test("Should preserve widget order as provided", async () => {
    await userRepository.save(existingUser);

    const ordered: WidgetKey[] = [
      WidgetKey.PENDING_TASKS,
      WidgetKey.SYSTEM_CHECK,
      WidgetKey.IDEAL_MATCH,
      WidgetKey.FOCUS_PULSE,
      WidgetKey.ARCHITECTS_PULSE,
    ];

    const result = await updateWidgetConfig(deps(), {
      userId: existingUser.id,
      widgetConfig: ordered,
    });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.widgetConfig).toEqual(ordered);
  });

  test("Should not modify fields unrelated to widgetConfig", async () => {
    await userRepository.save(existingUser);

    await updateWidgetConfig(deps(), {
      userId: existingUser.id,
      widgetConfig: [WidgetKey.SYSTEM_CHECK],
    });

    const updated = await userRepository.findById(existingUser.id);
    expect(updated!.email).toBe(existingUser.email);
    expect(updated!.firstName).toBe(existingUser.firstName);
    expect(updated!.featureConfig).toEqual(existingUser.featureConfig);
    expect(updated!.onboardingCompleted).toBe(existingUser.onboardingCompleted);
    expect(updated!.enabled).toBe(existingUser.enabled);
  });
});
