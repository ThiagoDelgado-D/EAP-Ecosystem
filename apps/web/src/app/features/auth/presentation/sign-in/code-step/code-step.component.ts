import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-code-step',
  standalone: true,
  imports: [],
  templateUrl: './code-step.component.html',
})
export class CodeStepComponent implements OnInit, OnDestroy {
  readonly email = input.required<string>();
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);

  readonly codeSubmit = output<string>();
  readonly changeEmail = output<void>();

  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly digits = signal<string[]>(['', '', '', '', '', '']);
  readonly resendSeconds = signal(30);

  private resendTimer?: ReturnType<typeof setInterval>;

  readonly fullCode = computed(() => this.digits().join(''));
  readonly isComplete = computed(() => !this.digits().includes(''));

  ngOnInit(): void {
    this.startResendTimer();
  }

  ngOnDestroy(): void {
    clearInterval(this.resendTimer);
  }

  private startResendTimer(): void {
    this.resendSeconds.set(30);
    clearInterval(this.resendTimer);
    this.resendTimer = setInterval(() => {
      const s = this.resendSeconds();
      if (s <= 1) {
        this.resendSeconds.set(0);
        clearInterval(this.resendTimer);
      } else {
        this.resendSeconds.set(s - 1);
      }
    }, 1000);
  }

  onDigitInput(index: number, event: Event): void {
    const el = event.target as HTMLInputElement;
    const val = el.value.replace(/\D/g, '').slice(-1);
    el.value = val;
    const digits = [...this.digits()];
    digits[index] = val;
    this.digits.set(digits);
    if (val && index < 5) {
      this.codeInputs.toArray()[index + 1]?.nativeElement.focus();
    }
  }

  onKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      const digits = [...this.digits()];
      if (digits[index]) {
        digits[index] = '';
        this.digits.set(digits);
      } else if (index > 0) {
        this.codeInputs.toArray()[index - 1]?.nativeElement.focus();
      }
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
    const digits = Array(6).fill('') as string[];
    for (let i = 0; i < pasted.length; i++) digits[i] = pasted[i];
    this.digits.set(digits);
    const lastIdx = Math.min(pasted.length, 5);
    this.codeInputs.toArray()[lastIdx]?.nativeElement.focus();
  }

  submit(): void {
    if (!this.isComplete() || this.loading()) return;
    this.codeSubmit.emit(this.fullCode());
  }

  resend(): void {
    if (this.resendSeconds() > 0) return;
    this.startResendTimer();
  }
}
