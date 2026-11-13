import { expect, it } from "vitest";
import {
  registrationPasswordError,
  passwordRequirements,
} from "@/modules/auth/registration-password";
import { safeAuthDestination } from "@/modules/auth/destination";

it("requires every password rule and an exact confirmation without bcrypt truncation", () => {
  for (const password of [
    "Sh0rt!",
    "password1!",
    "PASSWORD1!",
    "Password!!",
    "Password12",
    "Пароль!1".repeat(8),
  ])
    expect(registrationPasswordError(password, password)).not.toBe("");
  expect(registrationPasswordError("Password1!", "Different1!")).not.toBe("");
  expect(registrationPasswordError("Пароль!12", "Пароль!12")).toBe("");
  expect(registrationPasswordError("Password1!", "Password1!")).toBe("");
});

it("keeps authentication destinations on the site", () => {
  for (const path of [
    "//foreign.example",
    "/\\foreign.example",
    "/\t/foreign.example",
    "https://foreign.example",
  ])
    expect(safeAuthDestination(path)).toBe("/account");
  expect(safeAuthDestination("/orders/123?from=registration")).toBe(
    "/orders/123?from=registration",
  );
});

it("reports individual password requirements using the same validation as the server", () => {
  expect(
    passwordRequirements("Abc")
      .filter((r) => r.met)
      .map((r) => r.key),
  ).toEqual(["upper", "lower"]);
  expect(passwordRequirements("Password1!").every((r) => r.met)).toBe(true);
  expect(passwordRequirements("Пароль!1".repeat(8)).find((r) => r.key === "length")!.met).toBe(
    false,
  );
});
