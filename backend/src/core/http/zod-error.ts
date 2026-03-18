import type { ZodIssue } from "zod";

type FormattedZodIssue = {
  path: string;
  message: string;
  code: string;
};

export function formatZodIssues(issues: ZodIssue[]): FormattedZodIssue[] {
  return issues.map((issue) => ({
    path: issue.path.length ? issue.path.join(".") : "root",
    message: issue.message,
    code: issue.code,
  }));
}
