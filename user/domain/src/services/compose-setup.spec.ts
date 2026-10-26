import { describe, expect, test } from "vitest";
import { IntakeGoal, StudyStyle } from "../entities/intake.js";
import { ModuleKey, OPTIONAL_MODULES } from "../entities/module.js";
import { WEEKLY_GOAL_MINUTES_RANGE } from "../entities/user.js";
import {
  GOAL_MODULES,
  STUDY_STYLE_MODULES,
  STUDY_STYLE_WEEKLY_GOAL_MINUTES,
  WEEKLY_GOAL_SETTING,
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

  test("Should set the weekly goal from the study style within the allowed range", () => {
    for (const studyStyle of EVERY_STUDY_STYLE) {
      const setup = composeSetup({ goals: [IntakeGoal.MASTER_TOPIC], studyStyle });

      expect(setup.weeklyGoalMinutes).toBe(STUDY_STYLE_WEEKLY_GOAL_MINUTES[studyStyle]);
      expect(setup.weeklyGoalMinutes).toBeGreaterThanOrEqual(WEEKLY_GOAL_MINUTES_RANGE.MIN);
      expect(setup.weeklyGoalMinutes).toBeLessThanOrEqual(WEEKLY_GOAL_MINUTES_RANGE.MAX);
    }
  });

  test("Should give every enabled module a reason naming the answers that turned it on", () => {
    const interviewGoal = IntakeGoal.PREPARE_INTERVIEW;
    const topicGoal = IntakeGoal.MASTER_TOPIC;
    const studyStyle = StudyStyle.LONG_SESSIONS;

    const setup = composeSetup({ goals: [interviewGoal, topicGoal], studyStyle });

    for (const module of setup.enabledModules) {
      const reason = setup.reasons.find(({ setting }) => setting === module);
      const expectedAnswers = [
        ...[interviewGoal, topicGoal].filter((goal) => GOAL_MODULES[goal].includes(module)),
        ...(STUDY_STYLE_MODULES[studyStyle].includes(module) ? [studyStyle] : []),
      ];

      expect(reason?.answers).toEqual(expectedAnswers);
    }
  });

  test("Should give the weekly goal a reason naming the study style", () => {
    const studyStyle = StudyStyle.SHORT_BLOCKS;

    const setup = composeSetup({ goals: [IntakeGoal.BUILD_HABIT], studyStyle });

    const reason = setup.reasons.find(({ setting }) => setting === WEEKLY_GOAL_SETTING);
    expect(reason?.answers).toEqual([studyStyle]);
  });

  test("Should not give a reason for a module it left off", () => {
    const setup = composeSetup({
      goals: [IntakeGoal.ORGANIZE_BACKLOG],
      studyStyle: StudyStyle.DAY_BY_DAY,
    });

    const reasonedModules = setup.reasons
      .map(({ setting }) => setting)
      .filter((setting) => setting !== WEEKLY_GOAL_SETTING);
    expect(reasonedModules).toEqual(setup.enabledModules);
  });
});
