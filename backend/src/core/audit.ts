import { supabaseService } from "../config/supabase.js";

type AuditInput = {
  user_id?: string | null;
  action_type: string;
  record_id?: string | null;
  metadata?: Record<string, unknown>;
};

export async function auditLog(input: AuditInput): Promise<void> {
  try {
    await supabaseService.from("audit_logs").insert({
      user_id: input.user_id ?? null,
      action_type: input.action_type,
      record_id: input.record_id ?? null,
      metadata: input.metadata ?? null,
    });
  } catch {
    // Non-fatal; do not throw
  }
}
