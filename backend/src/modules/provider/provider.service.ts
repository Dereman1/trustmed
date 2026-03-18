import type { User } from "@supabase/supabase-js";
import { AppError } from "../../core/errors/app-error.js";
import { supabaseService } from "../../config/supabase.js";
import { SupabaseRepository } from "../../core/supabase/repository.js";
import type {
  CreateProviderBody,
  Provider,
  UpdateProviderBody,
} from "../../types/provider.types.js";
const providerRepository = new SupabaseRepository<Provider>("providers");

export const providerService = {
  async listByFacility(facilityId: string): Promise<Provider[]> {
    return providerRepository.listWhere({
      where: { facility_id: facilityId },
      orderBy: "created_at",
      ascending: false,
      limit: 100,
    });
  },


  async getByUserId(userId: string): Promise<Provider | null> {
    const rows = await providerRepository.listWhere({
      where: { user_id: userId },
      limit: 1,
    });
    return rows[0] ?? null;
  },

  async getMyProfile(user: User): Promise<Provider> {
    const provider = await this.getByUserId(user.id);
    if (!provider) {
      throw new AppError(
        "Provider profile not found. Register as a provider first.",
        404,
      );
    }
    return provider;
  },

  async getProviderById(providerId: string): Promise<Provider> {
    const provider = await providerRepository.findById(providerId);
    if (!provider) {
      throw new AppError("Provider not found", 404);
    }
    return provider;
  },

  async create(payload: CreateProviderBody): Promise<Provider> {
    const tempPassword =
      payload.temporary_password ||
      Math.random().toString(36).slice(-10) + "A1!";

    // 1. Create Auth User
    const { data: authData, error: authError } =
      await supabaseService.auth.admin.createUser({
        email: payload.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          role: "provider",
          must_change_password: true,
        },
      });

    if (authError || !authData.user) {
      throw new AppError(
        "Failed to create provider user",
        400,
        authError?.message,
      );
    }

    const userId = authData.user.id;

    // 2. Create Profile
    const { error: profileError } = await supabaseService
      .from("profiles")
      .upsert({
        id: userId,
        email: payload.email,
        role: "provider",
      });

    if (profileError) {
      throw new AppError(
        "Failed to create provider profile",
        500,
        profileError.message,
      );
    }

    // 3. Create Provider record
    return providerRepository.create({
      user_id: userId,
      facility_id: payload.facility_id ?? null,
      specialization: payload.specialization ?? null,
      license_number: payload.license_number ?? null,
      verification_docs: payload.verification_docs ?? null,
      status: "pending",
    });
  },

 async update(id: string, payload: UpdateProviderBody): Promise<Provider> {
      const existing = await providerRepository.findById(id);
      if (!existing) {
        throw new AppError("Provider not found", 404);
      }
      return providerRepository.update(id, {
        ...payload,
        verification_docs: payload.verification_docs ?? existing.verification_docs ?? null,
      });
    },
  async updateMyProfile(
    user: User,
    payload: UpdateProviderBody,
  ): Promise<Provider> {
    const existing = await this.getMyProfile(user);
    return providerRepository.update(existing.id, payload);
  },

  async approveProvider(adminUser: User, providerId: string): Promise<Provider> {
    const provider = await this.getProviderById(providerId);
    return providerRepository.update(providerId, { status: "approved" });
  },

  async listPending(): Promise<Provider[]> {
    return providerRepository.listWhere({
      where: { status: "pending" },
      orderBy: "created_at",
      ascending: false,
      limit: 100,
    });
  },

  async getProviderStats(user: User): Promise<{
    total_records: number;
    total_messages: number;
    total_notes: number;
    total_patients: number;
  }> {
    const provider = await this.getMyProfile(user);

    // Count total patients (granted access)
    const { count: patientCount } = await supabaseService
      .from("access_permissions")
      .select("*", { count: "exact", head: true })
      .eq("provider_id", provider.id)
      .eq("status", "granted");

    // Count total messages (sent OR received by this provider)
    const { count: messageCount } = await supabaseService
      .from("messages")
      .select("*", { count: "exact", head: true })
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    // Count total notes created by this provider
    const { count: noteCount } = await supabaseService
      .from("consultation_notes")
      .select("*", { count: "exact", head: true })
      .eq("provider_id", provider.id);

    // Count total records accessible to the provider
    const accessiblePatients = await supabaseService
      .from("access_permissions")
      .select("patient_id")
      .eq("provider_id", provider.id)
      .eq("status", "granted");

    const patientIds = accessiblePatients.data?.map(p => p.patient_id) ?? [];
    
    let recordCount = 0;
    if (patientIds.length > 0) {
      const { count } = await supabaseService
        .from("medical_records")
        .select("*", { count: "exact", head: true })
        .in("patient_id", patientIds);
      recordCount = count ?? 0;
    }

    return {
      total_records: recordCount,
      total_messages: messageCount ?? 0,
      total_notes: noteCount ?? 0,
      total_patients: patientCount ?? 0,
    };
  },
};
