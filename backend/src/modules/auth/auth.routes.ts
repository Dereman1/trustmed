import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  resetPassword,
  register,
} from "./auth.controller.js";
import { requireAuth, validate } from "../../middlewares/index.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  resetPasswordSchema,
  registerSchema,
} from "../../validators/auth.validators.js";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPassword,
);
authRouter.post(
  "/change-password",
  requireAuth,
  validate(changePasswordSchema),
  changePassword,
);
authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPassword,
);
authRouter.post("/logout", validate(logoutSchema), logout);
authRouter.get("/me", requireAuth, getCurrentUser);

export default authRouter;
