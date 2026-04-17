import {
  DifficultyType,
  EnergyLevelType,
  MentalStateType,
  type LearningResource,
  ResourceStatusType,
} from "@learning-resource/domain";
import { InvalidDataError, mockCryptoService, type UUID } from "domain-lib";
import { beforeEach, describe, expect, test } from "vitest";
import { mockLearningResourceRepository } from "../../mocks/mock-learning-resource-repository.js";
import { toggleMentalState } from "./toggle-mental-state.js";
import { LearningResourceNotFoundError } from "../../errors/learning-resource-not-found.js";

describe("toggleMentalState", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let learningResourceRepository: ReturnType<
    typeof mockLearningResourceRepository
  >;
  let resourceId: UUID;
  let typeId: UUID;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    resourceId = await cryptoService.generateUUID();
    typeId = await cryptoService.generateUUID();

    const resource: LearningResource = {
      id: resourceId,
      title: "Advanced Algorithms",
      typeId,
      topicIds: [],
      difficulty: DifficultyType.HIGH,
      energyLevel: EnergyLevelType.MEDIUM,
      status: ResourceStatusType.PENDING,
      estimatedDuration: { value: 180, isEstimated: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    learningResourceRepository = mockLearningResourceRepository([resource]);
  });

  test("Should toggle mental state to deep_focus successfully", async () => {
    const result = await toggleMentalState(
      { learningResourceRepository },
      { id: resourceId, mentalState: MentalStateType.DEEP_FOCUS },
    );

    expect(result).toBeUndefined();

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.mentalState).toBe(MentalStateType.DEEP_FOCUS);
  });

  test("Should toggle mental state to light_read successfully", async () => {
    const result = await toggleMentalState(
      { learningResourceRepository },
      { id: resourceId, mentalState: MentalStateType.LIGHT_READ },
    );

    expect(result).toBeUndefined();

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.mentalState).toBe(MentalStateType.LIGHT_READ);
  });

  test("Should toggle mental state to creative successfully", async () => {
    const result = await toggleMentalState(
      { learningResourceRepository },
      { id: resourceId, mentalState: MentalStateType.CREATIVE },
    );

    expect(result).toBeUndefined();

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.mentalState).toBe(MentalStateType.CREATIVE);
  });

  test("Should toggle mental state to quick_op successfully", async () => {
    const result = await toggleMentalState(
      { learningResourceRepository },
      { id: resourceId, mentalState: MentalStateType.QUICK_OP },
    );

    expect(result).toBeUndefined();

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.mentalState).toBe(MentalStateType.QUICK_OP);
  });

  test("Should toggle mental state to review successfully", async () => {
    const result = await toggleMentalState(
      { learningResourceRepository },
      { id: resourceId, mentalState: MentalStateType.REVIEW },
    );

    expect(result).toBeUndefined();

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.mentalState).toBe(MentalStateType.REVIEW);
  });

  test("Should return LearningResourceNotFoundError when resource does not exist", async () => {
    const nonExistentId = await cryptoService.generateUUID();

    const result = await toggleMentalState(
      { learningResourceRepository },
      { id: nonExistentId, mentalState: MentalStateType.DEEP_FOCUS },
    );

    expect(result).toBeInstanceOf(LearningResourceNotFoundError);
  });

  test("Should return InvalidDataError when mentalState value is invalid", async () => {
    const result = await toggleMentalState(
      { learningResourceRepository },
      { id: resourceId, mentalState: "INVALID_STATE" as any },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
    expect((result as InvalidDataError).context).toEqual({
      mentalState:
        "MentalState must be one of: deep_focus, light_read, creative, quick_op, review",
    });
  });

  test("Should return InvalidDataError when id is not a valid UUID", async () => {
    const result = await toggleMentalState(
      { learningResourceRepository },
      { id: "not-a-uuid" as any, mentalState: MentalStateType.DEEP_FOCUS },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
    expect((result as InvalidDataError).context).toEqual({
      id: "ResourceId must be a valid UUID",
    });
  });

  test("Should not modify other fields when toggling mental state", async () => {
    const originalResource =
      await learningResourceRepository.findById(resourceId);

    await toggleMentalState(
      { learningResourceRepository },
      { id: resourceId, mentalState: MentalStateType.CREATIVE },
    );

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.title).toBe(originalResource?.title);
    expect(updated?.difficulty).toBe(originalResource?.difficulty);
    expect(updated?.energyLevel).toBe(originalResource?.energyLevel);
    expect(updated?.status).toBe(originalResource?.status);
    expect(updated?.estimatedDuration.value).toBe(
      originalResource?.estimatedDuration.value,
    );
  });
});
