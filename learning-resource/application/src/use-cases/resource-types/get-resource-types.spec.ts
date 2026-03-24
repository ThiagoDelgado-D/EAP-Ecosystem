import { beforeEach, describe, expect, test } from "vitest";
import { mockResourceTypeRepository } from "../../mocks/mock-resource-type-repository.js";
import { mockCryptoService } from "domain-lib";
import type { ResourceType } from "@learning-resource/domain";
import { getResourceTypes } from "./get-resource-types.js";

describe("getResourceTypes", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let resourceTypeRepository: ReturnType<typeof mockResourceTypeRepository>;

  beforeEach(() => {
    cryptoService = mockCryptoService();
    resourceTypeRepository = mockResourceTypeRepository([]);
  });

  test("Should return empty array when no resource types exist", async () => {
    const result = await getResourceTypes({ resourceTypeRepository });

    expect(result.resourceTypes).toEqual([]);
    expect(result.total).toBe(0);
  });

  test("Should return all resource types with correct total", async () => {
    const type1Id = await cryptoService.generateUUID();
    const type2Id = await cryptoService.generateUUID();

    const type1: ResourceType = {
      id: type1Id,
      code: "video",
      displayName: "Video",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const type2: ResourceType = {
      id: type2Id,
      code: "article",
      displayName: "Article",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    resourceTypeRepository = mockResourceTypeRepository([type1, type2]);

    const result = await getResourceTypes({ resourceTypeRepository });

    expect(result.total).toBe(2);
    expect(result.resourceTypes).toHaveLength(2);
    expect(result.resourceTypes[0].code).toBe("video");
    expect(result.resourceTypes[1].code).toBe("article");
  });

  test("Should return resource types with all their fields", async () => {
    const typeId = await cryptoService.generateUUID();

    const resourceType: ResourceType = {
      id: typeId,
      code: "course",
      displayName: "Course",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    resourceTypeRepository = mockResourceTypeRepository([resourceType]);

    const result = await getResourceTypes({ resourceTypeRepository });

    expect(result.resourceTypes[0]).toMatchObject({
      code: "course",
      displayName: "Course",
      isActive: true,
    });
  });

  test("Should return resource type with undefined isActive", async () => {
    const typeId = await cryptoService.generateUUID();

    const resourceType: ResourceType = {
      id: typeId,
      code: "book",
      displayName: "Book",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    resourceTypeRepository = mockResourceTypeRepository([resourceType]);

    const result = await getResourceTypes({ resourceTypeRepository });

    expect(result.resourceTypes[0].isActive).toBeUndefined();
  });
});
