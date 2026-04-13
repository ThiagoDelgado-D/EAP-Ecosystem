import { Component, inject, signal, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import Papa from 'papaparse';

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

type ViewState = 'idle' | 'parsing' | 'error' | 'done';

@Component({
  selector: 'app-file-import',
  standalone: true,
  templateUrl: './file-import.component.html',
})
export class FileImportComponent implements OnDestroy {
  private readonly router = inject(Router);

  readonly viewState = signal<ViewState>('idle');
  readonly parseResult = signal<ParseResult | null>(null);
  readonly parseError = signal<string | null>(null);
  readonly isDragOver = signal(false);

  private objectUrl: string | null = null;

  readonly exampleTab = signal<'csv' | 'json'>('csv');
  readonly copied = signal(false);

  private copyTimeout: ReturnType<typeof setTimeout> | null = null;

  copyExample(type: 'csv' | 'json'): void {
    const csvExample = `title,url,difficulty,energyLevel,estimatedDurationMinutes,resourceTypeCode,topicNames,notes
Clean Architecture,https://example.com/book,High,High,480,book,"programming,architecture",Classic by Robert Martin
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
  }
]`;

    navigator.clipboard.writeText(type === 'csv' ? csvExample : jsonExample);
    this.copied.set(true);

    if (this.copyTimeout) clearTimeout(this.copyTimeout);
    this.copyTimeout = setTimeout(() => this.copied.set(false), 2000);
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

    const parseErrors: string[] = result.errors.map((e) => `Row ${e.row ?? '?'}: ${e.message}`);

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

      const rows = parsed.map((item) =>
        this.normalizeRow(
          Object.fromEntries(
            Object.entries(item).map(([k, v]) => [k.toLowerCase(), String(v ?? '')]),
          ),
        ),
      );

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
    const estimatedDurationMinutes = durationRaw
      ? parseInt(durationRaw, 10) || undefined
      : undefined;

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
  }

  goBack(): void {
    this.router.navigate(['/add']);
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
    if (this.copyTimeout) clearTimeout(this.copyTimeout);
  }
}
