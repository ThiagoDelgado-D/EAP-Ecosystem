import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ResourceTypeService } from '@features/learning-resource/application/resource-type.service';
import { TopicService } from '@features/learning-resource/application/topic.service';
import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import { mockResourceTypeRepository } from '@features/learning-resource/application/mocks/mock-resource-type.repository';
import { mockTopicRepository } from '@features/learning-resource/application/mocks/mock-topic.repository';
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import type { ResourceType } from '@features/learning-resource/domain/resource-type.model';
import type { Topic } from '@features/learning-resource/domain/topic.model';
import { LibraryResourceRowComponent } from './library-resource-row.component';

const now = new Date('2026-09-20T10:00:00.000Z');

const articleTypeId = crypto.randomUUID();
const articleType: ResourceType = {
  id: articleTypeId,
  code: 'article',
  displayName: 'Article',
  createdAt: now,
  updatedAt: now,
};

const typeScriptTopicId = crypto.randomUUID();
const typeScriptTopic: Topic = { id: typeScriptTopicId, name: 'TypeScript', createdAt: now, updatedAt: now };

const typeScriptGenericsResource: LearningResource = {
  id: crypto.randomUUID(),
  title: 'TypeScript Generics In Depth',
  difficulty: 'Medium',
  energyLevel: 'Medium',
  status: 'InProgress',
  estimatedDuration: { value: 45, isEstimated: true },
  topicIds: [typeScriptTopicId],
  typeId: articleTypeId,
  createdAt: now,
  updatedAt: now,
};

function setup(resourceTypes: ResourceType[] = [], topics: Topic[] = []) {
  const resourceTypeRepository = mockResourceTypeRepository({ resourceTypes });
  const topicRepository = mockTopicRepository({ topics });

  TestBed.overrideComponent(LibraryResourceRowComponent, {
    set: {
      providers: [
        ResourceTypeService,
        { provide: ResourceTypeRepository, useValue: resourceTypeRepository },
        TopicService,
        { provide: TopicRepository, useValue: topicRepository },
      ],
    },
  });

  const fixture = TestBed.createComponent(LibraryResourceRowComponent);
  return { fixture, component: fixture.componentInstance };
}

describe('LibraryResourceRowComponent', () => {
  test('should render the resource title', () => {
    const { fixture, component } = setup();
    component.resource = typeScriptGenericsResource;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('TypeScript Generics In Depth');
  });

  test('should build the subtitle from the resolved type, topic and duration', async () => {
    const { fixture, component } = setup([articleType], [typeScriptTopic]);
    component.resource = typeScriptGenericsResource;
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(component.subtitle()).toBe('Article · TypeScript · 45 min');
  });

  test('should omit the path count when the resource belongs to no path', () => {
    const { fixture, component } = setup();
    component.resource = typeScriptGenericsResource;
    component.pathCount = 0;
    fixture.detectChanges();

    expect(component.subtitle()).not.toContain('path');
  });

  test('should append the path count when the resource belongs to at least one path', () => {
    const { fixture, component } = setup();
    component.resource = typeScriptGenericsResource;
    component.pathCount = 2;
    fixture.detectChanges();

    expect(component.subtitle()).toContain('in 2 paths');
  });

  test('should not leave a dangling separator when type/topic have not resolved yet', () => {
    const { fixture, component } = setup();
    component.resource = { ...typeScriptGenericsResource, topicIds: [] };
    fixture.detectChanges();

    expect(component.subtitle()).toBe('45 min');
  });

  test('should emit rowClick when the row is clicked', () => {
    const { fixture, component } = setup();
    component.resource = typeScriptGenericsResource;
    const rowClick = vi.fn();
    component.rowClick.subscribe(rowClick);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(rowClick).toHaveBeenCalledOnce();
  });

  test('should show the status badge as readonly, since the row only displays state, it does not edit it', () => {
    const { fixture, component } = setup();
    component.resource = typeScriptGenericsResource;
    fixture.detectChanges();

    const badge = fixture.debugElement.query(By.css('app-enum-badge'));
    expect(badge.componentInstance.readonly).toBe(true);
  });
});
