import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { log } from "./logger";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
    public headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          fields: error.fields,
        },
      },
      {
        status: error.status,
        headers: error.headers,
      },
    );
  }

  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) {
      fields[issue.path.join(".") || "root"] = issue.message;
    }
    return NextResponse.json(
      {
        error: {
          code: "validation_failed",
          message: "Проверьте введённые данные",
          fields,
        },
      },
      { status: 400 },
    );
  }

  log.error("request_failed", error);
  return NextResponse.json(
    {
      error: {
        code: "internal_error",
        message: "Внутренняя ошибка",
      },
    },
    { status: 500 },
  );
}
