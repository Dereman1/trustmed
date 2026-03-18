import type { Request, Response } from "express";
import { asyncHandler } from "../../core/http/async-handler.js";
import { sendSuccess } from "../../core/http/response.js";
import { AppError } from "../../core/errors/app-error.js";
import { supabaseService } from "../../config/supabase.js";

// List all approved providers for patient selection
export const listApprovedProviders = asyncHandler(
  async (_req: Request, res: Response) => {
    // Optionally, filter by facility or other criteria
    const { data, error } = await supabaseService
      .from("providers")
      .select(
        "id, user_id, specialization, license_number, facility_id, status",
      )
      .eq("status", "approved");
    if (error)
      throw new AppError("Failed to fetch providers", 500, error.message);
    return sendSuccess(res, 200, data ?? [], "Approved providers");
  },
);
