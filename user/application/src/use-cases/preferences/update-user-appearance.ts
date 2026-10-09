import {
  WEEKLY_GOAL_MINUTES_RANGE,
  type IUserRepository,
  type UserAppearancePreferences,
} from "@user/domain";
import {
  createValidationSchema,
  InvalidDataError,
  optionalNumber,
  ValidationError,
} from "domain-lib";
import { UserNotFoundError } from "../../errors/user-not-found.js";

export interface UpdateUserAppearanceDependencies {
  userRepository: IUserRepository;
}

export interface UpdateUserAppearanceRequest {
  userId: string;
  appearance: Partial<UserAppearancePreferences>;
}

export interface UpdateUserAppearanceResponse {
  appearance: UserAppearancePreferences;
}

const appearanceRulesSchema = createValidationSchema({
  weeklyGoalMinutes: optionalNumber("Weekly goal minutes", {
    integer: true,
    min: WEEKLY_GOAL_MINUTES_RANGE.MIN,
    max: WEEKLY_GOAL_MINUTES_RANGE.MAX,
  }),
});

export const updateUserAppearance = async (
  { userRepository }: UpdateUserAppearanceDependencies,
  request: UpdateUserAppearanceRequest,
): Promise<UpdateUserAppearanceResponse | UserNotFoundError | InvalidDataError> => {
  const validationResult = appearanceRulesSchema({
    weeklyGoalMinutes: request.appearance.weeklyGoalMinutes,
  });
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const user = await userRepository.findById(request.userId);
  if (!user) return new UserNotFoundError();

  const appearance: UserAppearancePreferences = {
    language: request.appearance.language ?? user.appearance.language,
    timezone: request.appearance.timezone ?? user.appearance.timezone,
    startOfWeek: request.appearance.startOfWeek ?? user.appearance.startOfWeek,
    reduceMotion: request.appearance.reduceMotion ?? user.appearance.reduceMotion,
    compactMode: request.appearance.compactMode ?? user.appearance.compactMode,
    weeklyGoalMinutes:
      request.appearance.weeklyGoalMinutes ?? user.appearance.weeklyGoalMinutes,
  };

  const updated = {
    ...user,
    appearance,
    updatedAt: new Date(),
  };

  await userRepository.update(updated);

  return { appearance: updated.appearance };
};
