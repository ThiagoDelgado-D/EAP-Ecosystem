import { composeSetup, type ComposedSetup, type IntakeAnswers } from "@user/domain";

export interface PreviewIntakeSetupRequestModel {
  intake: IntakeAnswers;
}

export type PreviewIntakeSetupResponseModel = ComposedSetup;

export const previewIntakeSetup = (
  request: PreviewIntakeSetupRequestModel,
): PreviewIntakeSetupResponseModel => composeSetup(request.intake);
