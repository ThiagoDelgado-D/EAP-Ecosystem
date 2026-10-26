import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MODULE_CARDS } from '../module-cards';

@Component({
  selector: 'app-name-step',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './name-step.component.html',
})
export class NameStepComponent {
  readonly initialName = input('');
  readonly email = input('');
  readonly nameSubmit = output<string>();

  readonly modules = MODULE_CARDS;
  readonly nameValue = linkedSignal(() => this.initialName());
  readonly isValid = computed(() => this.nameValue().trim().length > 0);

  submit(): void {
    if (!this.isValid()) return;
    this.nameSubmit.emit(this.nameValue().trim());
  }
}
