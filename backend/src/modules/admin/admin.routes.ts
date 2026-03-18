import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/index.js";
import {
  approveFacility,
  getAnalytics,
  listAuditLogs,
  listPendingFacilities,
  listUsers,
} from "./admin.controller.js";

const adminRouter = Router();

adminRouter.get("/users", requireAuth, requireRole(["admin"]), listUsers);
adminRouter.get("/analytics", requireAuth, requireRole(["admin"]), getAnalytics);
adminRouter.get("/audit-logs", requireAuth, requireRole(["admin"]), listAuditLogs);
adminRouter.get("/facilities/pending", requireAuth, requireRole(["admin"]), listPendingFacilities);
adminRouter.post("/facilities/:id/approve", requireAuth, requireRole(["admin"]), approveFacility);

export default adminRouter;
