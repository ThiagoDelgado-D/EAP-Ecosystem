import { mockCryptoService, mockCurrentUser, type CurrentUser } from "domain-lib";
import { beforeEach, describe, expect, test } from "vitest";
import {
  generateRecommendationContext,
  mockRecommendationContextRepository,
} from "../mocks/index.js";
import { RecommendationContextNotFoundError } from "../errors/index.js";
import { getRecommendationContext } from "./get-recommendation-context.js";

describe("getRecommendationContext", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let recommendationContextRepository: ReturnType<
    typeof mockRecommendationContextRepository
  >;
  let currentUser: CurrentUser;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    recommendationContextRepository = mockRecommendationContextRepository();
    currentUser = await mockCurrentUser(cryptoService);
  });

  const deps = () => ({ recommendationContextRepository, currentUser });

  test("returns a not-found error when the user has no recommendation context yet", async () => {
    const result = await getRecommendationContext(deps());

    expect(result).toBeInstanceOf(RecommendationContextNotFoundError);
  });

  test("returns the context the user last saved", async () => {
    const savedContext = generateRecommendationContext({ userId: currentUser.id });
    recommendationContextRepository.contexts.push(savedContext);

    const result = await getRecommendationContext(deps());

    expect(result).toEqual(savedContext);
  });

  test("doesn't return another user's context", async () => {
    const otherUserId = await cryptoService.generateUUID();
    recommendationContextRepository.contexts.push(
      generateRecommendationContext({ userId: otherUserId }),
    );

    const result = await getRecommendationContext(deps());

    expect(result).toBeInstanceOf(RecommendationContextNotFoundError);
  });
});
