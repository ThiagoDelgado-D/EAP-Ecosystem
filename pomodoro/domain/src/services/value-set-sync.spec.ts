import { EnergyLevelType, MentalStateType } from "@learning-resource/domain";
import { describe, expect, test } from "vitest";
import { CandidateNodeEnergyLevel, CandidateNodeMentalState } from "./candidate-nodes-port.js";

describe("pomodoro candidate value sets stay in sync with learning-resource", () => {
  test("CandidateNodeEnergyLevel mirrors learning-resource's EnergyLevelType", () => {
    expect(Object.values(CandidateNodeEnergyLevel).sort()).toEqual(
      Object.values(EnergyLevelType).sort(),
    );
  });

  test("CandidateNodeMentalState mirrors learning-resource's MentalStateType", () => {
    expect(Object.values(CandidateNodeMentalState).sort()).toEqual(
      Object.values(MentalStateType).sort(),
    );
  });
});
