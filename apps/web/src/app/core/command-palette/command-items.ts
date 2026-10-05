import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import { RESOURCE_STATUS_LABELS } from '@features/learning-resource/domain/learning-resource.constants';
import type { LearningPathWithNodes } from '@features/learning-path/domain/learning-path.model';

export type CommandIcon =
  | 'dashboard'
  | 'library'
  | 'route'
  | 'node'
  | 'timer'
  | 'chart'
  | 'settings'
  | 'plus'
  | 'link'
  | 'mic'
  | 'file'
  | 'sun'
  | 'moon'
  | 'search';

export interface CommandItem {
  id: string;
  label: string;
  detail?: string;
  group: string;
  icon: CommandIcon;
  run: () => void;
}

export interface CommandSearchIndex {
  resources: LearningResource[];
  paths: LearningPathWithNodes[];
}

export interface CommandSearchHandlers {
  openResource(resourceId: string): void;
  openPath(pathId: string): void;
  openNode(pathId: string, nodeId: string): void;
}

const RESOURCE_LIMIT = { idle: 4, searching: 8 };
const PATH_LIMIT = { idle: 3, searching: 5 };
const NODE_LIMIT = { idle: 0, searching: 6 };

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function includesQuery(text: string | undefined, normalizedQuery: string): boolean {
  return (text ?? '').toLowerCase().includes(normalizedQuery);
}

function sourceOf(resource: LearningResource): string | undefined {
  if (!resource.url) return undefined;
  try {
    return new URL(resource.url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

function limitFor(limit: { idle: number; searching: number }, normalizedQuery: string): number {
  return normalizedQuery ? limit.searching : limit.idle;
}

export function buildSearchItems(
  index: CommandSearchIndex,
  query: string,
  handlers: CommandSearchHandlers,
): CommandItem[] {
  const normalizedQuery = normalizeQuery(query);

  const resourceItems = index.resources
    .filter(
      (resource) =>
        !normalizedQuery ||
        includesQuery(resource.title, normalizedQuery) ||
        includesQuery(sourceOf(resource), normalizedQuery),
    )
    .slice(0, limitFor(RESOURCE_LIMIT, normalizedQuery))
    .map<CommandItem>((resource) => ({
      id: `resource-${resource.id}`,
      label: resource.title,
      detail: [RESOURCE_STATUS_LABELS[resource.status], sourceOf(resource) ?? 'No source'].join(' · '),
      group: 'Resources',
      icon: 'library',
      run: () => handlers.openResource(resource.id),
    }));

  const pathItems = index.paths
    .filter(({ path }) => !normalizedQuery || includesQuery(path.title, normalizedQuery))
    .slice(0, limitFor(PATH_LIMIT, normalizedQuery))
    .map<CommandItem>(({ path, nodes }) => ({
      id: `path-${path.id}`,
      label: path.title,
      detail: `${nodes.length} ${nodes.length === 1 ? 'node' : 'nodes'}`,
      group: 'Paths',
      icon: 'route',
      run: () => handlers.openPath(path.id),
    }));

  const nodeItems = index.paths
    .flatMap(({ path, nodes }) => nodes.map((node) => ({ path, node })))
    .filter(({ node }) => normalizedQuery && includesQuery(node.title, normalizedQuery))
    .slice(0, limitFor(NODE_LIMIT, normalizedQuery))
    .map<CommandItem>(({ path, node }) => ({
      id: `node-${node.id}`,
      label: node.title,
      detail: node.learningResourceId ? path.title : `${path.title} · Stub`,
      group: 'Nodes',
      icon: 'node',
      run: () => handlers.openNode(path.id, node.id),
    }));

  return [...resourceItems, ...pathItems, ...nodeItems];
}

export function filterCommands(items: CommandItem[], query: string): CommandItem[] {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) return items;

  return items.filter(
    (item) =>
      includesQuery(item.label, normalizedQuery) ||
      includesQuery(item.detail, normalizedQuery) ||
      includesQuery(item.group, normalizedQuery),
  );
}

export function groupCommands(items: CommandItem[]): { group: string; items: CommandItem[] }[] {
  const groups = new Map<string, CommandItem[]>();
  for (const item of items) {
    const groupItems = groups.get(item.group) ?? [];
    groupItems.push(item);
    groups.set(item.group, groupItems);
  }
  return Array.from(groups, ([group, groupItems]) => ({ group, items: groupItems }));
}
