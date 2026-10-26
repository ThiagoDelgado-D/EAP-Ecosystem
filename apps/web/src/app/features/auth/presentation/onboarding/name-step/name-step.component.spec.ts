import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { NameStepComponent } from './name-step.component';

const SIGNED_IN_NAME = 'Ada';
const TYPED_NAME = 'Grace';
const LEARNER_EMAIL = 'ada@cauce.study';

describe('NameStepComponent', () => {
  let fixture: ComponentFixture<NameStepComponent>;
  let component: NameStepComponent;

  beforeEach(() => {
    fixture = TestBed.createComponent(NameStepComponent);
    component = fixture.componentInstance;
  });

  test('starts from the name the learner signed in with', () => {
    fixture.componentRef.setInput('initialName', SIGNED_IN_NAME);
    fixture.detectChanges();

    expect(component.nameValue()).toBe(SIGNED_IN_NAME);
  });

  test('sends the typed name without surrounding spaces', () => {
    const nameSubmit = vi.fn();
    component.nameSubmit.subscribe(nameSubmit);

    component.nameValue.set(`  ${TYPED_NAME}  `);
    component.submit();

    expect(nameSubmit).toHaveBeenCalledWith(TYPED_NAME);
  });

  test("doesn't continue with a blank name", () => {
    const nameSubmit = vi.fn();
    component.nameSubmit.subscribe(nameSubmit);

    component.nameValue.set('   ');
    component.submit();

    expect(nameSubmit).not.toHaveBeenCalled();
  });

  test('shows the email the learner signed in with', () => {
    fixture.componentRef.setInput('email', LEARNER_EMAIL);
    fixture.detectChanges();

    const emailInput: HTMLInputElement = fixture.nativeElement.querySelector('#email-input');
    expect(emailInput.value).toBe(LEARNER_EMAIL);
    expect(emailInput.readOnly).toBe(true);
  });
});
