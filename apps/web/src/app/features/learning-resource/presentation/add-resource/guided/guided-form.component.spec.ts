import { messageOf } from '@core/errors/error-messages';
import { setupCaptureWithFailingSave } from '@features/learning-resource/application/mocks/capture-test-setup';
import { GuidedFormComponent } from './guided-form.component';

const ARTICLE_TITLE = 'Designing Data-Intensive Applications, chapter 5';

describe('GuidedFormComponent', () => {
  test('should show why creating the resource failed without waiting for another interaction', async () => {
    const { fixture, instance: form, offline, articleType } = setupCaptureWithFailingSave(GuidedFormComponent);
    fixture.autoDetectChanges();
    form.step1Form.patchValue({ title: ARTICLE_TITLE, typeId: articleType.id });

    await form.onSubmit();
    await fixture.whenStable();

    expect(form.submitError()).toBe(messageOf(offline));
    expect(form.isSubmitting()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain(messageOf(offline));
  });
});
