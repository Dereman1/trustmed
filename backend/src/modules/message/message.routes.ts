import { Router } from "express";
import { requireAuth, requireRole, validate } from "../../middlewares/index.js";
import { getMessages, sendMessage } from "./message.controller.js";
import { sendMessageSchema } from "../../validators/message.validators.js";

const messageRouter = Router();

messageRouter.post(
  "/send",
  requireAuth,
  requireRole(["patient", "provider"]),
  validate(sendMessageSchema),
  sendMessage,
);
messageRouter.get(
  "/",
  requireAuth,
  requireRole(["patient", "provider"]),
  getMessages,
);

export default messageRouter;
