import { messageOf } from '@core/errors/error-messages';
import { setupCaptureWithFailingSave } from '@features/learning-resource/application/mocks/capture-test-setup';
import { CaptureSheetComponent } from './capture-sheet.component';

const ARTICLE_TITLE = 'Designing Data-Intensive Applications, chapter 5';

describe('CaptureSheetComponent', () => {
  test('should show why saving the capture failed', async () => {
    const { instance: sheet, offline, articleType } = setupCaptureWithFailingSave(CaptureSheetComponent);
    sheet.title.set(ARTICLE_TITLE);
    sheet.typeId.set(articleType.id);

    await sheet.save();

    expect(sheet.error()).toBe(messageOf(offline));
    expect(sheet.saving()).toBe(false);
  });
});
