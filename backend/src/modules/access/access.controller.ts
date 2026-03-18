import type { Request, Response } from "express";
import { AppError } from "../../core/errors/app-error.js";
import { asyncHandler } from "../../core/http/async-handler.js";
import { sendSuccess } from "../../core/http/response.js";
import { accessService } from "./access.service.js";

export const requestAccess = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const { patient_id } = req.body as { patient_id: string };
    const permission = await accessService.requestAccess(req.authUser, patient_id);
    return sendSuccess(res, 201, permission, "Access requested");
  },
);

export const grantAccess = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const { permission_id } = req.body as { permission_id: string };
    const permission = await accessService.grantAccess(req.authUser, permission_id);
    return sendSuccess(res, 200, permission, "Access granted");
  },
);

export const revokeAccess = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const { permission_id } = req.body as { permission_id: string };
    const permission = await accessService.revokeAccess(req.authUser, permission_id);
    return sendSuccess(res, 200, permission, "Access revoked");
  },
);

export const listMyPermissions = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const list = await accessService.listMyPermissions(req.authUser);
    return sendSuccess(res, 200, list, "Permissions retrieved");
  },
);

export const listMyPermissionsWithProvider = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const list = await accessService.listMyPermissionsWithProvider(req.authUser);
    return sendSuccess(res, 200, list, "Permissions with provider details retrieved");
  },
);

export const listGrantedToMe = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const list = await accessService.listGrantedToMe(req.authUser);
    return sendSuccess(res, 200, list, "Granted access retrieved");
  },
);

export const listGrantedToMeWithPatientDetails = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const list = await accessService.listGrantedToMeWithPatientDetails(req.authUser);
    return sendSuccess(res, 200, list, "Granted access with patient details retrieved");
  },
);
