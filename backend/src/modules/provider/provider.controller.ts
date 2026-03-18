
import { notificationService } from "../notification/notification.service.js";
import { auditLog } from "../../core/audit.js";
import type { Request, Response } from "express";
import { AppError } from "../../core/errors/app-error.js";
import { asyncHandler } from "../../core/http/async-handler.js";
import { sendSuccess } from "../../core/http/response.js";
import { providerService } from "./provider.service.js";
import type {
  CreateProviderBody,
  UpdateProviderBody,
} from "../../types/provider.types.js";

export const getProviderByIdForAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const providerId = req.params.id;
    if (typeof providerId !== "string") {
      throw new AppError("Invalid provider id", 400);
    }
    const provider = await providerService.getProviderById(providerId);
    // This will include verification_docs in the response
    return sendSuccess(res, 200, provider, "Provider details retrieved");
  },
);
export const getMyProviderProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const profile = await providerService.getMyProfile(req.authUser);
    return sendSuccess(res, 200, profile, "Provider profile retrieved");
  },
);

// Direct provider registration is disabled. Providers are managed by facilities only.

export const updateMyProviderProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const profile = await providerService.updateMyProfile(
      req.authUser,
      req.body as UpdateProviderBody,
    );
    return sendSuccess(res, 200, profile, "Provider profile updated");
  },
);

export const listPendingProviders = asyncHandler(
  async (_req: Request, res: Response) => {
    if (!_req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const list = await providerService.listPending();
    return sendSuccess(res, 200, list, "Pending providers retrieved");
  },
);

export const approveProvider = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const providerId = req.params.id;
    if (typeof providerId !== "string") {
      throw new AppError("Invalid provider id", 400);
    }
    const provider = await providerService.approveProvider(
      req.authUser,
      providerId,
    );
    await notificationService.create({
      user_id: provider.user_id,
      type: "DOCUMENT_ADDED",
      title: "Provider approved",
      body: `Your provider registration has been approved.`,
      metadata: { provider_id: provider.id },
    });
    await auditLog(
      {
        user_id: req.authUser.id,
        action_type: "provider_approved",
        metadata: { 
          provider_id: provider.id,
          facility_id: provider.facility_id 
        },
      },
    );
    return sendSuccess(res, 200, provider, "Provider approved");
  },
);

export const getProviderStats = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const stats = await providerService.getProviderStats(req.authUser);
    return sendSuccess(res, 200, stats, "Provider stats retrieved");
  },
);
