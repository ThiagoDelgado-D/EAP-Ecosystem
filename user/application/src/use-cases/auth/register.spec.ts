import { describe, test, expect, beforeEach } from "vitest";
import {
  mockUserRepository,
  type MockedUserRepository,
} from "../../mocks/mock-user-repository.js";
import { mockCryptoService } from "domain-lib";
import type { RegisterUserRequestModel } from "user/application/dist/use-cases/index.js";
import { MockedEmailService } from "../../mocks/mock-email-service.js";
import { registerUser } from "./register.js";
import { EmailAlreadyExistsError } from "../../errors/email-already-exists.js";
import type { User } from "@user/domain";

describe("Register user use case", () => {
  let userRepository: MockedUserRepository;
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let emailService: MockedEmailService;

  const defaultRequest: RegisterUserRequestModel = {
    email: "test@example.com",
    password: "SecurePass123",
    firstName: "John",
    lastName: "Doe",
  };

  beforeEach(() => {
    userRepository = mockUserRepository([]);
    cryptoService = mockCryptoService();
    emailService = new MockedEmailService();
  });

  test("Should return EmailAlreadyExistsError with validation context request is invalid", async () => {
    const invalidRequest = {
      ...defaultRequest,
      email: "not-an-email",
    } as unknown as RegisterUserRequestModel;

    const result = await registerUser(
      { userRepository, cryptoService, emailService },
      invalidRequest,
    );

    expect(result).toBeInstanceOf(EmailAlreadyExistsError);
    expect((result as EmailAlreadyExistsError).context).toEqual({
      validation: "Invalid data",
    });
    expect(userRepository.users).toHaveLength(0);
    expect(emailService.sentEmails).toHaveLength(0);
  });

  test("Should return EmailAlreadyExistsError when email already exists", async () => {
    const existingUser: User = {
      id: await cryptoService.generateUUID(),
      email: defaultRequest.email,
      hashedPassword: "hashed",
      firstName: "Existing",
      lastName: "User",
      emailVerified: false,
      enabled: true,
      emailValidationToken: "token",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    userRepository = mockUserRepository([existingUser]);

    const result = await registerUser(
      { userRepository, cryptoService, emailService },
      defaultRequest,
    );

    expect(result).toBeInstanceOf(EmailAlreadyExistsError);
    expect((result as EmailAlreadyExistsError).context).toBeUndefined();
    expect(userRepository.users).toHaveLength(1);
    expect(emailService.sentEmails).toHaveLength(0);
  });

  test("Should register user successfully, save user, and send verification email", async () => {
    const result = await registerUser(
      { userRepository, cryptoService, emailService },
      defaultRequest,
    );

    expect(result).toBeUndefined();

    expect(userRepository.users).toHaveLength(1);
    const savedUser = userRepository.users[0];

    expect(savedUser.email).toBe(defaultRequest.email);
    expect(savedUser.firstName).toBe(defaultRequest.firstName);
    expect(savedUser.lastName).toBe(defaultRequest.lastName);
    expect(savedUser.emailVerified).toBe(false);
    expect(savedUser.enabled).toBe(true);
    expect(savedUser.createdAt).toBeInstanceOf(Date);
    expect(savedUser.updatedAt).toBeInstanceOf(Date);

    const expectedHash = "[HASHED]" + defaultRequest.password;
    expect(savedUser.hashedPassword).toBe(expectedHash);

    const token = savedUser.emailValidationToken;
    if (!token) {
      throw new Error("Email validation token should be defined");
    }
    expect(token.length).toBe(10);

    expect(emailService.sentEmails).toHaveLength(1);
    const emailCall = emailService.sentEmails[0];
    expect(emailCall).toHaveProperty("template", "EMAIL_VERIFICATION");
    expect(emailCall).toHaveProperty("to", [defaultRequest.email]);
    expect(emailCall).toHaveProperty("data.email", defaultRequest.email);
    expect(emailCall).toHaveProperty("data.validationToken", token);
  });

  test("Should throw when emailService.sendTemplateEmail fails", async () => {
    emailService.sendTemplateEmail = async () => {
      throw new Error("Email service error");
    };

    await expect(
      registerUser(
        { userRepository, cryptoService, emailService },
        defaultRequest,
      ),
    ).rejects.toThrow("Email service error");

    expect(userRepository.users).toHaveLength(1);
  });

  test("Should return EmailAlreadyExistsError when required fields are missing", async () => {
    const incompleteRequest = {
      email: "test@example.com",
    } as unknown as RegisterUserRequestModel;

    const result = await registerUser(
      { userRepository, cryptoService, emailService },
      incompleteRequest,
    );

    expect(result).toBeInstanceOf(EmailAlreadyExistsError);
    expect((result as EmailAlreadyExistsError).context).toEqual({
      validation: "Invalid data",
    });
  });
});
