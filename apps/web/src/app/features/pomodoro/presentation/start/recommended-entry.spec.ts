import { convertToParamMap } from '@angular/router';
import { MAX_PLANNED_DURATION_MIN } from '@features/pomodoro/domain/pomodoro.model';
import { learningResourceFixture, pathGroupFixture } from './recommended-entry.fixtures';
import {
  estimatedMinutesFor,
  recommendedDurationMin,
  recommendedEntryQueryParams,
  resolveRecommendedTarget,
} from './recommended-entry';

const cleanArchitectureTalk = learningResourceFixture('Clean Architecture talk', 20);
const dataIntensiveChapter = learningResourceFixture(
  'Designing Data-Intensive Applications, ch. 5',
  60,
);
const library = [cleanArchitectureTalk, dataIntensiveChapter];

const frontendArchitecturePath = pathGroupFixture('Frontend Architecture Mastery', [
  { title: 'Clean Architecture', learningResourceId: cleanArchitectureTalk.id },
  { title: 'Hexagonal ports' },
]);
const [cleanArchitectureNode, hexagonalPortsStub] = frontendArchitecturePath.nodes;
const groups = [frontendArchitecturePath];

describe('resolveRecommendedTarget', () => {
  test('should attach a recommended resource', () => {
    const params = convertToParamMap({ resource: dataIntensiveChapter.id });

    expect(resolveRecommendedTarget(params, groups, library)).toEqual({
      kind: 'resource',
      resourceId: dataIntensiveChapter.id,
    });
  });

  test('should attach a recommended path node along with its linked resource', () => {
    const params = convertToParamMap({
      path: frontendArchitecturePath.path.id,
      node: cleanArchitectureNode!.id,
    });

    expect(resolveRecommendedTarget(params, groups, library)).toEqual({
      kind: 'node',
      learningPathId: frontendArchitecturePath.path.id,
      learningPathNodeId: cleanArchitectureNode!.id,
      resourceId: cleanArchitectureTalk.id,
    });
  });

  test('should ignore a resource that is no longer in the library', () => {
    const params = convertToParamMap({ resource: crypto.randomUUID() });

    expect(resolveRecommendedTarget(params, groups, library)).toBeNull();
  });

  test('should ignore a node that is no longer in its path', () => {
    const params = convertToParamMap({
      path: frontendArchitecturePath.path.id,
      node: crypto.randomUUID(),
    });

    expect(resolveRecommendedTarget(params, groups, library)).toBeNull();
  });

  test('should attach nothing when Start is opened directly', () => {
    expect(resolveRecommendedTarget(convertToParamMap({}), groups, library)).toBeNull();
  });
});

describe('estimatedMinutesFor', () => {
  test('should use the estimate of the resource a path node links to', () => {
    const target = {
      kind: 'node' as const,
      learningPathId: frontendArchitecturePath.path.id,
      learningPathNodeId: cleanArchitectureNode!.id,
      resourceId: cleanArchitectureTalk.id,
    };

    expect(estimatedMinutesFor(target, library)).toBe(20);
  });

  test('should have no estimate for a stub node', () => {
    const target = {
      kind: 'node' as const,
      learningPathId: frontendArchitecturePath.path.id,
      learningPathNodeId: hexagonalPortsStub!.id,
    };

    expect(estimatedMinutesFor(target, library)).toBeUndefined();
  });
});

describe('recommendedDurationMin', () => {
  test('should take the shorter of the estimate and the available minutes', () => {
    expect(recommendedDurationMin({ estimatedMin: 60, availableMin: 45, defaultMin: 25 })).toBe(45);
    expect(recommendedDurationMin({ estimatedMin: 20, availableMin: 45, defaultMin: 25 })).toBe(20);
  });

  test('should use whichever of the two is known', () => {
    expect(recommendedDurationMin({ estimatedMin: 60, defaultMin: 25 })).toBe(60);
    expect(recommendedDurationMin({ availableMin: 45, defaultMin: 25 })).toBe(45);
  });

  test('should fall back to the default duration when neither is known', () => {
    expect(recommendedDurationMin({ defaultMin: 25 })).toBe(25);
  });

  test('should cap a long estimate at the maximum planned duration', () => {
    expect(recommendedDurationMin({ estimatedMin: 900, defaultMin: 25 })).toBe(
      MAX_PLANNED_DURATION_MIN,
    );
  });
});

describe('recommendedEntryQueryParams', () => {
  test('should link a path-step recommendation by path and node, so the session counts toward the path', () => {
    const pathStepRecommendation = {
      pathId: frontendArchitecturePath.path.id,
      nodeId: cleanArchitectureNode!.id,
      resourceId: cleanArchitectureTalk.id,
    };

    expect(recommendedEntryQueryParams(pathStepRecommendation)).toEqual({
      path: frontendArchitecturePath.path.id,
      node: cleanArchitectureNode!.id,
    });
  });

  test('should link a standalone resource recommendation by resource', () => {
    expect(recommendedEntryQueryParams({ resourceId: dataIntensiveChapter.id })).toEqual({
      resource: dataIntensiveChapter.id,
    });
  });

  test('should round-trip through resolveRecommendedTarget', () => {
    const params = convertToParamMap(
      recommendedEntryQueryParams({ resourceId: dataIntensiveChapter.id }),
    );

    expect(resolveRecommendedTarget(params, groups, library)).toEqual({
      kind: 'resource',
      resourceId: dataIntensiveChapter.id,
    });
  });
});
