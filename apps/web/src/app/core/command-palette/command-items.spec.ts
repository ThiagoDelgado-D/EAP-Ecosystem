import type { Mock } from 'vitest';
import {
  buildSearchItems,
  filterCommands,
  groupCommands,
  type CommandItem,
  type CommandSearchHandlers,
} from './command-items';
import { commandPaletteFixtures } from './command-palette.fixtures';

describe('command items', () => {
  let fixtures: ReturnType<typeof commandPaletteFixtures>;
  let handlers: { [Handler in keyof CommandSearchHandlers]: Mock<CommandSearchHandlers[Handler]> };

  beforeEach(() => {
    fixtures = commandPaletteFixtures();
    handlers = { openResource: vi.fn(), openPath: vi.fn(), openNode: vi.fn() };
  });

  const searchIndex = () => ({
    resources: [fixtures.rustBookResource, fixtures.kubernetesTalkResource],
    paths: [fixtures.rustPathWithNodes],
  });

  test('should describe a resource by its status and the host it comes from', () => {
    const [rustBookItem] = buildSearchItems(searchIndex(), '', handlers);

    expect(rustBookItem).toMatchObject({
      label: 'The Rust Programming Language',
      detail: 'In Progress · doc.rust-lang.org',
      group: 'Resources',
    });
  });

  test('should match a resource by its source host, not only by its title', () => {
    const youtubeMatches = buildSearchItems(searchIndex(), 'youtube', handlers);

    expect(youtubeMatches.map((item) => item.label)).toEqual(['Intro to Kubernetes']);
  });

  test('should keep nodes out of the idle list and surface them only while searching', () => {
    const idleGroups = new Set(buildSearchItems(searchIndex(), '', handlers).map((item) => item.group));
    const traitSearch = buildSearchItems(searchIndex(), 'trait', handlers);

    expect(idleGroups.has('Nodes')).toBe(false);
    expect(traitSearch).toEqual([
      expect.objectContaining({ label: 'Trait Objects', detail: 'Rust for Backend Engineers · Stub', group: 'Nodes' }),
    ]);
  });

  test('should open the node inside its path when a node result runs', () => {
    const [traitObjectsItem] = buildSearchItems(searchIndex(), 'trait', handlers);

    traitObjectsItem.run();

    expect(handlers.openNode).toHaveBeenCalledWith(fixtures.rustPath.id, fixtures.traitObjectsStubNode.id);
  });

  test('should label a path with how many nodes it holds', () => {
    const rustPathItem = buildSearchItems(searchIndex(), 'backend', handlers).find((item) => item.group === 'Paths');

    expect(rustPathItem?.detail).toBe('2 nodes');
  });

  test('should filter commands by label, detail or group name, ignoring case and surrounding spaces', () => {
    const goToSettings: CommandItem = { id: 'go-settings', label: 'Go to Settings', group: 'Navigate', icon: 'settings', run: vi.fn() };
    const voiceCapture: CommandItem = { id: 'capture-voice', label: 'Voice capture', detail: 'Speak it in', group: 'Actions', icon: 'mic', run: vi.fn() };

    expect(filterCommands([goToSettings, voiceCapture], '  SETTINGS ')).toEqual([goToSettings]);
    expect(filterCommands([goToSettings, voiceCapture], 'speak')).toEqual([voiceCapture]);
    expect(filterCommands([goToSettings, voiceCapture], 'navigate')).toEqual([goToSettings]);
    expect(filterCommands([goToSettings, voiceCapture], '')).toEqual([goToSettings, voiceCapture]);
  });

  test('should group commands in the order their groups first appear', () => {
    const groups = groupCommands(buildSearchItems(searchIndex(), 'rust', handlers));

    expect(groups.map((section) => section.group)).toEqual(['Resources', 'Paths']);
  });
});
