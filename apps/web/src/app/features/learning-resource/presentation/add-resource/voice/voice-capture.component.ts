import { Component, inject, signal, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  SpeechRecognition,
  SpeechRecognitionConstructor,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionEvent,
  WindowWithSpeech,
} from './voice-capture.types.js';

type RecordingState =
  | 'idle'
  | 'recording'
  | 'done'
  | 'unsupported'
  | 'permission-denied'
  | 'device-error';

@Component({
  selector: 'app-voice-capture',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './voice-capture.component.html',
})
export class VoiceCaptureComponent implements OnDestroy {
  private readonly router = inject(Router);

  private recognition: SpeechRecognition | null = null;

  readonly recordingState = signal<RecordingState>(
    this.isSpeechSupported() ? 'idle' : 'unsupported',
  );
  readonly transcript = signal('');
  readonly interimText = signal('');

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

  restart(): void {
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
    this.transcript.set('');
    this.interimText.set('');
    this.recordingState.set('idle');
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
