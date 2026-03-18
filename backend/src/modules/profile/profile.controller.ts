import type { Request, Response } from "express";
import { AppError } from "../../core/errors/app-error.js";
import { asyncHandler } from "../../core/http/async-handler.js";
import { sendSuccess } from "../../core/http/response.js";
import { profileService } from "./profile.service.js";
import type { UpdateMyProfileBody } from "../../types/profile.types.js";

export const getMyProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }

    const profile = await profileService.getMyProfile(req.authUser);

    return sendSuccess(res, 200, profile, "Profile retrieved");
  },
);

export const updateMyProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }

    const profile = await profileService.updateMyProfile(
      req.authUser,
      req.body as UpdateMyProfileBody,
    );

    return sendSuccess(res, 200, profile, "Profile updated");
  },
);

export const uploadMyAvatar = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }

    const file = (req as Request & { file?: any}).file;

    if (!file) {
      throw new AppError("Avatar file is required", 400);
    }

    const profile = await profileService.uploadMyAvatar(req.authUser, {
      buffer: file.buffer,
      mimetype: file.mimetype,
    });

    return sendSuccess(
      res,
      200,
      profile,
      "Avatar uploaded and profile updated",
    );
  },
);
