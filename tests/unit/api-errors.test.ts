import { describe, expect, it } from "vitest";
import { ZodError, z } from "zod";
import { ApiError, errorResponse } from "@/server/api-error";

describe("errorResponse and ApiError", () => {
  it("formats ApiError with code, message and status", async () => {
    const error = new ApiError(400, "bad_input", "Неверный ввод", { field: "invalid" });
    const res = errorResponse(error);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({
      error: {
        code: "bad_input",
        message: "Неверный ввод",
        fields: { field: "invalid" },
      },
    });
  });

  it("includes custom headers like Retry-After on 429", async () => {
    const error = new ApiError(429, "rate_limited", "Лимит исчерпан", undefined, {
      "Retry-After": "30",
    });
    const res = errorResponse(error);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    const body = await res.json();
    expect(body.error.code).toBe("rate_limited");
    // Headers should not leak into the error body
    expect(body.error).not.toHaveProperty("headers");
  });

  it("formats ZodError as 400 validation_failed", async () => {
    const schema = z.object({ email: z.string().email("email_invalid") });
    let zodErr: ZodError | null = null;
    try {
      schema.parse({ email: "invalid" });
    } catch (err) {
      if (err instanceof ZodError) zodErr = err;
    }
    expect(zodErr).not.toBeNull();
    const res = errorResponse(zodErr);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("validation_failed");
    expect(body.error.fields.email).toBe("email_invalid");
  });

  it("masks internal details on 500 without crashing", async () => {
    const res = errorResponse(new Error("secret db password at localhost:5432"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({
      error: {
        code: "internal_error",
        message: "Внутренняя ошибка",
      },
    });
  });
});

