import type { Request, Response } from "express";
import { AppError } from "../../core/errors/app-error.js";
import { asyncHandler } from "../../core/http/async-handler.js";
import { sendSuccess } from "../../core/http/response.js";
import { notificationService } from "./notification.service.js";

export const listMy = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) throw new AppError("Authentication required", 401);
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const unreadOnly = req.query.unread_only === "true";
  const list = await notificationService.listMy(req.authUser, limit, unreadOnly);
  return sendSuccess(res, 200, list, "Notifications retrieved");
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) throw new AppError("Authentication required", 401);
  const id = req.params.id;
  if (typeof id !== "string") throw new AppError("Invalid notification id", 400);
  const notification = await notificationService.markRead(req.authUser, id);
  return sendSuccess(res, 200, notification, "Notification marked as read");
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) throw new AppError("Authentication required", 401);
  await notificationService.markAllRead(req.authUser);
  return sendSuccess(res, 200, undefined, "All notifications marked as read");
});
