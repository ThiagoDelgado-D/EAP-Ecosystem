import { InvalidDataError, mockCryptoService, mockCurrentUser, type CurrentUser } from "domain-lib";
import { EnergyLevel, MentalState } from "@recommendation/domain";
import { beforeEach, describe, expect, test } from "vitest";
import { mockRecommendationContextRepository } from "../mocks/index.js";
import { setRecommendationContext } from "./set-recommendation-context.js";

describe("setRecommendationContext", () => {
  let recommendationContextRepository: ReturnType<
    typeof mockRecommendationContextRepository
  >;
  let currentUser: CurrentUser;

  beforeEach(async () => {
    const cryptoService = mockCryptoService();
    recommendationContextRepository = mockRecommendationContextRepository();
    currentUser = await mockCurrentUser(cryptoService);
  });

  const deps = () => ({ recommendationContextRepository, currentUser });

  test("persists a new context for a user who doesn't have one yet", async () => {
    const result = await setRecommendationContext(deps(), {
      energyLevel: EnergyLevel.LOW,
      availableMinutes: 20,
      mentalState: MentalState.LIGHT_READ,
    });

    if (result instanceof Error) throw result;

    expect(result).toMatchObject({
      userId: currentUser.id,
      energyLevel: EnergyLevel.LOW,
      availableMinutes: 20,
      mentalState: MentalState.LIGHT_READ,
    });
    expect(recommendationContextRepository.contexts).toHaveLength(1);
  });

  test("replaces the existing context for that user instead of adding a second row", async () => {
    recommendationContextRepository.contexts.push({
      userId: currentUser.id,
      energyLevel: EnergyLevel.HIGH,
      updatedAt: new Date(),
    });

    const result = await setRecommendationContext(deps(), {
      energyLevel: EnergyLevel.LOW,
    });

    if (result instanceof Error) throw result;

    expect(recommendationContextRepository.contexts).toHaveLength(1);
    expect(recommendationContextRepository.contexts[0]?.energyLevel).toBe(
      EnergyLevel.LOW,
    );
  });

  test("returns InvalidDataError when energyLevel is missing", async () => {
    const result = await setRecommendationContext(
      deps(),
      {} as Parameters<typeof setRecommendationContext>[1],
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("returns InvalidDataError when energyLevel isn't one of the allowed values", async () => {
    const result = await setRecommendationContext(deps(), {
      energyLevel: "extreme" as EnergyLevel,
    });

    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("returns InvalidDataError when availableMinutes isn't positive", async () => {
    const result = await setRecommendationContext(deps(), {
      energyLevel: EnergyLevel.MEDIUM,
      availableMinutes: -5,
    });

    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
