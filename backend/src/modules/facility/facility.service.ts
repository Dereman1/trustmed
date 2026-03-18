import { AppError } from "../../core/errors/app-error.js";
import { SupabaseRepository } from "../../core/supabase/repository.js";
import type {
  CreateFacilityBody,
  Facility,
  UpdateFacilityBody,
} from "../../types/facility.types.js";

const facilityRepository = new SupabaseRepository<Facility>("facilities");

export const facilityService = {
  async list(limit = 100): Promise<Facility[]> {
    return facilityRepository.list({
      limit,
      orderBy: "created_at",
      ascending: false,
    });
  },

  async getById(id: string): Promise<Facility> {
    const facility = await facilityRepository.findById(id);
    if (!facility) {
      throw new AppError("Facility not found", 404);
    }
    return facility;
  },

  async create(payload: CreateFacilityBody): Promise<Facility> {
    return facilityRepository.create({
      facility_name: payload.facility_name,
      address: payload.address ?? null,
      contact_phone: payload.contact_phone ?? null,
      verification_docs: payload.verification_docs ?? null,
      status: "pending",
    });
  },

  async approve(id: string): Promise<Facility> {
    const existing = await facilityRepository.findById(id);
    if (!existing) throw new AppError("Facility not found", 404);
    return facilityRepository.update(id, { status: "approved" });
  },

  async listPending(): Promise<Facility[]> {
    return facilityRepository.listWhere({
      where: { status: "pending" },
      orderBy: "created_at",
      ascending: false,
      limit: 100,
    });
  },

  async update(id: string, payload: UpdateFacilityBody): Promise<Facility> {
    const existing = await facilityRepository.findById(id);
    if (!existing) {
      throw new AppError("Facility not found", 404);
    }
    return facilityRepository.update(id, {
      ...payload,
      verification_docs:
        payload.verification_docs ?? existing.verification_docs ?? null,
    });
  },

  async remove(id: string): Promise<void> {
    const existing = await facilityRepository.findById(id);
    if (!existing) {
      throw new AppError("Facility not found", 404);
    }
    await facilityRepository.remove(id);
  },
};
