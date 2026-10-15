import { messageOf } from '@core/errors/error-messages';
import { setupCaptureWithFailingSave } from '@features/learning-resource/application/mocks/capture-test-setup';
import type { ValidatedRow } from './file-import-validator';
import { FileImportComponent } from './file-import.component';

const IMPORTED_TITLE = 'Designing Data-Intensive Applications, chapter 5';
const IMPORTED_MINUTES = 45;

describe('FileImportComponent', () => {
  test('should list each resource that failed to import with the reason', async () => {
    const { instance: importer, offline, articleType } = setupCaptureWithFailingSave(FileImportComponent);
    const importedRow: ValidatedRow = {
      index: 0,
      raw: { title: IMPORTED_TITLE, _raw: {} },
      resolvedTitle: IMPORTED_TITLE,
      resolvedDifficulty: 'Medium',
      resolvedEnergyLevel: 'Medium',
      resolvedStatus: 'Pending',
      resolvedDurationMinutes: IMPORTED_MINUTES,
      resolvedTypeId: articleType.id,
      selectedTopicIds: [],
      errors: [],
      status: 'valid',
      selected: true,
    };
    importer.validatedRows.set([importedRow]);

    await importer.importSelected();

    expect(importer.importFailures()).toEqual([{ title: IMPORTED_TITLE, reason: messageOf(offline) }]);
    expect(importer.importSuccesses()).toBe(0);
  });
});
