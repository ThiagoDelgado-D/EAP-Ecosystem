import { EnergyLevelType } from "@learning-resource/domain";
import { describe, expect, test } from "vitest";
import { CandidateNodeEnergyLevel } from "./candidate-nodes-port.js";

describe("pomodoro candidate value sets stay in sync with learning-resource", () => {
  test("CandidateNodeEnergyLevel mirrors learning-resource's EnergyLevelType", () => {
    expect(Object.values(CandidateNodeEnergyLevel).sort()).toEqual(
      Object.values(EnergyLevelType).sort(),
    );
  });
});
