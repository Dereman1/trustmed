import { Router } from "express";
import { requireAuth, requireRole, validate } from "../../middlewares/index.js";
import {
  approveProvider,
  getMyProviderProfile,
  getProviderByIdForAdmin,
  listPendingProviders,
  updateMyProviderProfile,
  getProviderStats,
} from "./provider.controller.js";
import { updateProviderSchema } from "../../validators/provider.validators.js";

const providerRouter = Router();

// Admin: list all pending providers
providerRouter.get(
  "/pending",
  requireAuth,
  requireRole(["admin"]),
  listPendingProviders,
);

// Admin: approve a specific provider
providerRouter.post(
  "/:id/approve",
  requireAuth,
  requireRole(["admin"]),
  approveProvider,
);

// Provider: get stats (must come before /:id to avoid being caught by param matcher)
providerRouter.get(
  "/stats/dashboard",
  requireAuth,
  requireRole(["provider"]),
  getProviderStats,
);

// Provider: get own profile
providerRouter.get(
  "/me",
  requireAuth,
  requireRole(["provider"]),
  getMyProviderProfile,
);

// Provider: update own profile
providerRouter.patch(
  "/me",
  requireAuth,
  requireRole(["provider"]),
  validate(updateProviderSchema),
  updateMyProviderProfile,
);

// Admin: view provider details (including verification docs)
providerRouter.get(
  "/:id",
  requireAuth,
  requireRole(["admin"]),
  getProviderByIdForAdmin,
);

export default providerRouter;
