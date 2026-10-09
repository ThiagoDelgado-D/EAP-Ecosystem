import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import type { Topic } from '@features/learning-resource/domain/topic.model';
import { TopicService } from '@features/learning-resource/application/topic.service';
import {
  mockTopicRepository,
  type MockedTopicRepository,
} from '@features/learning-resource/application/mocks/mock-topic.repository';
import { TopicPickerComponent } from './topic-picker.component';

const RUST_TOPIC_NAME = 'Rust';
const RUST_LANG_TOPIC_NAME = 'Rust lang';
const SYSTEMS_DESIGN_TOPIC_NAME = 'Systems Design';
const DISTRIBUTED_SYSTEMS_TOPIC_NAME = 'Distributed Systems';
const RUST_RESOURCE_COUNT = 3;

const buildTopic = (name: string, resourceCount = 0): Topic => {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    name,
    color: 'ember',
    resourceCount,
    createdAt: now,
    updatedAt: now,
  };
};

describe('TopicPickerComponent', () => {
  let fixture: ComponentFixture<TopicPickerComponent>;
  let picker: TopicPickerComponent;
  let repository: MockedTopicRepository;
  let rustTopic: Topic;
  let systemsDesignTopic: Topic;

  beforeEach(async () => {
    rustTopic = buildTopic(RUST_TOPIC_NAME, RUST_RESOURCE_COUNT);
    systemsDesignTopic = buildTopic(SYSTEMS_DESIGN_TOPIC_NAME);
    repository = mockTopicRepository({ topics: [rustTopic, systemsDesignTopic] });
    await TestBed.configureTestingModule({
      imports: [TopicPickerComponent],
      providers: [TopicService, { provide: TopicRepository, useValue: repository }],
    }).compileComponents();

    await TestBed.inject(TopicService).loadAll();
    fixture = TestBed.createComponent(TopicPickerComponent);
    picker = fixture.componentInstance;
    fixture.componentRef.setInput('selectedIds', [rustTopic.id]);
    fixture.detectChanges();
  });

  const element = (): HTMLElement => fixture.nativeElement;

  const buttonLabelled = (label: string): HTMLButtonElement => {
    const button = element().querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
    if (!button) throw new Error(`No button labelled "${label}"`);
    return button;
  };

  const buttonWithText = (text: string): HTMLButtonElement => {
    const button = Array.from(element().querySelectorAll<HTMLButtonElement>('button')).find(
      (candidate) => candidate.textContent?.includes(text),
    );
    if (!button) throw new Error(`No button with text "${text}"`);
    return button;
  };

  const click = async (button: HTMLButtonElement) => {
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const typeInto = (selector: string, value: string) => {
    const input = element().querySelector<HTMLInputElement>(selector);
    if (!input) throw new Error(`No input "${selector}"`);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    return input;
  };

  const pressEnter = async (input: HTMLInputElement) => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const openPicker = () => click(buttonWithText('Add topic'));

  test('shows the selected topics and removes one from its chip', async () => {
    expect(element().textContent).toContain(RUST_TOPIC_NAME);

    await click(buttonLabelled(`Remove ${RUST_TOPIC_NAME}`));

    expect(picker.selectedIds()).toEqual([]);
  });

  test('selects a topic from the list', async () => {
    await openPicker();
    await click(buttonWithText(SYSTEMS_DESIGN_TOPIC_NAME));

    expect(picker.selectedIds()).toEqual([rustTopic.id, systemsDesignTopic.id]);
  });

  test('creates a topic from a new name and selects it', async () => {
    await openPicker();
    typeInto('#topic-picker-search', DISTRIBUTED_SYSTEMS_TOPIC_NAME);
    await click(buttonWithText('Create'));

    const created = repository.topics.find((topic) => topic.name === DISTRIBUTED_SYSTEMS_TOPIC_NAME);
    expect(created).toBeDefined();
    expect(picker.selectedIds()).toContain(created?.id);
  });

  test('selects the existing topic instead of creating one when Enter matches a name', async () => {
    fixture.componentRef.setInput('selectedIds', []);
    await openPicker();
    const search = typeInto('#topic-picker-search', SYSTEMS_DESIGN_TOPIC_NAME.toLowerCase());
    await pressEnter(search);

    expect(picker.selectedIds()).toEqual([systemsDesignTopic.id]);
    expect(repository.topics).toHaveLength(2);
  });

  test('renames and recolors a topic from its menu', async () => {
    await openPicker();
    await click(buttonLabelled(`Edit ${RUST_TOPIC_NAME}`));
    await pressEnter(typeInto('#topic-picker-rename', RUST_LANG_TOPIC_NAME));
    await click(buttonLabelled('plum'));

    const renamed = repository.topics.find((topic) => topic.id === rustTopic.id);
    expect(renamed?.name).toBe(RUST_LANG_TOPIC_NAME);
    expect(renamed?.color).toBe('plum');
  });

  test('shows how many resources use a topic before deleting it, then deselects it', async () => {
    await openPicker();
    await click(buttonLabelled(`Edit ${RUST_TOPIC_NAME}`));
    await click(buttonWithText('Delete topic'));

    expect(element().textContent).toContain(`Used by ${RUST_RESOURCE_COUNT} resources`);

    await click(buttonWithText('Delete'));

    expect(repository.topics.map((topic) => topic.id)).toEqual([systemsDesignTopic.id]);
    expect(picker.selectedIds()).toEqual([]);
  });

  test('explains a duplicate name instead of renaming', async () => {
    await openPicker();
    await click(buttonLabelled(`Edit ${RUST_TOPIC_NAME}`));
    await pressEnter(typeInto('#topic-picker-rename', SYSTEMS_DESIGN_TOPIC_NAME));

    expect(element().querySelector('[role="alert"]')?.textContent).toContain(SYSTEMS_DESIGN_TOPIC_NAME);
    expect(repository.topics.find((topic) => topic.id === rustTopic.id)?.name).toBe(RUST_TOPIC_NAME);
  });
});
