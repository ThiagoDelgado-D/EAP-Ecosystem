import { messageOf } from '@core/errors/error-messages';
import { setupCaptureWithFailingSave } from '@features/learning-resource/application/mocks/capture-test-setup';
import { VoiceCaptureComponent } from './voice-capture.component';

const DICTATED_TITLE = 'Designing Data-Intensive Applications, chapter 5';
const SYSTEMS_DESIGN_TOPIC_ID = crypto.randomUUID();

describe('VoiceCaptureComponent', () => {
  test('should show why saving the dictated resource failed', async () => {
    const { instance: voice, offline, articleType } = setupCaptureWithFailingSave(VoiceCaptureComponent);
    voice.editableTitle = DICTATED_TITLE;
    voice.editableTypeId = articleType.id;
    voice.selectedTopicIds.set([SYSTEMS_DESIGN_TOPIC_ID]);

    await voice.saveResource();

    expect(voice.saveError()).toBe(messageOf(offline));
    expect(voice.saving()).toBe(false);
  });
});
