import type { Request, Response } from "express";
import { AppError } from "../../core/errors/app-error.js";
import { asyncHandler } from "../../core/http/async-handler.js";
import { sendSuccess } from "../../core/http/response.js";
import { supabaseService } from "../../config/supabase.js";
import { recordDocumentService } from "./record-document.service.js";
import { recordService } from "./record.service.js";
import type { CreateRecordBody } from "../../types/record.types.js";

async function getCurrentRole(userId: string): Promise<"patient" | "provider"> {
  const { data } = await supabaseService
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  const role = (data?.role as string)?.trim().toLowerCase();
  if (role === "patient") return "patient";
  if (role === "provider") return "provider";
  throw new AppError("Forbidden: patient or provider role required", 403);
}

export const listMyRecords = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const records = await recordService.listMyRecords(req.authUser);
    return sendSuccess(res, 200, records, "Records retrieved");
  },
);

export const listRecordsForPatient = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) throw new AppError("Authentication required", 401);
    const patientId = req.params.patientId;
    if (typeof patientId !== "string")
      throw new AppError("Invalid patient id", 400);
    const records = await recordService.listByPatientForProvider(
      req.authUser,
      patientId,
    );
    return sendSuccess(res, 200, records, "Records retrieved");
  },
);

export const getRecordById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new AppError("Invalid record id", 400);
    }
    const role = await getCurrentRole(req.authUser.id);
    const record =
      role === "patient"
        ? await recordService.getByIdAndPatient(id, req.authUser)
        : await recordService.getByIdForProvider(id, req.authUser);
    return sendSuccess(res, 200, record, "Record retrieved");
  },
);

export const uploadRecord = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const file = (req as Request & { file?: any}).file;
    if (!file) {
      throw new AppError("Medical record file is required", 400);
    }
    const record = await recordService.upload(
      req.authUser,
      req.body as CreateRecordBody,
      { buffer: file.buffer, mimetype: file.mimetype },
    );
    return sendSuccess(res, 201, record, "Record uploaded");
  },
);

export const uploadRecordDocument = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) throw new AppError("Authentication required", 401);
    const recordId = req.params.id;
    if (typeof recordId !== "string") throw new AppError("Invalid record id", 400);
    const file = (req as Request & { file?: any}).file;
    if (!file) throw new AppError("Document file is required", 400);
    const description = (req.body as { description?: string }).description;
    const doc = await recordDocumentService.upload(
      req.authUser,
      recordId,
      { buffer: file.buffer, mimetype: file.mimetype },
      description,
    );
    return sendSuccess(res, 201, doc, "Document uploaded");
  },
);

export const listRecordDocuments = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) throw new AppError("Authentication required", 401);
    const recordId = req.params.id;
    if (typeof recordId !== "string") throw new AppError("Invalid record id", 400);
    const role = await getCurrentRole(req.authUser.id);
    if (role === "patient") {
      await recordService.getByIdAndPatient(recordId, req.authUser);
    } else {
      await recordService.getByIdForProvider(recordId, req.authUser);
    }
    const docs = await recordDocumentService.listByRecordId(recordId);
    return sendSuccess(res, 200, docs, "Documents retrieved");
  },
);
