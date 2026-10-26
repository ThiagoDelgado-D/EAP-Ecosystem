import { describe, expect, test } from "vitest";
import { IntakeGoal, StudyStyle } from "../entities/intake.js";
import { ModuleKey, OPTIONAL_MODULES } from "../entities/module.js";
import {
  GOAL_MODULES,
  STUDY_STYLE_MODULES,
  composeSetup,
} from "./compose-setup.js";

const EVERY_GOAL = Object.values(IntakeGoal);
const EVERY_STUDY_STYLE = Object.values(StudyStyle);

describe("composeSetup", () => {
  test("Should only enable optional modules from the catalog", () => {
    for (const studyStyle of EVERY_STUDY_STYLE) {
      const setup = composeSetup({ goals: EVERY_GOAL, studyStyle });

      for (const module of setup.enabledModules) {
        expect(OPTIONAL_MODULES).toContain(module);
      }
    }
  });

  test("Should enable the modules of every chosen goal and of the study style", () => {
    const examGoal = IntakeGoal.PASS_EXAM;
    const habitGoal = IntakeGoal.BUILD_HABIT;
    const studyStyle = StudyStyle.STRUCTURED_SCHEDULE;

    const setup = composeSetup({ goals: [examGoal, habitGoal], studyStyle });

    const expected = new Set([
      ...GOAL_MODULES[examGoal],
      ...GOAL_MODULES[habitGoal],
      ...STUDY_STYLE_MODULES[studyStyle],
    ]);
    expect(new Set(setup.enabledModules)).toEqual(expected);
  });

  test("Should leave learning paths off for a learner who only wants to explore day by day", () => {
    const setup = composeSetup({
      goals: [IntakeGoal.EXPLORE],
      studyStyle: StudyStyle.DAY_BY_DAY,
    });

    expect(setup.enabledModules).not.toContain(ModuleKey.LEARNING_PATHS);
    expect(setup.enabledModules).not.toContain(ModuleKey.POMODORO);
  });

  test("Should list enabled modules in catalog order without duplicates", () => {
    const setup = composeSetup({ goals: EVERY_GOAL, studyStyle: StudyStyle.SHORT_BLOCKS });

    const inCatalogOrder = OPTIONAL_MODULES.filter((module) =>
      setup.enabledModules.includes(module),
    );
    expect(setup.enabledModules).toEqual(inCatalogOrder);
  });

});
