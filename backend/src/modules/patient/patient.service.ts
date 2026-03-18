import type { User } from "@supabase/supabase-js";
import { AppError } from "../../core/errors/app-error.js";
import { SupabaseRepository } from "../../core/supabase/repository.js";
import { supabaseService } from "../../config/supabase.js";
import type {
  CreatePatientBody,
  Patient,
  UpdatePatientBody,
} from "../../types/patient.types.js";

const patientRepository = new SupabaseRepository<Patient>("patients");

export const patientService = {
  async getByUserId(userId: string): Promise<Patient | null> {
    const rows = await patientRepository.listWhere({
      where: { user_id: userId },
      limit: 1,
    });
    return rows[0] ?? null;
  },

  async getMyProfile(user: User): Promise<Patient> {
    const patient = await this.getByUserId(user.id);
    if (!patient) {
      throw new AppError(
        "Patient profile not found. Create one first.",
        404,
      );
    }
    return patient;
  },

  async getPatientById(patientId: string): Promise<Patient> {
    const patient = await patientRepository.findById(patientId);
    if (!patient) {
      throw new AppError("Patient not found", 404);
    }
    return patient;
  },

  async create(user: User, payload: CreatePatientBody): Promise<Patient> {
    const existing = await this.getByUserId(user.id);
    if (existing) {
      throw new AppError("Patient profile already exists for this user", 400);
    }
    return patientRepository.create({
      user_id: user.id,
      date_of_birth: payload.date_of_birth ?? null,
      gender: payload.gender ?? null,
    });
  },

  async updateMyProfile(
    user: User,
    payload: UpdatePatientBody,
  ): Promise<Patient> {
    const existing = await this.getMyProfile(user);
    return patientRepository.update(existing.id, payload);
  },

  async listAllPatients(): Promise<any[]> {
    const patients = await patientRepository.listWhere({
      limit: 1000,
    });
    
    // Enrich with user profile data
    const enriched = await Promise.all(
      patients.map(async (patient) => {
        try {
          const { data: profile, error } = await supabaseService
            .from("profiles")
            .select("fullName, email")
            .eq("id", patient.user_id)
            .single();

          if (error && error.code !== 'PGRST116') {
             console.error(`Error fetching profile for patient ${patient.id}:`, error);
          } else {
             console.log(`Fetched profile for user ${patient.user_id}:`, profile);
          }

          return {
            ...patient,
            user_details: profile ? {
              fullName: profile.fullName || null,
              email: profile.email || null,
            } : null,
          };
        } catch (err) {
          console.error(`Unexpected error for patient ${patient.id}:`, err);
          return {
            ...patient,
            user_details: null,
          };
        }
      }),
    );

    return enriched;
  },
};
