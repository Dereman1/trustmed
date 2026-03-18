import { AppError } from "../../core/errors/app-error.js";
import { supabaseService } from "../../config/supabase.js";

export type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string;
  role?: string;
  fullName?: string | null;
};

export type AdminAnalytics = {
  users_count: number;
  patients_count: number;
  providers_count: number;
  facilities_count: number;
  medical_records_count: number;
  access_permissions_count: number;
};

export const adminService = {
  async listUsers(limit = 100): Promise<AdminUserRow[]> {
    const { data: users, error: usersError } = await supabaseService.auth.admin.listUsers({
      perPage: limit,
    });

    if (usersError) {
      throw new AppError("Failed to list users", 500, usersError.message);
    }

    const userIds = (users?.users ?? []).map((u) => u.id);
    if (userIds.length === 0) {
      return [];
    }

    const { data: profiles, error: profilesError } = await supabaseService
      .from("profiles")
      .select("id, fullName, role")
      .in("id", userIds);

    if (profilesError) {
      return (users?.users ?? []).map((u) => ({
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
      })) as AdminUserRow[];
    }

    const profileMap = new Map(
      (profiles as { id: string; fullName?: string; role?: string }[]).map(
        (p) => [p.id, p],
      ),
    );

    return (users?.users ?? []).map((u) => {
      const profile = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        role: profile?.role,
        fullName: profile?.fullName ?? null,
      };
    }) as AdminUserRow[];
  },

  async getAnalytics(): Promise<AdminAnalytics> {
    const [profiles, patients, providers, facilities, records, access] =
      await Promise.all([
        supabaseService.from("profiles").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
        supabaseService.from("patients").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
        supabaseService.from("providers").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
        supabaseService.from("facilities").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
        supabaseService.from("medical_records").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
        supabaseService.from("access_permissions").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
      ]);

    return {
      users_count: profiles,
      patients_count: patients,
      providers_count: providers,
      facilities_count: facilities,
      medical_records_count: records,
      access_permissions_count: access,
    };
  },

  async listAuditLogs(limit = 100, offset = 0): Promise<unknown[]> {
    const { data, error } = await supabaseService
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new AppError("Failed to list audit logs", 500, error.message);
    return (data ?? []) as unknown[];
  },
};
