import { Component, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-name-step',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './name-step.component.html',
})
export class NameStepComponent {
  readonly nameSubmit = output<string>();

  readonly nameValue = signal('');
  readonly isValid = computed(() => this.nameValue().trim().length > 0);

  submit(): void {
    if (!this.isValid()) return;
    this.nameSubmit.emit(this.nameValue().trim());
  }
}
