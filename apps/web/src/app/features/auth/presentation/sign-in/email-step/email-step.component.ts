import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { API_CONFIG } from '@core/config/api.config.js';

@Component({
  selector: 'app-email-step',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './email-step.component.html',
})
export class EmailStepComponent {
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly googleAuthUrl = `${API_CONFIG.baseUrl}/auth/google`;

  readonly emailSubmit = output<string>();

  readonly emailValue = signal('');

  readonly isValid = computed(() => {
    const v = this.emailValue();
    return v.includes('@') && v.includes('.');
  });

  submit(): void {
    if (!this.isValid() || this.loading()) return;
    this.emailSubmit.emit(this.emailValue().trim());
  }
}
