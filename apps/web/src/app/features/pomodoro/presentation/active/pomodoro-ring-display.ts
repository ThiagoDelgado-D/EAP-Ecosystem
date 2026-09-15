import { computed, type Signal } from '@angular/core';
import type { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import type { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import type { SegmentTarget } from '@features/pomodoro/domain/pomodoro.model';
import { describeTargetLabel, type TargetLabel } from '@features/pomodoro/presentation/start/target-description';
import { currentSegmentTarget } from './segment-display';

export interface PomodoroRingDisplay {
  ringDashOffset: Signal<number>;
  breakRingDashOffset: Signal<number>;
  currentTarget: Signal<SegmentTarget | null>;
  contextDisplay: Signal<TargetLabel | null>;
}

export function createPomodoroRingDisplay(
  store: PomodoroSessionStore,
  picker: PomodoroPickerService,
  ringCircumference: number,
): PomodoroRingDisplay {
  const ringDashOffset = computed(() => ringCircumference * store.progressFraction());
  const breakRingDashOffset = computed(() => ringCircumference * store.breakProgressFraction());
  const currentTarget = computed<SegmentTarget | null>(() => currentSegmentTarget(store.segments()));
  const contextDisplay = computed<TargetLabel | null>(() => {
    const target = currentTarget();
    if (!target) return null;
    return describeTargetLabel(target, picker.allPaths(), picker.library());
  });

  return { ringDashOffset, breakRingDashOffset, currentTarget, contextDisplay };
}
