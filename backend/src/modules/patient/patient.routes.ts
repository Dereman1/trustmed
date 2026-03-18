import { listApprovedProviders } from "./patient.providers.controller.js";
// List all approved providers for patients

import { Router } from "express";
import { requireAuth, requireRole, validate } from "../../middlewares/index.js";
import {
  createPatientProfile,
  getMyPatientProfile,
  updateMyPatientProfile,
  listAllPatients,
} from "./patient.controller.js";
import {
  createPatientSchema,
  updatePatientSchema,
} from "../../validators/patient.validators.js";

const patientRouter = Router();

patientRouter.get(
  "/list-all",
  requireAuth,
  requireRole(["provider"]),
  listAllPatients,
);
patientRouter.get(
  "/providers",
  requireAuth,
  requireRole(["patient"]),
  listApprovedProviders,
);
patientRouter.get(
  "/me",
  requireAuth,
  requireRole(["patient"]),
  getMyPatientProfile,
);
patientRouter.post(
  "/me",
  requireAuth,
  requireRole(["patient"]),
  validate(createPatientSchema),
  createPatientProfile,
);
patientRouter.patch(
  "/me",
  requireAuth,
  requireRole(["patient"]),
  validate(updatePatientSchema),
  updateMyPatientProfile,
);

export default patientRouter;
