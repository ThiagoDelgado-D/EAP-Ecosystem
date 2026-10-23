import { describe, test, expect } from "vitest";
import { CryptoServiceImpl } from "./crypto-service-impl.js";

describe("CryptoServiceImpl.hmacToken", () => {
  const cryptoService = new CryptoServiceImpl();

  test("Should derive the same value from the same token and key", async () => {
    const parentToken = await cryptoService.generateRandomToken();
    const serverKey = await cryptoService.generateRandomToken();

    const firstDerivation = await cryptoService.hmacToken(parentToken, serverKey);
    const secondDerivation = await cryptoService.hmacToken(parentToken, serverKey);

    expect(secondDerivation).toBe(firstDerivation);
  });

  test("Should derive a different value under a different key", async () => {
    const parentToken = await cryptoService.generateRandomToken();
    const serverKey = await cryptoService.generateRandomToken();
    const otherServerKey = await cryptoService.generateRandomToken();

    const derivedWithServerKey = await cryptoService.hmacToken(parentToken, serverKey);
    const derivedWithOtherKey = await cryptoService.hmacToken(parentToken, otherServerKey);

    expect(derivedWithOtherKey).not.toBe(derivedWithServerKey);
  });

  test("Should never return the token itself", async () => {
    const parentToken = await cryptoService.generateRandomToken();
    const serverKey = await cryptoService.generateRandomToken();

    const derivedToken = await cryptoService.hmacToken(parentToken, serverKey);

    expect(derivedToken).not.toBe(parentToken);
  });
});
