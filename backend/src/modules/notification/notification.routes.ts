import { Router } from "express";
import { requireAuth } from "../../middlewares/index.js";
import { listMy, markAllRead, markRead } from "./notification.controller.js";

const notificationRouter = Router();

notificationRouter.get("/", requireAuth, listMy);
notificationRouter.patch("/:id/read", requireAuth, markRead);
notificationRouter.patch("/read-all", requireAuth, markAllRead);

export default notificationRouter;
