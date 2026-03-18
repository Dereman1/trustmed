import { Router } from "express";
import {
  avatarUpload,
  requireAuth,
  validate,
} from "../../middlewares/index.js";
import {
  getMyProfile,
  updateMyProfile,
  uploadMyAvatar,
} from "./profile.controller.js";
import { updateMyProfileSchema } from "../../validators/profile.validators.js";

const profileRouter = Router();

profileRouter.get("/me", requireAuth, getMyProfile);
profileRouter.patch(
  "/me",
  requireAuth,
  validate(updateMyProfileSchema),
  updateMyProfile,
);
profileRouter.patch(
  "/me/avatar",
  requireAuth,
  avatarUpload.single("avatar"),
  uploadMyAvatar,
);

export default profileRouter;
