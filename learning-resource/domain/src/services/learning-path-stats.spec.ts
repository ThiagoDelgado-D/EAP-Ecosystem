import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService } from "domain-lib";
import type { LearningPathNode } from "../entities/learning-path-node.js";
import { computeLearningPathStats } from "./learning-path-stats.js";

describe("computeLearningPathStats", () => {
  let crypto: ReturnType<typeof mockCryptoService>;

  beforeEach(() => {
    crypto = mockCryptoService();
  });

  test("should return zeroed stats for a path with no nodes", () => {
    expect(computeLearningPathStats([])).toEqual({ total: 0, done: 0, linked: 0 });
  });

  test("should count total, done, and linked nodes independently", async () => {
    const pathId = await crypto.generateUUID();
    const createdAt = new Date("2026-08-20T10:00:00Z");
    const updatedAt = new Date("2026-08-25T10:00:00Z");

    const nodes: LearningPathNode[] = [
      {
        id: await crypto.generateUUID(),
        pathId,
        title: "Ownership & Borrowing",
        progress: "done",
        learningResourceId: await crypto.generateUUID(),
        createdAt,
        updatedAt,
      },
      {
        id: await crypto.generateUUID(),
        pathId,
        title: "Async Runtimes",
        progress: "in_progress",
        stubScope: "path-local",
        createdAt,
        updatedAt,
      },
      {
        id: await crypto.generateUUID(),
        pathId,
        title: "Trait Objects",
        progress: "pending",
        stubScope: "path-local",
        createdAt,
        updatedAt,
      },
    ];

    expect(computeLearningPathStats(nodes)).toEqual({ total: 3, done: 1, linked: 1 });
  });
});
