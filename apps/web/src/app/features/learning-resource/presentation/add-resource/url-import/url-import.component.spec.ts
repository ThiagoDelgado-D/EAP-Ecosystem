import { messageOf } from '@core/errors/error-messages';
import { setupCaptureWithFailingSave } from '@features/learning-resource/application/mocks/capture-test-setup';
import { UrlPreviewService } from '@features/learning-resource/application/url-preview.service';
import { UrlImportComponent } from './url-import.component';

const ARTICLE_TITLE = 'Designing Data-Intensive Applications, chapter 5';
const ARTICLE_URL = 'https://dataintensive.net/chapter-5';
const SYSTEMS_DESIGN_TOPIC_ID = crypto.randomUUID();

describe('UrlImportComponent', () => {
  test('should show why saving the imported resource failed', async () => {
    const { fixture, instance: importer, offline, articleType } = setupCaptureWithFailingSave(UrlImportComponent);
    fixture.debugElement.injector.get(UrlPreviewService).previewData.set({ title: ARTICLE_TITLE });
    importer.urlInput = ARTICLE_URL;
    importer.editableTypeId = articleType.id;
    importer.selectedTopicIds.set([SYSTEMS_DESIGN_TOPIC_ID]);

    await importer.saveResource();

    expect(importer.saveError()).toBe(messageOf(offline));
  });
});
