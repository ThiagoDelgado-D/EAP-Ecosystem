import { messageOf } from '@core/errors/error-messages';
import { setupCaptureWithFailingSave } from '@features/learning-resource/application/mocks/capture-test-setup';
import { GuidedFormComponent } from './guided-form.component';

const ARTICLE_TITLE = 'Designing Data-Intensive Applications, chapter 5';

describe('GuidedFormComponent', () => {
  test('should show why creating the resource failed', async () => {
    const { instance: form, offline, articleType } = setupCaptureWithFailingSave(GuidedFormComponent);
    form.step1Form.patchValue({ title: ARTICLE_TITLE, typeId: articleType.id });

    await form.onSubmit();

    expect(form.submitError).toBe(messageOf(offline));
    expect(form.isSubmitting).toBe(false);
  });
});
