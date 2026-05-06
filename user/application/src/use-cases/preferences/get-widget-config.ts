import type { IUserRepository, WidgetKey } from "@user/domain";
import { UserNotFoundError } from "../../errors/user-not-found.js";

export interface GetWidgetConfigDependencies {
  userRepository: IUserRepository;
}

export interface GetWidgetConfigRequest {
  userId: string;
}

export interface GetWidgetConfigResponse {
  widgetConfig: WidgetKey[];
}

export const getWidgetConfig = async (
  { userRepository }: GetWidgetConfigDependencies,
  request: GetWidgetConfigRequest,
): Promise<GetWidgetConfigResponse | UserNotFoundError> => {
  const user = await userRepository.findById(request.userId);
  if (!user) return new UserNotFoundError();

  return { widgetConfig: user.widgetConfig };
};
