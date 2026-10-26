import {
  WEEKLY_GOAL_MINUTES_RANGE,
  type Capabilities,
  type EntitlementsProvider,
  type IntakeAnswers,
  type IUserRepository,
  type ModuleKey,
} from "@user/domain";
import {
  createValidationSchema,
  InvalidDataError,
  numberField,
  ValidationError,
} from "domain-lib";
import { UserNotFoundError } from "../../errors/user-not-found.js";
import { resolveLearnerCapabilities } from "../../utils/resolve-learner-capabilities.js";

export interface ApplyIntakeDependencies {
  userRepository: IUserRepository;
  entitlementsProvider: EntitlementsProvider;
}

export interface ApplyIntakeRequest {
  userId: string;
  intake: IntakeAnswers;
  enabledModules: ModuleKey[];
  weeklyGoalMinutes: number;
}

export interface ApplyIntakeResponse {
  intake: IntakeAnswers;
  enabledModules: ModuleKey[];
  weeklyGoalMinutes: number;
  capabilities: Capabilities;
}

const confirmedSetupSchema = createValidationSchema({
  weeklyGoalMinutes: numberField("Weekly goal minutes", {
    required: true,
    integer: true,
    min: WEEKLY_GOAL_MINUTES_RANGE.MIN,
    max: WEEKLY_GOAL_MINUTES_RANGE.MAX,
  }),
});

export const applyIntake = async (
  { userRepository, entitlementsProvider }: ApplyIntakeDependencies,
  request: ApplyIntakeRequest,
): Promise<ApplyIntakeResponse | UserNotFoundError | InvalidDataError> => {
  const validationResult = confirmedSetupSchema({
    weeklyGoalMinutes: request.weeklyGoalMinutes,
  });
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.context.fields);
  }

  const user = await userRepository.findById(request.userId);
  if (!user) return new UserNotFoundError();

  const updated = {
    ...user,
    intake: request.intake,
    enabledModules: request.enabledModules,
    appearance: {
      ...user.appearance,
      weeklyGoalMinutes: request.weeklyGoalMinutes,
    },
    updatedAt: new Date(),
  };

  await userRepository.update(updated);

  return {
    intake: updated.intake,
    enabledModules: updated.enabledModules,
    weeklyGoalMinutes: updated.appearance.weeklyGoalMinutes,
    capabilities: await resolveLearnerCapabilities(entitlementsProvider, updated),
  };
};
