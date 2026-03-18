import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../core/errors/app-error.js";
import { formatZodIssues } from "../core/http/zod-error.js";

type RequestShape = {
  body?: unknown;
  params?: unknown;
  query?: unknown;
};

type RequestSchema = ZodType<RequestShape>;

export function validate(schema: RequestSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const payload: RequestShape = {
      body: req.body,
      params: req.params,
      query: req.query,
    };

    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      return next(
        new AppError("Validation failed", 422, {
          issues: formatZodIssues(parsed.error.issues),
        }),
      );
    }

    if (parsed.data.body !== undefined) {
      req.body = parsed.data.body;
    }

    if (parsed.data.params && typeof parsed.data.params === "object") {
      Object.assign(req.params, parsed.data.params as Record<string, string>);
    }

    if (parsed.data.query && typeof parsed.data.query === "object") {
      Object.assign(req.query as Record<string, unknown>, parsed.data.query);
    }

    return next();
  };
}
