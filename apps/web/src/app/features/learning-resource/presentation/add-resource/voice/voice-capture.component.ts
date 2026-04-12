import { Component, inject, signal, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

type RecordingState = 'idle' | 'recording' | 'done' | 'unsupported';

@Component({
  selector: 'app-voice-capture',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './voice-capture.component.html',
})
export class VoiceCaptureComponent implements OnDestroy {
  private readonly router = inject(Router);

  private recognition: any = null;

  readonly recordingState = signal<RecordingState>(
    this.isSpeechSupported() ? 'idle' : 'unsupported',
  );
  readonly transcript = signal('');
  readonly interimText = signal('');

  private isSpeechSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  startRecording(): void {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-AR';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: any) => {
      let final = '';
      let interim = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }

      this.transcript.set(final.trim());
      this.interimText.set(interim);
    };

    this.recognition.onerror = (event: any) => {
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
  }

  stopRecording(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.recordingState.set('done');
  }

  restart(): void {
    this.stopRecording();
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
    }
  }
}
