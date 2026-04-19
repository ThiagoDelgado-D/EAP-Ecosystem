import type {
  ISignInChallengeRepository,
  IUserRepository,
  SignInChallenge,
} from "@user/domain";
import type { CryptoService, EmailService } from "domain-lib";
import { createValidationSchema, emailField } from "domain-lib";

export interface RequestSignInDependencies {
  signInChallengeRepository: ISignInChallengeRepository;
  userRepository: IUserRepository;
  cryptoService: CryptoService;
  emailService: EmailService;
}

export interface RequestSignInRequestModel {
  email: string;
}

export type RequestSignInResponseModel = void;

const requestSignInSchema = createValidationSchema<RequestSignInRequestModel>({
  email: emailField("Email", { required: true }),
});

export const requestSignIn = async (
  {
    signInChallengeRepository,
    cryptoService,
    emailService,
  }: RequestSignInDependencies,
  input: RequestSignInRequestModel,
): Promise<RequestSignInResponseModel> => {
  const validation = await requestSignInSchema(input);
  if (validation instanceof Error) return;

  const { email } = validation;

  const code = await cryptoService.generateNumericCode(6);
  const codeHash = await cryptoService.hashPassword(code);

  await signInChallengeRepository.invalidateAllByEmail(email);

  const challenge: SignInChallenge = {
    id: await cryptoService.generateUUID(),
    email,
    codeHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    attempts: 0,
    consumed: false,
    createdAt: new Date(),
  };

  await signInChallengeRepository.save(challenge);

  await emailService.sendTemplateEmail({
    template: "MAGIC_LINK_CODE",
    data: { code },
    to: [email],
  });
};
