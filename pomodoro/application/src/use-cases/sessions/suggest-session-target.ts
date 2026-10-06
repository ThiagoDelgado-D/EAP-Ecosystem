import {
  createValidationSchema,
  InvalidDataError,
  optionalEnum,
  ValidationError,
  type CurrentUser,
} from "domain-lib";
import {
  CandidateNodeEnergyLevel,
  CandidateNodeMentalState,
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
  currentUser: CurrentUser;
}

export interface SuggestSessionTargetRequestModel {
  energy?: CandidateNodeEnergyLevel;
  mentalState?: CandidateNodeMentalState;
}

export type SuggestedCandidateResponseModel = ScoredCandidate;

const suggestSessionTargetSchema = createValidationSchema<SuggestSessionTargetRequestModel>({
  energy: optionalEnum(
    Object.values(CandidateNodeEnergyLevel) as CandidateNodeEnergyLevel[],
    "Energy",
  ),
  mentalState: optionalEnum(
    Object.values(CandidateNodeMentalState) as CandidateNodeMentalState[],
    "Mental state",
  ),
});

export const suggestSessionTarget = async (
  { sessionRepository, candidateNodesPort, currentUser }: SuggestSessionTargetDependencies,
  request: SuggestSessionTargetRequestModel,
): Promise<SuggestedCandidateResponseModel[] | InvalidDataError> => {
  const validationResult = suggestSessionTargetSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }
  const { energy, mentalState } = validationResult;

  const [candidates, lastTarget, momentum] = await Promise.all([
    candidateNodesPort.findCandidateNodes(currentUser.id),
    getLastSessionTarget({ sessionRepository, currentUser }),
    getPathMomentum({ sessionRepository, currentUser }, {}),
  ]);
  if (momentum instanceof InvalidDataError) return momentum;

  const context: ScoringContext = {
    energy,
    mentalState,
    lastSessionNodeId: lastTarget?.learningPathNodeId,
    momentumByPathId: new Map(
      momentum.map((entry) => [entry.learningPathId, entry.totalSeconds]),
    ),
    maxMomentumSeconds: Math.max(1, ...momentum.map((entry) => entry.totalSeconds)),
  };

  return scoreCandidates(candidates, context);
};
