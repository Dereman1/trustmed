import type { Request, Response } from "express";
import { AppError } from "../../core/errors/app-error.js";
import { asyncHandler } from "../../core/http/async-handler.js";
import { sendSuccess } from "../../core/http/response.js";
import { facilityService } from "./facility.service.js";
import type {
  CreateFacilityBody,
  UpdateFacilityBody,
} from "../../types/facility.types.js";
import { supabaseService } from "../../config/supabase.js";
import { notificationService } from "../notification/notification.service.js";
import { auditLog } from "../../core/audit.js";

const verificationDocsBucket =
  process.env.SUPABASE_VERIFICATION_DOCS_BUCKET ?? "facility-verification-docs";

// Upload verification docs for a facility
export const uploadVerificationDocs = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const facilityId = getFacilityIdParam(req);
    const files = (req as Request & { files?: any[] }).files;
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new AppError("Verification documents are required", 400);
    }
    // Upload each file to Supabase Storage
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const ext = file.originalname.split(".").pop() || "bin";
      const path = `${facilityId}/verification-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabaseService.storage
        .from(verificationDocsBucket)
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });
      if (uploadError) {
        const hint =
          uploadError.message?.toLowerCase().includes("bucket") ||
          uploadError.message?.toLowerCase().includes("not found")
            ? " Create the storage bucket in Supabase Dashboard → Storage (e.g. 'facility-verification-docs') or set SUPABASE_VERIFICATION_DOCS_BUCKET."
            : "";
        throw new AppError(
          "Failed to upload verification doc",
          400,
          (uploadError.message ?? "") + hint,
        );
      }
      const { data: publicUrlData } = supabaseService.storage
        .from(verificationDocsBucket)
        .getPublicUrl(path);
      uploadedUrls.push(publicUrlData.publicUrl);
    }
    // Update facility with new verification_docs URLs
    const updated = await facilityService.update(facilityId, {
      verification_docs: uploadedUrls,
    });
    return sendSuccess(res, 200, updated, "Verification documents uploaded");
  },
);
function getFacilityIdParam(req: Request): string {
  const id = req.params.id;
  if (typeof id !== "string") {
    throw new AppError("Invalid facility id", 400);
  }
  return id;
}

export const listFacilities = asyncHandler(
  async (_req: Request, res: Response) => {
    const limit = Number(_req.query.limit) || 100;
    const facilities = await facilityService.list(limit);
    return sendSuccess(res, 200, facilities, "Facilities retrieved");
  },
);

export const getFacilityById = asyncHandler(
  async (req: Request, res: Response) => {
    const facility = await facilityService.getById(getFacilityIdParam(req));
    return sendSuccess(res, 200, facility, "Facility retrieved");
  },
);

export const createFacility = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    // Only allow users with role 'facility' to create a facility
    if (req.authUser.user_metadata?.role !== "facility") {
      throw new AppError(
        "Only users with facility role can register a facility",
        403,
      );
    }
    const facility = await facilityService.create(
      req.body as CreateFacilityBody,
    );
    // Optionally notify admin(s) for approval via a real admin user_id.
    // To avoid foreign-key errors, this demo does not create an automatic
    // admin notification here because there may not be an admin user row.
    await auditLog({
      user_id: req.authUser.id,
      action_type: "facility_registered",
      metadata: { facility_id: facility.id },
    });
    return sendSuccess(res, 201, facility, "Facility created");
  },
);

export const updateFacility = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    // Accept verification_docs from body
    const facility = await facilityService.update(
      getFacilityIdParam(req),
      req.body as UpdateFacilityBody,
    );
    return sendSuccess(res, 200, facility, "Facility updated");
  },
);

// Admin: List pending facilities
export const listPendingFacilities = asyncHandler(
  async (_req: Request, res: Response) => {
    const facilities = await facilityService.listPending();
    return sendSuccess(res, 200, facilities, "Pending facilities retrieved");
  },
);

// Admin: Approve facility
export const approveFacility = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const facility = await facilityService.approve(getFacilityIdParam(req));
    // Notify facility owner (assuming facility has contact_phone or similar)
    await notificationService.create({
      // facilities.id is the auth user id for the facility owner
      user_id: facility.id,
      type: "DOCUMENT_ADDED",
      title: "Facility approved",
      body: `Your facility ${facility.facility_name} has been approved.`,
      metadata: { facility_id: facility.id },
    });
    await auditLog(
      {
        user_id: req.authUser.id,
        action_type: "facility_approved",
        metadata: { facility_id: facility.id },
      },
    );
    return sendSuccess(res, 200, facility, "Facility approved");
  },
);

export const deleteFacility = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    await facilityService.remove(getFacilityIdParam(req));
    return sendSuccess(res, 200, undefined, "Facility deleted");
  },
);
