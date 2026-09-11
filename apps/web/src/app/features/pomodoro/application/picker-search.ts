import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import type { PickerPathGroup, PickerPathNode } from './pomodoro-picker.model';

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function filterPickerNodes(entries: PickerPathNode[], query: string): PickerPathNode[] {
  const q = normalizeQuery(query);
  if (!q) return entries;
  return entries.filter(
    (entry) => entry.node.title.toLowerCase().includes(q) || entry.path.title.toLowerCase().includes(q),
  );
}

export function filterPickerPathGroups(groups: PickerPathGroup[], query: string): PickerPathGroup[] {
  const q = normalizeQuery(query);
  return groups
    .map((group) => ({
      path: group.path,
      nodes: q
        ? group.nodes.filter(
            (node) => node.title.toLowerCase().includes(q) || group.path.title.toLowerCase().includes(q),
          )
        : group.nodes,
    }))
    .filter((group) => !q || group.nodes.length > 0);
}

export function filterLibraryResources(resources: LearningResource[], query: string): LearningResource[] {
  const q = normalizeQuery(query);
  if (!q) return resources;
  return resources.filter((resource) => resource.title.toLowerCase().includes(q));
}
