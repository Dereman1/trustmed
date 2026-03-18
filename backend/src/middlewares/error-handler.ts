import type { NextFunction, Request, Response } from "express";
import { AppError } from "../core/errors/app-error.js";
import { env } from "../config/env.js";
import { sendError } from "../core/http/response.js";

function isJsonParseError(error: unknown): boolean {
  if (!(error instanceof SyntaxError)) {
    return false;
  }

  const maybeError = error as SyntaxError & { status?: number; type?: string };

  return (
    maybeError.status === 400 ||
    maybeError.type === "entity.parse.failed" ||
    /JSON/i.test(maybeError.message)
  );
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    return sendError(res, error.statusCode, error.message, error.details);
  }

  if (isJsonParseError(error)) {
    return sendError(res, 400, "Invalid JSON body", {
      hint: "Ensure request body is valid JSON and all string values are wrapped in double quotes",
    });
  }

  const defaultMessage = "Internal server error";

  if (env.nodeEnv !== "test") {
    console.error("Unhandled error:", error);
  }

  return sendError(res, 500, defaultMessage);
}
