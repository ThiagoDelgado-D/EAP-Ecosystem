import type { IUserRepository, WidgetKey } from "@user/domain";
import { UserNotFoundError } from "../../errors/user-not-found.js";

export interface UpdateWidgetConfigDependencies {
  userRepository: IUserRepository;
}

export interface UpdateWidgetConfigRequest {
  userId: string;
  widgetConfig: WidgetKey[];
}

export interface UpdateWidgetConfigResponse {
  widgetConfig: WidgetKey[];
}

export const updateWidgetConfig = async (
  { userRepository }: UpdateWidgetConfigDependencies,
  request: UpdateWidgetConfigRequest,
): Promise<UpdateWidgetConfigResponse | UserNotFoundError> => {
  const user = await userRepository.findById(request.userId);
  if (!user) return new UserNotFoundError();

  const updated = {
    ...user,
    widgetConfig: request.widgetConfig,
    updatedAt: new Date(),
  };

  await userRepository.update(updated);

  return { widgetConfig: updated.widgetConfig };
};
