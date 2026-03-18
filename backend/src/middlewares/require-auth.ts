import type { NextFunction, Request, Response } from "express";
import { supabaseService } from "../config/supabase.js";
import { AppError } from "../core/errors/app-error.js";

function getBearerToken(req: Request): string | null {
  const authHeader = req.header("authorization");

  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authHeader.slice(7).trim();
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const token = getBearerToken(req);

  if (!token) {
    return next(new AppError("Missing bearer token", 401));
  }

  const { data, error } = await supabaseService.auth.getUser(token);

  if (error || !data.user) {
    return next(new AppError("Invalid or expired token", 401, error?.message));
  }

  req.authUser = data.user;
  req.authToken = token;

  return next();
}
