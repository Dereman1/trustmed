import type { NextFunction, Request, Response } from "express";
import { sendError } from "../core/http/response.js";

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  return sendError(
    res,
    404,
    `Route not found: ${req.method} ${req.originalUrl}`,
  );
}
