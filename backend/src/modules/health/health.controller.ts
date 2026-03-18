import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { sendSuccess } from "../../core/http/response.js";

export function getHealth(_req: Request, res: Response) {
  return sendSuccess(
    res,
    200,
    {
      status: "ok",
      service: "backend",
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.nodeEnv,
    },
    "Service is healthy",
  );
}
