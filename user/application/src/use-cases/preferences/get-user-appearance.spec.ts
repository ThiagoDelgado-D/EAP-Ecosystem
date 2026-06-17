import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService } from "domain-lib";
import { mockUserRepository } from "../../mocks/mock-user-repository.js";
import { getUserAppearance } from "./get-user-appearance.js";
import { UserNotFoundError } from "../../errors/user-not-found.js";
import { DEFAULT_APPEARANCE, LanguageCode, StartOfWeek, type User } from "@user/domain";

describe("getUserAppearance", () => {
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
    const result = await getUserAppearance(deps(), { userId: "non-existent-id" });

    expect(result).toBeInstanceOf(UserNotFoundError);
  });

  test("Should return the appearance for an existing user", async () => {
    await userRepository.save(existingUser);

    const result = await getUserAppearance(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.appearance).toEqual(DEFAULT_APPEARANCE);
  });

  test("Should return the exact appearance values stored on the user", async () => {
    const customAppearance = {
      language: LanguageCode.ES,
      timezone: "America/Argentina/Buenos_Aires",
      startOfWeek: StartOfWeek.SUNDAY,
      reduceMotion: true,
      compactMode: true,
    };
    await userRepository.save({ ...existingUser, appearance: customAppearance });

    const result = await getUserAppearance(deps(), { userId: existingUser.id });

    expect(result).not.toBeInstanceOf(UserNotFoundError);
    if (result instanceof UserNotFoundError) return;

    expect(result.appearance).toEqual(customAppearance);
  });

  test("Should not modify the user record", async () => {
    await userRepository.save(existingUser);

    await getUserAppearance(deps(), { userId: existingUser.id });

    const unchanged = await userRepository.findById(existingUser.id);
    expect(unchanged!.appearance).toEqual(existingUser.appearance);
    expect(unchanged!.updatedAt).toEqual(existingUser.updatedAt);
  });
});
