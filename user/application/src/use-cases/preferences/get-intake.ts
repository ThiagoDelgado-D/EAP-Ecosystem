import type { IntakeAnswers, IUserRepository } from "@user/domain";
import { UserNotFoundError } from "../../errors/user-not-found.js";

export interface GetIntakeDependencies {
  userRepository: IUserRepository;
}

export interface GetIntakeRequest {
  userId: string;
}

export interface GetIntakeResponse {
  intake: IntakeAnswers | null;
}

export const getIntake = async (
  { userRepository }: GetIntakeDependencies,
  request: GetIntakeRequest,
): Promise<GetIntakeResponse | UserNotFoundError> => {
  const user = await userRepository.findById(request.userId);
  if (!user) return new UserNotFoundError();

  return { intake: user.intake };
};
