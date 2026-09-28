import { EnergyLevelType, MentalStateType } from "@learning-resource/domain";
import { describe, expect, test } from "vitest";
import { EnergyLevel, MentalState } from "./recommendation-context.js";

describe("recommendation value sets stay in sync with learning-resource", () => {
  test("EnergyLevel mirrors learning-resource's EnergyLevelType", () => {
    expect(Object.values(EnergyLevel).sort()).toEqual(
      Object.values(EnergyLevelType).sort(),
    );
  });

  test("MentalState mirrors learning-resource's MentalStateType", () => {
    expect(Object.values(MentalState).sort()).toEqual(
      Object.values(MentalStateType).sort(),
    );
  });
});
