import { Router } from "express";
import {
  requireAuth,
  requireRole,
  validate,
  recordFileUpload,
} from "../../middlewares/index.js";
import {
  getRecordById,
  listMyRecords,
  listRecordsForPatient,
  listRecordDocuments,
  uploadRecord,
  uploadRecordDocument,
} from "./record.controller.js";
import { createRecordSchema } from "../../validators/record.validators.js";

const recordRouter = Router();

recordRouter.get(
  "/",
  requireAuth,
  requireRole(["patient"]),
  listMyRecords,
);
recordRouter.get(
  "/for-patient/:patientId",
  requireAuth,
  requireRole(["provider"]),
  listRecordsForPatient,
);
recordRouter.get(
  "/:id",
  requireAuth,
  requireRole(["patient", "provider"]),
  getRecordById,
);
recordRouter.post(
  "/upload",
  requireAuth,
  requireRole(["patient"]),
  recordFileUpload.single("file"),
  validate(createRecordSchema),
  uploadRecord,
);
recordRouter.get(
  "/:id/documents",
  requireAuth,
  requireRole(["patient", "provider"]),
  listRecordDocuments,
);
recordRouter.post(
  "/:id/documents",
  requireAuth,
  requireRole(["provider"]),
  recordFileUpload.single("file"),
  uploadRecordDocument,
);

export default recordRouter;
