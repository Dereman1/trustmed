import type { Request, Response } from "express";
import { AppError } from "../../core/errors/app-error.js";
import { asyncHandler } from "../../core/http/async-handler.js";
import { sendSuccess } from "../../core/http/response.js";
import { messageService } from "./message.service.js";
import type { CreateMessageBody, MessageListQuery } from "../../types/message.types.js";

export const sendMessage = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const { receiver_id, message_text } = req.body as CreateMessageBody;
    const message = await messageService.send(
      req.authUser,
      receiver_id,
      message_text,
    );
    return sendSuccess(res, 201, message, "Message sent");
  },
);

export const getMessages = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const query: MessageListQuery = {
      counterpart_id: req.query.counterpart_id as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    };
    const messages = await messageService.listForUser(req.authUser, query);
    return sendSuccess(res, 200, messages, "Messages retrieved");
  },
);
