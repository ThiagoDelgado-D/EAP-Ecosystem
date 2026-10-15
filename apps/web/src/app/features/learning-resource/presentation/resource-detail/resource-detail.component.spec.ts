import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { ConfirmDialogService } from '@core/dialogs/confirm-dialog.service';
import { messageOf } from '@core/errors/error-messages';
import { ErrorNotifier } from '@core/errors/error-notifier.service';
import { offlineError } from '@core/errors/mocks/offline-error.fixture';
import { LearningResourceService } from '@features/learning-resource/application/learning-resource.service';
import { ResourceTypeService } from '@features/learning-resource/application/resource-type.service';
import { TopicService } from '@features/learning-resource/application/topic.service';
import { mockResourceTypeRepository } from '@features/learning-resource/application/mocks/mock-resource-type.repository';
import { mockTopicRepository } from '@features/learning-resource/application/mocks/mock-topic.repository';
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import { mockLocalStorage } from '@features/pomodoro/application/mocks/mock-local-storage';
import { ResourceDetailComponent } from './resource-detail.component';

const RUST_BOOK_TITLE = 'The Rust Programming Language';
const RUST_BOOK_MINUTES = 240;
const RUST_BOOK_NOTES = 'Chapter 17 on trait objects';

describe('ResourceDetailComponent', () => {
  const now = new Date();
  const rustBook: LearningResource = {
    id: crypto.randomUUID(),
    title: RUST_BOOK_TITLE,
    difficulty: 'Medium',
    energyLevel: 'Medium',
    status: 'InProgress',
    estimatedDuration: { value: RUST_BOOK_MINUTES, isEstimated: false },
    topicIds: [],
    typeId: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  const resourceService = {
    loading: signal(false),
    error: signal<string | null>(null),
    getById: vi.fn(),
    updateResource: vi.fn(),
    deleteResource: vi.fn(),
    toggleField: vi.fn(),
  };

  const renderComponent = () => {
    TestBed.overrideComponent(ResourceDetailComponent, {
      set: {
        providers: [
          TopicService,
          ResourceTypeService,
          { provide: LearningResourceService, useValue: resourceService },
          { provide: TopicRepository, useValue: mockTopicRepository() },
          { provide: ResourceTypeRepository, useValue: mockResourceTypeRepository() },
        ],
      },
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ConfirmDialogService, useValue: { confirm: vi.fn().mockResolvedValue(true) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: rustBook.id }) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(ResourceDetailComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  };

  const renderLoaded = async () => {
    const rendered = renderComponent();
    await vi.waitFor(() => expect(rendered.component.resource()?.id).toBe(rustBook.id));
    return rendered;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', mockLocalStorage());
    resourceService.getById.mockResolvedValue(rustBook);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('shows why the resource failed to load', async () => {
    const offline = offlineError();
    resourceService.getById.mockRejectedValueOnce(offline);

    const { fixture, component } = renderComponent();

    await vi.waitFor(() => expect(component.loadError()).toBe(messageOf(offline)));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(messageOf(offline));
  });

  test('reports why saving notes failed and keeps the resource on screen', async () => {
    const { fixture, component } = await renderLoaded();
    const offline = offlineError();
    resourceService.updateResource.mockRejectedValueOnce(offline);
    const notify = vi.spyOn(TestBed.inject(ErrorNotifier), 'notify');

    component.notesDraft.set(RUST_BOOK_NOTES);
    await component.saveNotes();
    fixture.detectChanges();

    expect(notify).toHaveBeenCalledWith(offline);
    expect(component.loadError()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(RUST_BOOK_TITLE);
  });

  test('reports why deleting failed and stays on the resource', async () => {
    const { component } = await renderLoaded();
    const offline = offlineError();
    resourceService.deleteResource.mockRejectedValueOnce(offline);
    const notify = vi.spyOn(TestBed.inject(ErrorNotifier), 'notify');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');

    await component.deleteResource();

    expect(notify).toHaveBeenCalledWith(offline);
    expect(navigate).not.toHaveBeenCalled();
  });

});
