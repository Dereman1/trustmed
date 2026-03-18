import type { Request, Response } from "express";
import { asyncHandler } from "../../core/http/async-handler.js";
import { sendSuccess } from "../../core/http/response.js";
import { AppError } from "../../core/errors/app-error.js";
import { supabaseService } from "../../config/supabase.js";

// Get recent activity (audit logs) for a facility
export const getFacilityActivity = asyncHandler(
  async (req: Request, res: Response) => {
    const facilityId = req.params.id;
    if (!facilityId) throw new AppError("Facility id required", 400);
    // Query audit_logs where metadata.facility_id = facilityId
    const { data, error } = await supabaseService
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .contains("metadata", { facility_id: facilityId });
    if (error)
      throw new AppError("Failed to fetch activity logs", 500, error.message);
    return sendSuccess(res, 200, data ?? [], "Facility activity logs");
  },
);

// Get count of pending providers for a facility
export const getPendingProvidersCount = asyncHandler(
  async (req: Request, res: Response) => {
    const facilityId = req.params.id;
    if (!facilityId) throw new AppError("Facility id required", 400);
    const { count, error } = await supabaseService
      .from("providers")
      .select("id", { count: "exact", head: true })
      .eq("facility_id", facilityId)
      .eq("status", "pending");
    if (error)
      throw new AppError(
        "Failed to fetch pending providers count",
        500,
        error.message,
      );
    return sendSuccess(
      res,
      200,
      { count: count ?? 0 },
      "Pending providers count",
    );
  },
);
