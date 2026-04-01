import type { IUserRepository, User } from "@user/domain";
import type { CryptoService, EmailService } from "domain-lib";
import { createValidationSchema, emailField, stringField } from "domain-lib";
import { EmailAlreadyExistsError } from "../../errors/email-already-exists.js";

export interface RegisterUserDependencies {
  userRepository: IUserRepository;
  cryptoService: CryptoService;
  emailService: EmailService;
}

export interface RegisterUserRequestModel {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const registerUserSchema =
  createValidationSchema<RegisterUserRequestModel>({
    email: emailField("Email", { required: true }),
    password: stringField("Password", { required: true, minLength: 8 }),
    firstName: stringField("FirstName", { required: true }),
    lastName: stringField("LastName", { required: true }),
  });

export const registerUser = async (
  { userRepository, cryptoService, emailService }: RegisterUserDependencies,
  request: RegisterUserRequestModel,
): Promise<void | EmailAlreadyExistsError> => {
  const validationResult = await registerUserSchema(request);

  if (validationResult instanceof Error) {
    return new EmailAlreadyExistsError({ validation: "Invalid data" });
  }

  const validatedData = validationResult;

  const existingUser = await userRepository.findByEmail(validatedData.email);
  if (existingUser) {
    return new EmailAlreadyExistsError();
  }

  const hashedPassword = await cryptoService.hashPassword(
    validatedData.password,
  );

  const emailValidationToken = await cryptoService.generateRandomToken();

  const user: User = {
    id: await cryptoService.generateUUID(),
    email: validatedData.email,
    hashedPassword,
    firstName: validatedData.firstName,
    lastName: validatedData.lastName,
    emailVerified: false,
    enabled: true,
    emailValidationToken,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await userRepository.save(user);

  const verificationLink = `${process.env.WEB_HOST}/verify-email?token=${emailValidationToken}&email=${user.email}`;

  await emailService.sendTemplateEmail({
    template: "EMAIL_VERIFICATION",
    data: {
      verificationLink,
    },
    to: [user.email],
  });
};
