import type {
  ISignInChallengeRepository,
  IUserRepository,
  SignInChallenge,
} from "@user/domain";
import { SIGN_IN_REQUEST_BACKOFF } from "@user/domain";
import type { CryptoService, EmailService, TooManyRequestsError } from "domain-lib";
import { assertRateLimit, createValidationSchema, emailField } from "domain-lib";

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
  request: RequestSignInRequestModel,
): Promise<RequestSignInResponseModel | TooManyRequestsError> => {
  const validation = await requestSignInSchema(request);
  if (validation instanceof Error) return;

  const { email } = validation;

  const recentChallenges = await signInChallengeRepository.findCreatedSinceByEmail(
    email,
    new Date(Date.now() - SIGN_IN_REQUEST_BACKOFF.WINDOW_MS),
  );
  const latestChallenge = recentChallenges[0];
  if (latestChallenge) {
    const rateLimitError = assertRateLimit({
      attempts: recentChallenges.length,
      lastAttemptAt: latestChallenge.createdAt,
      baseDelayMs: SIGN_IN_REQUEST_BACKOFF.BASE_DELAY_MS,
      maxDelayMs: SIGN_IN_REQUEST_BACKOFF.MAX_DELAY_MS,
    });
    if (rateLimitError) return rateLimitError;
  }

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
