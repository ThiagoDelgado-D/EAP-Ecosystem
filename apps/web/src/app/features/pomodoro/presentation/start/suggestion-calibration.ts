import type {
  EnergyLevel,
  MentalStateType,
} from '@features/learning-resource/domain/learning-resource.model';
import type {
  CandidateEnergyLevel,
  SuggestionCalibration,
} from '@features/pomodoro/domain/pomodoro.model';

const TO_CANDIDATE_ENERGY_LEVEL: Record<EnergyLevel, CandidateEnergyLevel> = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
};

export function toSuggestionCalibration(
  energy: EnergyLevel,
  mentalState: MentalStateType | null,
): SuggestionCalibration {
  const calibration: SuggestionCalibration = { energy: TO_CANDIDATE_ENERGY_LEVEL[energy] };
  if (!mentalState) return calibration;
  calibration.mentalState = mentalState;
  return calibration;
}
