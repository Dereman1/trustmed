import type { Request, Response } from "express";
import { AppError } from "../../core/errors/app-error.js";
import { asyncHandler } from "../../core/http/async-handler.js";
import { sendSuccess } from "../../core/http/response.js";
import { patientService } from "./patient.service.js";
import type { CreatePatientBody, UpdatePatientBody } from "../../types/patient.types.js";

export const getMyPatientProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const profile = await patientService.getMyProfile(req.authUser);
    return sendSuccess(res, 200, profile, "Patient profile retrieved");
  },
);

export const createPatientProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const profile = await patientService.create(
      req.authUser,
      req.body as CreatePatientBody,
    );
    return sendSuccess(res, 201, profile, "Patient profile created");
  },
);

export const updateMyPatientProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const profile = await patientService.updateMyProfile(
      req.authUser,
      req.body as UpdatePatientBody,
    );
    return sendSuccess(res, 200, profile, "Patient profile updated");
  },
);

export const listAllPatients = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const patients = await patientService.listAllPatients();
    return sendSuccess(res, 200, patients, "Patients list retrieved");
  },
);
  

