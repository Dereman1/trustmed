import { Router } from "express";
import { requireAuth, requireRole, validate } from "../../middlewares/index.js";
import {
  createFacility,
  deleteFacility,
  getFacilityById,
  listFacilities,
  updateFacility,
  listPendingFacilities,
  approveFacility,
} from "./facility.controller.js";

import { supabaseService } from "../../config/supabase.js";
import { auditLog } from "../../core/audit.js";
// Example: facilityRouter.post('/:id/providers', ...)
import {
  createFacilitySchema,
  updateFacilitySchema,
} from "../../validators/facility.validators.js";

import {
  getFacilityActivity,
  getPendingProvidersCount,
} from "./facility.activity.controller.js";
const facilityRouter = Router();
// Facility recent activity logs
facilityRouter.get(
  "/:id/activity",
  requireAuth,
  requireRole(["facility"]),
  getFacilityActivity,
);

// Facility pending providers count
facilityRouter.get(
  "/:id/pending-providers-count",
  requireAuth,
  requireRole(["facility"]),
  getPendingProvidersCount,
);

// Facility uploads verification docs for a provider
facilityRouter.post(
  "/:facilityId/providers/:providerId/verification-docs",
  requireAuth,
  requireRole(["facility"]),
  verificationDocsUpload.array("verification_docs", 5),
  asyncHandler(async (req, res) => {
    const facilityId = Array.isArray(req.params.facilityId)
      ? req.params.facilityId[0]
      : req.params.facilityId;
    const providerId = Array.isArray(req.params.providerId)
      ? req.params.providerId[0]
      : req.params.providerId;
    const files = (req as any).files;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res
        .status(400)
        .json({ message: "Verification documents are required" });
    }
    // Upload each file to Supabase Storage
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const ext = file.originalname.split(".").pop() || "bin";
      const path = `${providerId}/verification-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabaseService.storage
        .from("provider-verification-docs")
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });
      if (uploadError) {
        return res.status(400).json({
          message: "Failed to upload verification doc",
          error: uploadError.message,
        });
      }
      const { data: publicUrlData } = supabaseService.storage
        .from("provider-verification-docs")
        .getPublicUrl(path);
      uploadedUrls.push(publicUrlData.publicUrl);
    }
    // Update provider with new verification_docs URLs
    await providerService.update(providerId as string, {
      verification_docs: uploadedUrls,
    });
    return res.status(200).json({
      message: "Provider verification documents uploaded",
      urls: uploadedUrls,
    });
  }),
);
import { verificationDocsUpload } from "../../middlewares/index.js";
import { uploadVerificationDocs } from "./facility.controller.js";
// Facility uploads verification docs
facilityRouter.post(
  "/:id/verification-docs",
  requireAuth,
  requireRole(["facility"]),
  verificationDocsUpload.array("verification_docs", 5),
  uploadVerificationDocs,
);
import { providerService } from "../provider/provider.service.js";
import { sendSuccess } from "../../core/http/response.js";
import { asyncHandler } from "../../core/http/async-handler.js";
// Facility creates a provider under itself
facilityRouter.post(
  "/:id/providers",
  requireAuth,
  requireRole(["facility"]),
  asyncHandler(async (req, res) => {
    const facilityId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    // Only allow if authUser is the facility
    // You may want to check req.authUser.id === facilityId or similar logic
    const provider = await providerService.create({
      ...req.body,
      facility_id: facilityId,
    });
    
    if (req.authUser) {
      await auditLog({
        user_id: req.authUser.id,
        action_type: "provider_created",
        metadata: { 
          provider_id: provider.id,
          facility_id: facilityId 
        },
      });
    }

    return sendSuccess(res, 201, provider, "Provider created under facility");
  }),
);

// Facility lists its providers
facilityRouter.get(
  "/:id/providers",
  requireAuth,
  requireRole(["facility"]),
  asyncHandler(async (req, res) => {
    const facilityId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const providers = await providerService.listByFacility(facilityId);
    return sendSuccess(res, 200, providers, "Providers for facility retrieved");
  }),
);

facilityRouter.get(
  "/pending",
  requireAuth,
  requireRole(["admin"]),
  listPendingFacilities,
);
facilityRouter.post(
  "/:id/approve",
  requireAuth,
  requireRole(["admin"]),
  approveFacility,
);

// Providers management (for facilities)

facilityRouter.get("/", requireAuth, listFacilities);
facilityRouter.get("/:id", requireAuth, getFacilityById);
facilityRouter.post(
  "/",
  requireAuth,
  requireRole(["admin", "facility"]),
  validate(createFacilitySchema),
  createFacility,
);
facilityRouter.patch(
  "/:id",
  requireAuth,
  requireRole(["admin", "facility"]),
  validate(updateFacilitySchema),
  updateFacility,
);
facilityRouter.delete(
  "/:id",
  requireAuth,
  requireRole(["admin"]),
  deleteFacility,
);

export default facilityRouter;
