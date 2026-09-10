import {
  createValidationSchema,
  InvalidDataError,
  optionalEnum,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import {
  CandidateNodeEnergyLevel,
  type CandidateNodesPort,
  type ISessionRepository,
} from "@pomodoro/domain";
import { getLastSessionTarget } from "./get-last-session-target.js";
import { getPathMomentum } from "./get-path-momentum.js";
import {
  scoreCandidates,
  type ScoredCandidate,
  type ScoringContext,
} from "./session-target-scorer.js";

export interface SuggestSessionTargetDependencies {
  sessionRepository: ISessionRepository;
  candidateNodesPort: CandidateNodesPort;
}

export interface SuggestSessionTargetRequestModel {
  userId: UUID;
  energy?: CandidateNodeEnergyLevel;
}

export type SuggestedCandidateResponseModel = ScoredCandidate;

const suggestSessionTargetSchema = createValidationSchema<
  Pick<SuggestSessionTargetRequestModel, "userId" | "energy">
>({
  userId: uuidField("UserId", { required: true }),
  energy: optionalEnum(
    Object.values(CandidateNodeEnergyLevel) as CandidateNodeEnergyLevel[],
    "Energy",
  ),
});

export const suggestSessionTarget = async (
  { sessionRepository, candidateNodesPort }: SuggestSessionTargetDependencies,
  request: SuggestSessionTargetRequestModel,
): Promise<SuggestedCandidateResponseModel[] | InvalidDataError> => {
  const validationResult = suggestSessionTargetSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }
  const { userId, energy } = validationResult;

  const [candidates, lastTarget, momentum] = await Promise.all([
    candidateNodesPort.findCandidateNodes(userId),
    getLastSessionTarget({ sessionRepository }, { userId }),
    getPathMomentum({ sessionRepository }, { userId }),
  ]);
  if (lastTarget instanceof InvalidDataError) return lastTarget;
  if (momentum instanceof InvalidDataError) return momentum;

  const context: ScoringContext = {
    energy,
    lastSessionNodeId: lastTarget?.learningPathNodeId,
    momentumByPathId: new Map(
      momentum.map((entry) => [entry.learningPathId, entry.totalSeconds]),
    ),
    maxMomentumSeconds: Math.max(1, ...momentum.map((entry) => entry.totalSeconds)),
  };

  return scoreCandidates(candidates, context);
};
