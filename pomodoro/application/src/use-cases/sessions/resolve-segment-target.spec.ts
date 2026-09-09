import { mockCryptoService, type UUID } from "domain-lib";
import {
  SegmentTargetKind,
  type LearningPathMembership,
} from "@pomodoro/domain";
import { beforeEach, describe, expect, test } from "vitest";
import { mockLearningPathMembershipPort } from "../../mocks/index.js";
import { resolveSegmentTarget } from "./resolve-segment-target.js";
import { AmbiguousPathTargetError } from "../../errors/ambiguous-path-target.js";

describe("resolveSegmentTarget", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let unlinkedResourceId: UUID;
  let singlePathResourceId: UUID;
  let multiPathResourceId: UUID;
  let onlyMatchingPathId: UUID;
  let onlyMatchingNodeId: UUID;
  let firstCandidatePathId: UUID;
  let firstCandidateNodeId: UUID;
  let secondCandidatePathId: UUID;
  let secondCandidateNodeId: UUID;
  let membershipPort: ReturnType<typeof mockLearningPathMembershipPort>;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    unlinkedResourceId = await cryptoService.generateUUID();
    singlePathResourceId = await cryptoService.generateUUID();
    multiPathResourceId = await cryptoService.generateUUID();
    onlyMatchingPathId = await cryptoService.generateUUID();
    onlyMatchingNodeId = await cryptoService.generateUUID();
    firstCandidatePathId = await cryptoService.generateUUID();
    firstCandidateNodeId = await cryptoService.generateUUID();
    secondCandidatePathId = await cryptoService.generateUUID();
    secondCandidateNodeId = await cryptoService.generateUUID();

    const singlePathMembership: LearningPathMembership[] = [
      {
        pathId: onlyMatchingPathId,
        pathTitle: "Only Path",
        nodeId: onlyMatchingNodeId,
      },
    ];
    const multiPathMemberships: LearningPathMembership[] = [
      {
        pathId: firstCandidatePathId,
        pathTitle: "First Path",
        nodeId: firstCandidateNodeId,
      },
      {
        pathId: secondCandidatePathId,
        pathTitle: "Second Path",
        nodeId: secondCandidateNodeId,
      },
    ];

    membershipPort = mockLearningPathMembershipPort({
      [singlePathResourceId]: singlePathMembership,
      [multiPathResourceId]: multiPathMemberships,
    });
  });

  test("Should resolve a free target as-is", async () => {
    const result = await resolveSegmentTarget(
      { learningPathMembershipPort: membershipPort },
      { kind: SegmentTargetKind.FREE },
    );

    expect(result).toEqual({ targetKind: SegmentTargetKind.FREE });
  });

  test("Should pass a node target through without querying membership", async () => {
    const result = await resolveSegmentTarget(
      { learningPathMembershipPort: membershipPort },
      {
        kind: SegmentTargetKind.NODE,
        learningPathId: firstCandidatePathId,
        learningPathNodeId: firstCandidateNodeId,
      },
    );

    expect(result).toEqual({
      targetKind: SegmentTargetKind.NODE,
      learningPathId: firstCandidatePathId,
      learningPathNodeId: firstCandidateNodeId,
      resourceId: undefined,
    });
  });

  test("Should resolve a resource in zero paths as a plain resource segment", async () => {
    const result = await resolveSegmentTarget(
      { learningPathMembershipPort: membershipPort },
      { kind: SegmentTargetKind.RESOURCE, resourceId: unlinkedResourceId },
    );

    expect(result).toEqual({
      targetKind: SegmentTargetKind.RESOURCE,
      resourceId: unlinkedResourceId,
    });
  });

  test("Should auto-resolve a resource in exactly one path to a node segment", async () => {
    const result = await resolveSegmentTarget(
      { learningPathMembershipPort: membershipPort },
      { kind: SegmentTargetKind.RESOURCE, resourceId: singlePathResourceId },
    );

    expect(result).toEqual({
      targetKind: SegmentTargetKind.NODE,
      learningPathId: onlyMatchingPathId,
      learningPathNodeId: onlyMatchingNodeId,
      resourceId: singlePathResourceId,
    });
  });

  test("Should return AmbiguousPathTargetError when a resource belongs to 2+ paths and none was chosen", async () => {
    const result = await resolveSegmentTarget(
      { learningPathMembershipPort: membershipPort },
      { kind: SegmentTargetKind.RESOURCE, resourceId: multiPathResourceId },
    );

    expect(result).toBeInstanceOf(AmbiguousPathTargetError);
    expect((result as AmbiguousPathTargetError).context).toEqual({
      candidates: [
        {
          pathId: firstCandidatePathId,
          pathTitle: "First Path",
          nodeId: firstCandidateNodeId,
        },
        {
          pathId: secondCandidatePathId,
          pathTitle: "Second Path",
          nodeId: secondCandidateNodeId,
        },
      ],
    });
  });

  test("Should resolve directly to a node when the caller already picked which of the 2+ paths counts", async () => {
    const result = await resolveSegmentTarget(
      { learningPathMembershipPort: membershipPort },
      {
        kind: SegmentTargetKind.RESOURCE,
        resourceId: multiPathResourceId,
        learningPathId: secondCandidatePathId,
      },
    );

    expect(result).toEqual({
      targetKind: SegmentTargetKind.NODE,
      learningPathId: secondCandidatePathId,
      learningPathNodeId: secondCandidateNodeId,
      resourceId: multiPathResourceId,
    });
  });
});
