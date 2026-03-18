import { Router } from "express";
import { requireAuth, requireRole, validate } from "../../middlewares/index.js";
import {
  grantAccess,
  listGrantedToMe,
  listGrantedToMeWithPatientDetails,
  listMyPermissions,
  listMyPermissionsWithProvider,
  requestAccess,
  revokeAccess,
} from "./access.controller.js";
import {
  grantAccessSchema,
  requestAccessSchema,
  revokeAccessSchema,
} from "../../validators/access.validators.js";

const accessRouter = Router();

accessRouter.post(
  "/request",
  requireAuth,
  requireRole(["provider"]),
  validate(requestAccessSchema),
  requestAccess,
);
accessRouter.post(
  "/grant",
  requireAuth,
  requireRole(["patient"]),
  validate(grantAccessSchema),
  grantAccess,
);
accessRouter.post(
  "/revoke",
  requireAuth,
  requireRole(["patient"]),
  validate(revokeAccessSchema),
  revokeAccess,
);
accessRouter.get(
  "/my/with-provider",
  requireAuth,
  requireRole(["patient"]),
  listMyPermissionsWithProvider,
);
accessRouter.get(
  "/my",
  requireAuth,
  requireRole(["patient"]),
  listMyPermissions,
);
accessRouter.get(
  "/granted-to-me/with-patient-details",
  requireAuth,
  requireRole(["provider"]),
  listGrantedToMeWithPatientDetails,
);
accessRouter.get(
  "/granted-to-me",
  requireAuth,
  requireRole(["provider"]),
  listGrantedToMe,
);

export default accessRouter;
