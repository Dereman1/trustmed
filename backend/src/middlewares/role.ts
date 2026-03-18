import type { NextFunction, Request, Response } from "express";
import { AppError } from "../core/errors/app-error.js";
import { supabaseService } from "../config/supabase.js";

export function requireRole(allowedRoles: string[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return next(new AppError("Authentication required", 401));
    }

    const roleFromMetadata =
      (req.authUser.app_metadata?.role as string | undefined) ??
      (req.authUser.user_metadata?.role as string | undefined);

    let userRole = roleFromMetadata;

    if (!userRole) {
      const { data, error } = await supabaseService
        .from("profiles")
        .select("role")
        .eq("id", req.authUser.id)
        .maybeSingle();

      if (error) {
        return next(
          new AppError("Failed to resolve user role", 500, error.message),
        );
      }

      userRole = (data?.role as string | undefined) ?? undefined;
    }

    userRole = userRole?.trim().toLowerCase();

    if (!userRole) {
      return next(new AppError("Forbidden: user role is not set", 403));
    }

    if (!allowedRoles.includes(userRole)) {
      return next(
        new AppError("Forbidden: insufficient role", 403, {
          required: allowedRoles,
          current: userRole,
        }),
      );
    }

    return next();
  };
}
