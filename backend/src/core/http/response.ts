import type { Response } from "express";

type SuccessPayload<T> = {
  success: true;
  message?: string;
  data?: T;
};

type ErrorPayload = {
  success: false;
  message: string;
  details?: unknown;
};

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  data?: T,
  message?: string,
) {
  const payload: SuccessPayload<T> = {
    success: true,
    ...(message ? { message } : {}),
    ...(data !== undefined ? { data } : {}),
  };

  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  details?: unknown,
) {
  const payload: ErrorPayload = {
    success: false,
    message,
    ...(details !== undefined ? { details } : {}),
  };

  return res.status(statusCode).json(payload);
}
