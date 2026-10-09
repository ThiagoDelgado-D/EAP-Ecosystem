import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TONES, toneVar, type Tone } from '@shared/utils/tone';
import {
  DuplicateTopicNameError,
  TopicService,
} from '@features/learning-resource/application/topic.service';
import type { Topic } from '@features/learning-resource/domain/topic.model';

const GENERIC_ERROR = 'Something went wrong. Try again.';

@Component({
  selector: 'app-topic-picker',
  standalone: true,
  imports: [FormsModule],
  host: { class: 'relative block' },
  templateUrl: './topic-picker.component.html',
})
export class TopicPickerComponent {
  private readonly topicService = inject(TopicService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly selectedIds = model<string[]>([]);

  protected readonly tones = TONES;
  protected readonly toneVar = toneVar;

  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly editingTopicId = signal<string | null>(null);
  protected readonly confirmingDelete = signal(false);
  protected readonly renameDraft = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly selectedTopics = computed(() => {
    const byId = new Map(this.topicService.topics().map((topic) => [topic.id, topic]));
    return this.selectedIds()
      .map((id) => byId.get(id))
      .filter((topic): topic is Topic => topic !== undefined);
  });

  protected readonly matchingTopics = computed(() => {
    const needle = this.query().trim().toLowerCase();
    return this.topicService
      .topics()
      .filter((topic) => topic.name.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  protected readonly exactMatch = computed(() => {
    const needle = this.query().trim().toLowerCase();
    return this.topicService.topics().find((topic) => topic.name.toLowerCase() === needle);
  });

  protected readonly canCreate = computed(
    () => this.query().trim().length > 0 && this.exactMatch() === undefined,
  );

  protected readonly editingTopic = computed(() =>
    this.topicService.topics().find((topic) => topic.id === this.editingTopicId()),
  );

  constructor() {
    effect(() => {
      if (!this.open() || this.editingTopicId()) return;
      this.searchInput()?.nativeElement.focus();
    });
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    if (this.host.nativeElement.contains(event.target as Node)) return;
    this.close();
  }

  @HostListener('keydown.escape')
  protected onEscape(): void {
    if (this.editingTopicId()) {
      this.closeMenu();
      return;
    }
    this.close();
  }

  protected toggleOpen(): void {
    if (this.open()) {
      this.close();
      return;
    }
    this.open.set(true);
  }

  protected isSelected(topic: Topic): boolean {
    return this.selectedIds().includes(topic.id);
  }

  protected toggle(topic: Topic): void {
    if (this.isSelected(topic)) {
      this.deselect(topic.id);
      return;
    }
    this.selectedIds.update((ids) => [...ids, topic.id]);
  }

  protected deselect(topicId: string): void {
    this.selectedIds.update((ids) => ids.filter((id) => id !== topicId));
  }

  protected async submitQuery(): Promise<void> {
    const match = this.exactMatch();
    if (match) {
      if (!this.isSelected(match)) this.toggle(match);
      this.query.set('');
      return;
    }
    if (this.canCreate()) await this.create();
  }

  protected async create(): Promise<void> {
    const name = this.query().trim();
    await this.run(async () => {
      const created = await this.topicService.create({ name });
      this.selectedIds.update((ids) => [...ids, created.id]);
      this.query.set('');
    });
  }

  protected openMenu(topic: Topic): void {
    this.editingTopicId.set(topic.id);
    this.renameDraft.set(topic.name);
    this.confirmingDelete.set(false);
    this.error.set(null);
  }

  protected closeMenu(): void {
    this.editingTopicId.set(null);
    this.confirmingDelete.set(false);
    this.error.set(null);
  }

  protected async rename(): Promise<void> {
    const topic = this.editingTopic();
    const name = this.renameDraft().trim();
    if (!topic || !name || name === topic.name) return;
    await this.run(() => this.topicService.update(topic, { name }));
  }

  protected async recolor(tone: Tone): Promise<void> {
    const topic = this.editingTopic();
    if (!topic || topic.color === tone) return;
    await this.run(() => this.topicService.update(topic, { color: tone }));
  }

  protected async confirmDelete(): Promise<void> {
    const topic = this.editingTopic();
    if (!topic) return;
    await this.run(async () => {
      await this.topicService.remove(topic);
      this.deselect(topic.id);
      this.closeMenu();
    });
  }

  protected usageLabel(topic: Topic): string {
    if (topic.resourceCount === 0) return 'No resources use it yet.';
    if (topic.resourceCount === 1) {
      return 'Used by 1 resource. It will be removed from it, and the resource stays.';
    }
    return `Used by ${topic.resourceCount} resources. It will be removed from them, and the resources stay.`;
  }

  private close(): void {
    this.open.set(false);
    this.query.set('');
    this.closeMenu();
  }

  private async run(action: () => Promise<unknown>): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await action();
    } catch (error) {
      this.error.set(this.messageFor(error));
    } finally {
      this.busy.set(false);
    }
  }

  private messageFor(error: unknown): string {
    if (error instanceof DuplicateTopicNameError) {
      return `You already have a topic named "${error.topicName}".`;
    }
    return GENERIC_ERROR;
  }
}
