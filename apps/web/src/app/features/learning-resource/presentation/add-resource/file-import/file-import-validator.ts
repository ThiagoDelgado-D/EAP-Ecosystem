import type { ParsedResourceRow } from './file-import.component';
import type { ResourceType } from '@features/learning-resource/domain/resource-type.model';
import type { Topic } from '@features/learning-resource/domain/topic.model';
import type {
  DifficultyLevel,
  EnergyLevel,
  ResourceStatus,
} from '@features/learning-resource/domain/learning-resource.model';

export type RowValidationStatus = 'valid' | 'warning' | 'error';

export interface RowError {
  field: string;
  message: string;
  blocking: boolean;
}

export interface ValidatedRow {
  index: number;
  raw: ParsedResourceRow;
  resolvedTitle: string;
  resolvedUrl?: string;
  resolvedNotes?: string;
  resolvedDifficulty: DifficultyLevel;
  resolvedEnergyLevel: EnergyLevel;
  resolvedStatus: ResourceStatus;
  resolvedDurationMinutes: number;
  resolvedTypeId: string;
  availableTopics: { id: string; name: string }[];
  selectedTopicIds: string[];
  errors: RowError[];
  status: RowValidationStatus;
  selected: boolean;
}

const VALID_DIFFICULTIES: DifficultyLevel[] = ['Low', 'Medium', 'High'];
const VALID_ENERGY_LEVELS: EnergyLevel[] = ['Low', 'Medium', 'High'];
const VALID_STATUSES: ResourceStatus[] = ['Pending', 'InProgress', 'Completed'];

const URL_PATTERN = /^https?:\/\/.+/i;

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function resolveStatus(raw?: string): ResourceStatus {
  if (!raw) return 'Pending';
  const normalized = raw.toLowerCase().replace('_', '');
  if (normalized === 'inprogress') return 'InProgress';
  const capitalized = capitalize(raw);
  if (VALID_STATUSES.includes(capitalized as ResourceStatus)) {
    return capitalized as ResourceStatus;
  }
  return 'Pending';
}

export function validateRows(
  rows: ParsedResourceRow[],
  resourceTypes: ResourceType[],
  topics: Topic[],
): ValidatedRow[] {
  const availableTopics = topics.map((t) => ({ id: t.id, name: t.name }));

  return rows.map((row, index) => {
    const errors: RowError[] = [];

    if (!row.title?.trim()) {
      errors.push({ field: 'title', message: 'Title is required', blocking: true });
    }

    // URL
    if (row.url && !URL_PATTERN.test(row.url)) {
      errors.push({ field: 'url', message: 'Invalid URL format', blocking: true });
    }

    let resolvedDifficulty: DifficultyLevel = 'Medium';
    if (row.difficulty) {
      const capitalized = capitalize(row.difficulty);
      if (VALID_DIFFICULTIES.includes(capitalized as DifficultyLevel)) {
        resolvedDifficulty = capitalized as DifficultyLevel;
      } else {
        errors.push({
          field: 'difficulty',
          message: `Unknown difficulty "${row.difficulty}" — defaulting to Medium`,
          blocking: false,
        });
      }
    } else {
      errors.push({
        field: 'difficulty',
        message: 'Missing difficulty — defaulting to Medium',
        blocking: false,
      });
    }

    // Energy level
    let resolvedEnergyLevel: EnergyLevel = 'Medium';
    if (row.energyLevel) {
      const capitalized = capitalize(row.energyLevel);
      if (VALID_ENERGY_LEVELS.includes(capitalized as EnergyLevel)) {
        resolvedEnergyLevel = capitalized as EnergyLevel;
      } else {
        errors.push({
          field: 'energyLevel',
          message: `Unknown energy level "${row.energyLevel}" — defaulting to Medium`,
          blocking: false,
        });
      }
    }

    let resolvedTypeId = resourceTypes[0]?.id ?? '';
    if (row.resourceTypeCode) {
      const matched = resourceTypes.find(
        (t) => t.code.toLowerCase() === row.resourceTypeCode!.toLowerCase(),
      );
      if (matched) {
        resolvedTypeId = matched.id;
      } else {
        errors.push({
          field: 'resourceTypeCode',
          message: `Unknown type "${row.resourceTypeCode}" — defaulting to ${resourceTypes[0]?.displayName ?? 'first available'}`,
          blocking: false,
        });
      }
    } else {
      errors.push({
        field: 'resourceTypeCode',
        message: `No type specified — defaulting to ${resourceTypes[0]?.displayName ?? 'first available'}`,
        blocking: false,
      });
    }

    const selectedTopicIds: string[] = [];
    if (row.topicNames && row.topicNames.length > 0) {
      for (const name of row.topicNames) {
        const matched = topics.find((t) => t.name.toLowerCase() === name.toLowerCase());
        if (matched) {
          selectedTopicIds.push(matched.id);
        }
      }
    }
    if (selectedTopicIds.length === 0) {
      errors.push({
        field: 'topicIds',
        message: 'No topics automatically matched — please select manually below',
        blocking: false,
      });
    }

    const resolvedDurationMinutes = row.estimatedDurationMinutes ?? 30;
    if (!row.estimatedDurationMinutes) {
      errors.push({
        field: 'estimatedDurationMinutes',
        message: 'Missing duration — defaulting to 30 min',
        blocking: false,
      });
    }

    const hasTopics = selectedTopicIds.length > 0;
    const hasBlocking = errors.some((e) => e.blocking);
    const canSelect = !hasBlocking && hasTopics;
    const status: RowValidationStatus = hasBlocking
      ? 'error'
      : errors.length > 0
        ? 'warning'
        : 'valid';

    return {
      index,
      raw: row,
      resolvedTitle: row.title?.trim() || '',
      resolvedUrl: row.url,
      resolvedNotes: row.notes,
      resolvedDifficulty,
      resolvedEnergyLevel,
      resolvedStatus: resolveStatus(row.status),
      resolvedDurationMinutes,
      resolvedTypeId,
      availableTopics,
      selectedTopicIds,
      errors,
      status,
      selected: canSelect,
    };
  });
}
