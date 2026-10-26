import { describe, expect, test } from "vitest";
import { composeSetup } from "@user/domain";
import { generateIntakeAnswers } from "../../mocks/factories.js";
import { previewIntakeSetup } from "./preview-intake-setup.js";

describe("previewIntakeSetup", () => {
  test("Should return the setup composed from the learner's answers", () => {
    const intake = generateIntakeAnswers();

    const preview = previewIntakeSetup({ intake });

    expect(preview).toEqual(composeSetup(intake));
  });
});
