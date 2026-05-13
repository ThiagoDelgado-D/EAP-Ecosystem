import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService } from "domain-lib";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import { getWidgetConfig } from "./get-widget-config.js";
import { UserNotFoundError } from "../../errors/user-not-found.js";
import { WidgetKey, type User } from "@user/domain";

describe("getWidgetConfig", () => {
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
      widgetConfig: [WidgetKey.FOCUS_PULSE, WidgetKey.ARCHITECTS_PULSE],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const deps = () => ({ userRepository });

  test("Should return UserNotFoundError when user does not exist", async () => {
    const result = await getWidgetConfig(deps(), { userId: "non-existent-id" });

    expect(result).toBeInstanceOf(UserNotFoundError);
  });

  test("Should return the widgetConfig for an existing user", async () => {
    await userRepository.save(existingUser);

    const result = await getWidgetConfig(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.widgetConfig).toEqual([WidgetKey.FOCUS_PULSE, WidgetKey.ARCHITECTS_PULSE]);
  });

  test("Should return an empty array when widgetConfig is empty", async () => {
    const userWithEmptyConfig: User = { ...existingUser, widgetConfig: [] };
    await userRepository.save(userWithEmptyConfig);

    const result = await getWidgetConfig(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.widgetConfig).toEqual([]);
  });

  test("Should return all widget keys when all are configured", async () => {
    const allKeys = Object.values(WidgetKey) as WidgetKey[];
    await userRepository.save({ ...existingUser, widgetConfig: allKeys });

    const result = await getWidgetConfig(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.widgetConfig).toEqual(allKeys);
  });

  test("Should preserve the order of widget keys as stored", async () => {
    const ordered: WidgetKey[] = [
      WidgetKey.PENDING_TASKS,
      WidgetKey.SYSTEM_CHECK,
      WidgetKey.IDEAL_MATCH,
    ];
    await userRepository.save({ ...existingUser, widgetConfig: ordered });

    const result = await getWidgetConfig(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.widgetConfig).toEqual(ordered);
  });

  test("Should not modify the user record", async () => {
    await userRepository.save(existingUser);

    await getWidgetConfig(deps(), { userId: existingUser.id });

    const unchanged = await userRepository.findById(existingUser.id);
    expect(unchanged!.widgetConfig).toEqual(existingUser.widgetConfig);
    expect(unchanged!.updatedAt).toEqual(existingUser.updatedAt);
  });

  test("Should return an empty array when widgetConfig is null at runtime (defensive null-coalescing)", async () => {
    await userRepository.save({ ...existingUser, widgetConfig: null as any });

    const result = await getWidgetConfig(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.widgetConfig).toEqual([]);
  });
});
