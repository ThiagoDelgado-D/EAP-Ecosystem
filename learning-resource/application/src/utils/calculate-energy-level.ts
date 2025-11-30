import { DifficultyType, EnergyLevelType } from "@learning-resource/domain";

export function calculateEnergyLevel(
  difficulty: DifficultyType,
  durationMinutes: number
): EnergyLevelType {
  if (difficulty === DifficultyType.HIGH || durationMinutes > 120) {
    return EnergyLevelType.HIGH;
  }
  if (difficulty === DifficultyType.MEDIUM || durationMinutes > 60) {
    return EnergyLevelType.MEDIUM;
  }
  return EnergyLevelType.LOW;
}
