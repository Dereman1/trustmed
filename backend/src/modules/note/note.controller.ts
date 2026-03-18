import type { Request, Response } from "express";
import { AppError } from "../../core/errors/app-error.js";
import { asyncHandler } from "../../core/http/async-handler.js";
import { sendSuccess } from "../../core/http/response.js";
import { supabaseService } from "../../config/supabase.js";
import { noteService } from "./note.service.js";
import type { CreateNoteBody } from "../../types/note.types.js";

export const addNote = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const note = await noteService.add(
      req.authUser,
      req.body as CreateNoteBody,
    );
    return sendSuccess(res, 201, note, "Note added");
  },
);

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

export const getNotesByRecordId = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }
    const recordId = req.params.record_id;
    if (typeof recordId !== "string") {
      throw new AppError("Invalid record id", 400);
    }
    const role = await getCurrentRole(req.authUser.id);
    const notes =
      role === "patient"
        ? await noteService.getByRecordIdForPatient(req.authUser, recordId)
        : await noteService.getByRecordId(req.authUser, recordId);
    return sendSuccess(res, 200, notes, "Notes retrieved");
  },
);
