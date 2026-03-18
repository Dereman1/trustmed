import { Router } from "express";
import { requireAuth, requireRole, validate } from "../../middlewares/index.js";
import { addNote, getNotesByRecordId } from "./note.controller.js";
import { addNoteSchema } from "../../validators/note.validators.js";

const noteRouter = Router();

noteRouter.post(
  "/add",
  requireAuth,
  requireRole(["provider"]),
  validate(addNoteSchema),
  addNote,
);
noteRouter.get(
  "/record/:record_id",
  requireAuth,
  requireRole(["provider", "patient"]),
  getNotesByRecordId,
);

export default noteRouter;
