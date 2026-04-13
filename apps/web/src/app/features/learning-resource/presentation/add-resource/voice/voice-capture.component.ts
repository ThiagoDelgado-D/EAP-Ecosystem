import { Component, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  SpeechRecognition,
  SpeechRecognitionConstructor,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionEvent,
  WindowWithSpeech,
} from './types/voice-capture.types.js';
import { parseTranscript } from './types/voice-transcript.parser.js';
import { LearningResourceService } from '@features/learning-resource/application/learning-resource.service';
import { ResourceTypeService } from '@features/learning-resource/application/resource-type.service';
import { TopicService } from '@features/learning-resource/application/topic.service';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { LearningResourceHttpRepository } from '@features/learning-resource/infrastructure/learning-resource-http.repository';
import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository';
import { ResourceTypeHttpRepository } from '@features/learning-resource/infrastructure/resource-type-http.repository';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import { TopicHttpRepository } from '@features/learning-resource/infrastructure/topic-http.repository';

type RecordingState =
  | 'idle'
  | 'recording'
  | 'done'
  | 'unsupported'
  | 'permission-denied'
  | 'device-error';

type ViewState = 'recording' | 'confirmation';

@Component({
  selector: 'app-voice-capture',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './voice-capture.component.html',
  providers: [
    LearningResourceService,
    ResourceTypeService,
    TopicService,
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
    { provide: ResourceTypeRepository, useClass: ResourceTypeHttpRepository },
    { provide: TopicRepository, useClass: TopicHttpRepository },
  ],
})
export class VoiceCaptureComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly learningResourceService = inject(LearningResourceService);
  private readonly resourceTypeService = inject(ResourceTypeService);
  private readonly topicService = inject(TopicService);

  private recognition: SpeechRecognition | null = null;

  readonly recordingState = signal<RecordingState>(
    this.isSpeechSupported() ? 'idle' : 'unsupported',
  );
  readonly transcript = signal('');
  readonly interimText = signal('');

  readonly viewState = signal<ViewState>('recording');

  readonly resourceTypes = this.resourceTypeService.resourceTypes.asReadonly();
  readonly topics = this.topicService.topics.asReadonly();
  readonly selectedTopicIds = signal<string[]>([]);
  readonly saveError = signal<string | null>(null);
  readonly saving = signal(false);

  readonly editableTranscript = signal('');
  readonly dataReady = signal(false);

  editableTitle = '';
  editableTypeId = '';
  editableUrl = '';
  editableNotes = '';

  async ngOnInit(): Promise<void> {
    await Promise.all([this.resourceTypeService.loadAll(), this.topicService.loadAll()]);
    this.dataReady.set(true);
  }

  private isSpeechSupported(): boolean {
    const win = window as WindowWithSpeech;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  private getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
    const win = window as WindowWithSpeech;
    return win.SpeechRecognition || win.webkitSpeechRecognition || null;
  }

  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      const SpeechRecognitionConstructor = this.getSpeechRecognitionConstructor();
      if (!SpeechRecognitionConstructor) {
        this.recordingState.set('unsupported');
        return;
      }

      const lang = navigator.language || 'en-US';

      this.recognition = new SpeechRecognitionConstructor();
      this.recognition.lang = lang;
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            this.transcript.update((prev) => (prev + ' ' + result[0].transcript).trim());
          } else {
            interim += result[0].transcript;
          }
        }
        this.interimText.set(interim);
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        this.recordingState.set('done');
        this.interimText.set('');
      };

      this.recognition.onend = () => {
        this.interimText.set('');
        if (this.recordingState() === 'recording') {
          this.recordingState.set('done');
        }
      };

      this.transcript.set('');
      this.interimText.set('');
      this.recordingState.set('recording');
      this.recognition.start();
    } catch (error: unknown) {
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          this.recordingState.set('permission-denied');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          this.recordingState.set('device-error');
        } else {
          this.recordingState.set('unsupported');
        }
      } else {
        this.recordingState.set('unsupported');
      }
    }
  }

  stopRecording(): void {
    if (this.recordingState() !== 'recording') return;
    if (this.recognition) {
      this.recognition.stop();
    }
    this.recordingState.set('done');
  }

  continueToConfirmation(): void {
    const mapped = parseTranscript(this.transcript());
    this.editableTitle = mapped.title;
    this.editableUrl = mapped.url ?? '';
    this.editableNotes = '';
    this.editableTranscript.set(this.transcript());

    const types = this.resourceTypes();
    if (mapped.resourceTypeCode) {
      const matched = types.find(
        (t) => t.code.toLowerCase() === mapped.resourceTypeCode!.toLowerCase(),
      );
      this.editableTypeId = matched?.id ?? types[0]?.id ?? '';
    } else {
      this.editableTypeId = types[0]?.id ?? '';
    }

    this.viewState.set('confirmation');
  }

  toggleTopic(topicId: string): void {
    const current = this.selectedTopicIds();
    if (current.includes(topicId)) {
      this.selectedTopicIds.set(current.filter((id) => id !== topicId));
    } else {
      this.selectedTopicIds.set([...current, topicId]);
    }
  }

  async saveResource(): Promise<void> {
    if (this.selectedTopicIds().length === 0) return;

    const typeId = this.editableTypeId || this.resourceTypes()[0]?.id;
    if (!typeId) {
      this.saveError.set('Resource type not available. Please try again later.');
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);

    try {
      await this.learningResourceService.addResource({
        title: this.editableTitle || 'Untitled',
        url: this.editableUrl || undefined,
        notes: this.editableNotes || undefined,
        resourceTypeId: typeId,
        topicIds: this.selectedTopicIds(),
        difficulty: 'Medium',
        energyLevel: 'Medium',
        estimatedDurationMinutes: 30,
        status: 'Pending',
      });
      this.router.navigate(['/resources']);
    } catch {
      this.saveError.set('Failed to save resource. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  restart(): void {
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
    this.transcript.set('');
    this.interimText.set('');
    this.selectedTopicIds.set([]);
    this.saveError.set(null);
    this.recordingState.set('idle');
    this.viewState.set('recording');
    this.editableTitle = '';
    this.editableUrl = '';
    this.editableNotes = '';
    this.editableTypeId = '';
    this.editableTranscript.set('');
    this.selectedTopicIds.set([]);
  }

  goBack(): void {
    this.stopRecording();
    this.router.navigate(['/add']);
  }

  ngOnDestroy(): void {
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
  }
}
