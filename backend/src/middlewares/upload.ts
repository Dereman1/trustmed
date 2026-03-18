
import multer, {FileFilterCallback} from "multer";
import { AppError } from "../core/errors/app-error.js";
import express, {Request} from "express";
const storage = multer.memoryStorage();

const MAX_VERIFICATION_DOC_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VERIFICATION_DOC_FILES = 5;
const allowedVerificationDocMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
]);

export const verificationDocsUpload = multer({
  storage,
  limits: {
    fileSize: MAX_VERIFICATION_DOC_SIZE_BYTES,
    files: MAX_VERIFICATION_DOC_FILES,
  },
  fileFilter: (_req: Request, file: any, cb: FileFilterCallback) => {
    if (!allowedVerificationDocMimeTypes.has(file.mimetype)) {
      cb(
        new AppError(
          "Only PDF, PNG, JPG, or JPEG verification docs are allowed",
          400,
        ),
      );
      return;
    }
    cb(null, true);
  },
});

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_PRODUCT_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_PRODUCT_IMAGE_FILES = 10;
const MAX_RECORD_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/jpg"]);
const allowedRecordMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
]);

export const avatarUpload = multer({
  storage,
  limits: {
    fileSize: MAX_AVATAR_SIZE_BYTES,
  },
  fileFilter: (_req: Request, file: any, cb: FileFilterCallback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(
        new AppError("Only PNG, JPG, or JPEG avatar uploads are allowed", 400),
      );
      return;
    }

    cb(null, true);
  },
});

export const productImageUpload = multer({
  storage,
  limits: {
    fileSize: MAX_PRODUCT_IMAGE_SIZE_BYTES,
    files: MAX_PRODUCT_IMAGE_FILES,
  },
  fileFilter: (_req: Request, file: any, cb: FileFilterCallback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(
        new AppError(
          "Only PNG, JPG, or JPEG product image uploads are allowed",
          400,
        ),
      );
      return;
    }

    cb(null, true);
  },
});

export const recordFileUpload = multer({
  storage,
  limits: {
    fileSize: MAX_RECORD_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req: Request, file: any, cb: FileFilterCallback) => {
    if (!allowedRecordMimeTypes.has(file.mimetype)) {
      cb(
        new AppError(
          "Only PDF, PNG, or JPEG medical record uploads are allowed",
          400,
        ),
      );
      return;
    }
    cb(null, true);
  },
});
