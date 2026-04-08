import { beforeEach, describe, test } from "vitest";
import { mockUrlMetadataService } from "../../mocks/mock-preview-url.js";
import { mockResourceTypeRepository } from "../../mocks/mock-resource-type-repository.js";
import { previewUrl } from "./preview-url.js";
import type { ResourceType } from "@learning-resource/domain";
import { InvalidDataError } from "domain-lib";

describe("previewUrl", () => {
  let urlMetadataService: ReturnType<typeof mockUrlMetadataService>;
  let resourceTypeRepository: ReturnType<typeof mockResourceTypeRepository>;

  beforeEach(() => {
    urlMetadataService = mockUrlMetadataService();
    resourceTypeRepository = mockResourceTypeRepository([]);
  });

  test("Should return metadata when URL is valid and metadata service returns data", async () => {
    const fakeMetadata = {
      title: "Learn System Design Principles",
      description: "A comprehensive guide to system design fundamentals",
      imageUrl:
        "https://www.freecodecamp.org/news/content/images/size/w2000/...",
      resourceTypeCode: "article",
      siteName: "freeCodeCamp",
    };
    urlMetadataService.setResponse(
      "https://www.freecodecamp.org/news/learn-system-design-principles/",
      fakeMetadata,
    );

    const result = await previewUrl(
      { urlMetadataService, resourceTypeRepository },
      {
        url: "https://www.freecodecamp.org/news/learn-system-design-principles/",
      },
    );

    expect(result).toMatchObject({
      title: "Learn System Design Principles",
      resourceTypeCode: "article",
      siteName: "freeCodeCamp",
    });
  });

  test("Should return metadata for GitHub repository (DDD)", async () => {
    const fakeMetadata = {
      title: "draphyz/DDD",
      description: "Domain-Driven Design examples",
      imageUrl: "https://opengraph.githubassets.com/...",
      resourceTypeCode: "document",
      siteName: "GitHub",
    };
    urlMetadataService.setResponse(
      "https://github.com/draphyz/DDD",
      fakeMetadata,
    );

    const result = await previewUrl(
      { urlMetadataService, resourceTypeRepository },
      { url: "https://github.com/draphyz/DDD" },
    );

    expect(result).toMatchObject({
      resourceTypeCode: "document",
      siteName: "GitHub",
    });
  });

  test("Should return metadata for GitHub repository (Developer Roadmap)", async () => {
    const fakeMetadata = {
      title: "developer-roadmap",
      description: "Interactive roadmaps, guides and educational content",
      resourceTypeCode: "document",
      siteName: "GitHub",
    };
    urlMetadataService.setResponse(
      "https://github.com/kamranahmedse/developer-roadmap",
      fakeMetadata,
    );

    const result = await previewUrl(
      { urlMetadataService, resourceTypeRepository },
      { url: "https://github.com/kamranahmedse/developer-roadmap" },
    );

    if (result instanceof Error) throw result;

    expect(result.resourceTypeCode).toBe("document");
  });

  test("Should return metadata for GitHub repository (zen-browser/desktop)", async () => {
    const fakeMetadata = {
      title: "zen-browser/desktop",
      description: "A modern browser built with performance in mind",
      resourceTypeCode: "document",
      siteName: "GitHub",
    };
    urlMetadataService.setResponse(
      "https://github.com/zen-browser/desktop",
      fakeMetadata,
    );

    const result = await previewUrl(
      { urlMetadataService, resourceTypeRepository },
      { url: "https://github.com/zen-browser/desktop" },
    );

    if (result instanceof Error) throw result;

    expect(result.resourceTypeCode).toBe("document");
  });

  test("Should return metadata for Lexington Soft article (architecture decisions)", async () => {
    const fakeMetadata = {
      title: "The Variety of Architecture Decisions",
      description: "Understanding different types of architectural decisions",
      resourceTypeCode: "article",
      siteName: "Lexington Soft",
    };
    urlMetadataService.setResponse(
      "https://www.lexingtonsoft.com/the-variety-of-architecture-decisions/",
      fakeMetadata,
    );

    const result = await previewUrl(
      { urlMetadataService, resourceTypeRepository },
      {
        url: "https://www.lexingtonsoft.com/the-variety-of-architecture-decisions/",
      },
    );

    if (result instanceof Error) throw result;

    expect(result.resourceTypeCode).toBe("article");
  });

  test("Should return metadata for Melsatar blog (architectural design decisions)", async () => {
    const fakeMetadata = {
      title: "Architectural Design Decisions",
      description: "Key considerations for software architecture",
      resourceTypeCode: "article",
      siteName: "Melsatar Blog",
    };
    urlMetadataService.setResponse(
      "https://melsatar.blog/2017/04/29/architectural-design-decisions/",
      fakeMetadata,
    );

    const result = await previewUrl(
      { urlMetadataService, resourceTypeRepository },
      {
        url: "https://melsatar.blog/2017/04/29/architectural-design-decisions/",
      },
    );

    if (result instanceof Error) throw result;

    expect(result.resourceTypeCode).toBe("article");
  });

  test("Should return metadata for Swagger article (API design best practices)", async () => {
    const fakeMetadata = {
      title: "Best Practices in API Design",
      description: "Guidelines for designing robust APIs",
      resourceTypeCode: "article",
      siteName: "Swagger",
    };
    urlMetadataService.setResponse(
      "https://swagger.io/resources/articles/best-practices-in-api-design/",
      fakeMetadata,
    );

    const result = await previewUrl(
      { urlMetadataService, resourceTypeRepository },
      {
        url: "https://swagger.io/resources/articles/best-practices-in-api-design/",
      },
    );

    if (result instanceof Error) throw result;

    expect(result.resourceTypeCode).toBe("article");
  });

  test("Should return metadata for Medium article (API lifecycle)", async () => {
    const fakeMetadata = {
      title: "API Lifecycle: Designing API",
      description: "A comprehensive look at API lifecycle management",
      resourceTypeCode: "article",
      author: "Satish A",
      siteName: "Medium",
    };
    urlMetadataService.setResponse(
      "https://medium.com/@satish-a/api-lifecycle-designing-api-fe529a220a1b",
      fakeMetadata,
    );

    const result = await previewUrl(
      { urlMetadataService, resourceTypeRepository },
      {
        url: "https://medium.com/@satish-a/api-lifecycle-designing-api-fe529a220a1b",
      },
    );

    expect(result).toMatchObject({
      resourceTypeCode: "article",
      siteName: "Medium",
    });
  });

  test("Should resolve resourceTypeId when resourceTypeCode matches an existing type", async () => {
    const fakeMetadata = {
      title: "Some article",
      resourceTypeCode: "article",
    };
    urlMetadataService.setResponse("https://example.com/article", fakeMetadata);

    const resourceTypes: ResourceType[] = [
      {
        id: "type-article-id" as any,
        code: "article",
        displayName: "Article",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    resourceTypeRepository.resourceTypes = resourceTypes;

    const result = await previewUrl(
      { urlMetadataService, resourceTypeRepository },
      { url: "https://example.com/article" },
    );

    expect(result).toMatchObject({
      resourceTypeCode: "article",
      resourceTypeId: "type-article-id",
    });
  });

  test("Should return InvalidDataError for malformed URL", async () => {
    const result = await previewUrl(
      { urlMetadataService, resourceTypeRepository },
      { url: "not-a-valid-url" },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
    expect((result as InvalidDataError).context).toHaveProperty("url");
  });

  test("Should return InvalidDataError for empty URL", async () => {
    const result = await previewUrl(
      { urlMetadataService, resourceTypeRepository },
      { url: "" },
    );

    expect(result).toBeInstanceOf(InvalidDataError);
    expect((result as InvalidDataError).context).toHaveProperty("url");
  });

  test("Should trim whitespace from URL before validation", async () => {
    const trimmedUrl = "https://github.com/draphyz/DDD";
    urlMetadataService.setResponse(trimmedUrl, { title: "DDD" });

    const result = await previewUrl(
      { urlMetadataService, resourceTypeRepository },
      { url: "  https://github.com/draphyz/DDD  " },
    );

    expect(result).toMatchObject({ title: "DDD" });
  });
});
