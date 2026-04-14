import { Component, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Papa from 'papaparse';
import { RowValidationStatus, validateRows, type ValidatedRow } from './file-import-validator.js';
import { ResourceTypeService } from '@features/learning-resource/application/resource-type.service';
import { TopicService } from '@features/learning-resource/application/topic.service';
import { LearningResourceService } from '@features/learning-resource/application/learning-resource.service';
import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository';
import { ResourceTypeHttpRepository } from '@features/learning-resource/infrastructure/resource-type-http.repository';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import { TopicHttpRepository } from '@features/learning-resource/infrastructure/topic-http.repository';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { LearningResourceHttpRepository } from '@features/learning-resource/infrastructure/learning-resource-http.repository';

export interface ParsedResourceRow {
  title: string;
  url?: string;
  notes?: string;
  difficulty?: string;
  energyLevel?: string;
  status?: string;
  estimatedDurationMinutes?: number;
  resourceTypeCode?: string;
  topicNames?: string[];
  _raw: Record<string, string>;
}

export interface ParseResult {
  rows: ParsedResourceRow[];
  fileName: string;
  totalRows: number;
  parseErrors: string[];
}

type ViewState = 'idle' | 'parsing' | 'error' | 'preview' | 'importing' | 'summary' | 'done';

@Component({
  selector: 'app-file-import',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './file-import.component.html',
  providers: [
    ResourceTypeService,
    TopicService,
    LearningResourceService,
    { provide: ResourceTypeRepository, useClass: ResourceTypeHttpRepository },
    { provide: TopicRepository, useClass: TopicHttpRepository },
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
  ],
})
export class FileImportComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly resourceTypeService = inject(ResourceTypeService);
  private readonly topicService = inject(TopicService);
  private readonly learningResourceRepository = inject(LearningResourceRepository);

  readonly viewState = signal<ViewState>('idle');
  readonly parseResult = signal<ParseResult | null>(null);
  readonly parseError = signal<string | null>(null);
  readonly isDragOver = signal(false);
  readonly exampleTab = signal<'csv' | 'json'>('csv');
  readonly copied = signal(false);
  readonly validatedRows = signal<ValidatedRow[]>([]);
  readonly importProgress = signal(0);
  readonly importTotal = signal(0);
  readonly importSuccesses = signal(0);
  readonly importFailures = signal<string[]>([]);
  readonly dataReady = signal(false);

  readonly resourceTypes = this.resourceTypeService.resourceTypes.asReadonly();
  readonly topics = this.topicService.topics.asReadonly();

  private copyTimeout: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit(): Promise<void> {
    await Promise.all([this.resourceTypeService.loadAll(), this.topicService.loadAll()]);
    this.dataReady.set(true);
  }

  get selectedRows(): ValidatedRow[] {
    return this.validatedRows().filter((r) => r.selected);
  }

  toggleRowSelection(index: number): void {
    const rows = this.validatedRows();
    const row = rows[index];
    if (row.status === 'error' || row.selectedTopicIds.length === 0) return;
    this.validatedRows.set(rows.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r)));
  }

  toggleAll(selected: boolean): void {
    if (selected) {
      this.validatedRows.set(
        this.validatedRows().map((r) => {
          const canSelect = r.status !== 'error' && r.selectedTopicIds.length > 0;
          return canSelect ? { ...r, selected: true } : r;
        }),
      );
    } else {
      this.validatedRows.set(this.validatedRows().map((r) => ({ ...r, selected: false })));
    }
  }
  toggleTopicForRow(rowIndex: number, topicId: string): void {
    const rows = this.validatedRows();
    const row = rows[rowIndex];
    const current = row.selectedTopicIds;
    const updated = current.includes(topicId)
      ? current.filter((id) => id !== topicId)
      : [...current, topicId];
    const newRow = { ...row, selectedTopicIds: updated };
    const hasBlocking = newRow.errors.some((e) => e.blocking);
    const hasTopics = updated.length > 0;
    const canSelect = !hasBlocking && hasTopics;
    const newStatus: RowValidationStatus = hasBlocking
      ? 'error'
      : newRow.errors.length > 0
        ? 'warning'
        : 'valid';
    const updatedRow = { ...newRow, status: newStatus, selected: canSelect };
    this.validatedRows.set(rows.map((r, i) => (i === rowIndex ? updatedRow : r)));
  }

  proceedToPreview(): void {
    const result = this.parseResult();
    if (!result) return;
    const validated = validateRows(result.rows, this.resourceTypes(), this.topics());
    this.validatedRows.set(validated);
    this.viewState.set('preview');
  }

  async importSelected(): Promise<void> {
    const rows = this.selectedRows;
    if (rows.length === 0) return;

    this.importTotal.set(rows.length);
    this.importProgress.set(0);
    this.importSuccesses.set(0);
    this.importFailures.set([]);
    this.viewState.set('importing');

    for (const row of rows) {
      try {
        await this.learningResourceRepository.addResourceLearning({
          title: row.resolvedTitle,
          url: row.resolvedUrl,
          notes: row.resolvedNotes,
          resourceTypeId: row.resolvedTypeId,
          topicIds: row.selectedTopicIds,
          difficulty: row.resolvedDifficulty,
          energyLevel: row.resolvedEnergyLevel,
          estimatedDurationMinutes: row.resolvedDurationMinutes,
          status: row.resolvedStatus,
        });
        this.importSuccesses.update((n) => n + 1);
      } catch {
        this.importFailures.update((f) => [...f, row.resolvedTitle]);
      }
      this.importProgress.update((n) => n + 1);
    }

    this.viewState.set('summary');
  }

  copyExample(type: 'csv' | 'json'): void {
    const csvExample = `title,url,difficulty,energyLevel,estimatedDurationMinutes,resourceTypeCode,topicNames,notes
Clean Architecture,https://example.com/book,High,High,480,book,"programming, architecture",Classic by Robert Martin
CSS Grid Guide,https://css-tricks.com/grid,Low,Low,30,article,design,Quick reference
Advanced TypeScript,,Medium,Medium,120,video,programming,`;

    const jsonExample = `[
  {
    "title": "Clean Architecture",
    "url": "https://example.com/book",
    "difficulty": "High",
    "energyLevel": "High",
    "estimatedDurationMinutes": 480,
    "resourceTypeCode": "book",
    "topicNames": ["programming", "architecture"],
    "notes": "Classic by Robert Martin"
  },
  {
    "title": "CSS Grid Guide",
    "url": "https://css-tricks.com/grid",
    "difficulty": "Low",
    "resourceTypeCode": "article",
    "topicNames": ["design"]
  },
  {
    "title": "Advanced TypeScript",
    "difficulty": "Medium",
    "energyLevel": "Medium",
    "estimatedDurationMinutes": 120,
    "resourceTypeCode": "video",
    "topicNames": ["programming"]
  }
]`;

    navigator.clipboard
      .writeText(type === 'csv' ? csvExample : jsonExample)
      .then(() => {
        this.copied.set(true);
        if (this.copyTimeout) clearTimeout(this.copyTimeout);
        this.copyTimeout = setTimeout(() => this.copied.set(false), 2000);
      })
      .catch(() => this.copied.set(false));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
    input.value = '';
  }

  private processFile(file: File): void {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'json'].includes(extension ?? '')) {
      this.parseError.set('Only .csv and .json files are supported.');
      this.viewState.set('error');
      return;
    }
    this.viewState.set('parsing');
    this.parseError.set(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (extension === 'csv') {
        this.parseCsv(content, file.name);
      } else {
        this.parseJson(content, file.name);
      }
    };
    reader.onerror = () => {
      this.parseError.set('Failed to read file.');
      this.viewState.set('error');
    };
    reader.readAsText(file);
  }

  private parseCsv(content: string, fileName: string): void {
    const result = Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
    });
    const parseErrors = result.errors.map((e) => `Row ${e.row ?? '?'}: ${e.message}`);
    const rows = result.data.map((row) => this.normalizeRow(row));
    this.parseResult.set({ rows, fileName, totalRows: rows.length, parseErrors });
    this.viewState.set('done');
  }

  private parseJson(content: string, fileName: string): void {
    try {
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) {
        this.parseError.set('JSON file must contain an array of objects.');
        this.viewState.set('error');
        return;
      }
      const rows = [];
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (item === null || typeof item !== 'object') {
          this.parseError.set(`Item at index ${i} is not an object.`);
          this.viewState.set('error');
          return;
        }
        rows.push(
          this.normalizeRow(
            Object.fromEntries(
              Object.entries(item).map(([k, v]) => [k.toLowerCase(), String(v ?? '')]),
            ),
          ),
        );
      }
      this.parseResult.set({ rows, fileName, totalRows: rows.length, parseErrors: [] });
      this.viewState.set('done');
    } catch {
      this.parseError.set('Invalid JSON format.');
      this.viewState.set('error');
    }
  }

  private normalizeRow(raw: Record<string, string>): ParsedResourceRow {
    const get = (key: string) => raw[key]?.trim() || undefined;
    const topicNamesRaw = get('topicnames') ?? get('topic_names') ?? get('topics');
    const topicNames = topicNamesRaw
      ? topicNamesRaw
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;
    const durationRaw = get('estimateddurationminutes') ?? get('duration');
    let estimatedDurationMinutes: number | undefined;
    if (durationRaw) {
      const parsed = parseInt(durationRaw, 10);
      estimatedDurationMinutes = isNaN(parsed) ? undefined : parsed;
    }
    return {
      title: get('title') ?? '',
      url: get('url'),
      notes: get('notes'),
      difficulty: get('difficulty'),
      energyLevel: get('energylevel') ?? get('energy_level'),
      status: get('status'),
      estimatedDurationMinutes,
      resourceTypeCode: get('resourcetypecode') ?? get('resource_type_code') ?? get('type'),
      topicNames,
      _raw: raw,
    };
  }

  reset(): void {
    this.viewState.set('idle');
    this.parseResult.set(null);
    this.parseError.set(null);
    this.isDragOver.set(false);
    this.validatedRows.set([]);
  }

  goBack(): void {
    this.router.navigate(['/add']);
  }

  goToResources(): void {
    this.router.navigate(['/resources']);
  }

  ngOnDestroy(): void {
    if (this.copyTimeout) clearTimeout(this.copyTimeout);
  }
}
