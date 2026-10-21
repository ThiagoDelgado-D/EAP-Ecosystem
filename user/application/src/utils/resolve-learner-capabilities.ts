import {
  CAPABILITY_CATALOG,
  resolveCapabilities,
  type Capabilities,
  type EntitlementsProvider,
  type User,
} from "@user/domain";

export const resolveLearnerCapabilities = async (
  entitlementsProvider: EntitlementsProvider,
  learner: Pick<User, "id" | "enabledModules">,
): Promise<Capabilities> => {
  const granted = await entitlementsProvider.grantedTo(learner.id);

  return resolveCapabilities(CAPABILITY_CATALOG, granted, {
    enabledModules: learner.enabledModules,
    joinedBetaChannel: false,
  });
};
