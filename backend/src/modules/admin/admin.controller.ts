import type { Request, Response } from "express";
import { AppError } from "../../core/errors/app-error.js";
import { asyncHandler } from "../../core/http/async-handler.js";
import { sendSuccess } from "../../core/http/response.js";
import { facilityService } from "../facility/facility.service.js";
import { adminService } from "./admin.service.js";

export const listUsers = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const users = await adminService.listUsers(limit);
    return sendSuccess(res, 200, users, "Users retrieved");
  },
);

export const getAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const analytics = await adminService.getAnalytics();
    return sendSuccess(res, 200, analytics, "Analytics retrieved");
  },
);

export const listAuditLogs = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const logs = await adminService.listAuditLogs(limit, offset);
    return sendSuccess(res, 200, logs, "Audit logs retrieved");
  },
);

export const listPendingFacilities = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) throw new AppError("Authentication required", 401);
    const list = await facilityService.listPending();
    return sendSuccess(res, 200, list, "Pending facilities retrieved");
  },
);

export const approveFacility = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) throw new AppError("Authentication required", 401);
    const id = req.params.id;
    if (typeof id !== "string") throw new AppError("Invalid facility id", 400);
    const facility = await facilityService.approve(id);
    return sendSuccess(res, 200, facility, "Facility approved");
  },
);
