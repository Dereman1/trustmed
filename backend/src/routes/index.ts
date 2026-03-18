import { Router } from "express";
import accessRouter from "../modules/access/access.routes.js";
import adminRouter from "../modules/admin/admin.routes.js";
import authRouter from "../modules/auth/auth.routes.js";
import facilityRouter from "../modules/facility/facility.routes.js";
import healthRouter from "../modules/health/health.routes.js";
import messageRouter from "../modules/message/message.routes.js";
import noteRouter from "../modules/note/note.routes.js";
import notificationRouter from "../modules/notification/notification.routes.js";
import patientRouter from "../modules/patient/patient.routes.js";
import profileRouter from "../modules/profile/profile.routes.js";
import productRouter from "../modules/product/product.routes.js";
import providerRouter from "../modules/provider/provider.routes.js";
import recordRouter from "../modules/record/record.routes.js";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/facilities", facilityRouter);
apiRouter.use("/patients", patientRouter);
apiRouter.use("/providers", providerRouter);
apiRouter.use("/records", recordRouter);
apiRouter.use("/access", accessRouter);
apiRouter.use("/notes", noteRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/messages", messageRouter);
apiRouter.use("/admin", adminRouter);

export default apiRouter;
