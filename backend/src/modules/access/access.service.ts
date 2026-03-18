import type { User } from "@supabase/supabase-js";
import { AppError } from "../../core/errors/app-error.js";
import { SupabaseRepository } from "../../core/supabase/repository.js";
import { auditLog } from "../../core/audit.js";
import { createNotification } from "../../core/notifications.js";
import { patientService } from "../patient/patient.service.js";
import { providerService } from "../provider/provider.service.js";
import { profileService } from "../profile/profile.service.js";
import type { AccessPermission } from "../../types/access.types.js";
import { ACCESS_PERMISSION_DAYS } from "../../types/access.types.js";
import { NOTIFICATION_TYPES } from "../../types/notification.types.js";

const accessRepository = new SupabaseRepository<AccessPermission>(
  "access_permissions",
);

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export const accessService = {
  async requestAccess(user: User, patientId: string): Promise<AccessPermission> {
    const provider = await providerService.getMyProfile(user);
    const patient = await patientService.getPatientById(patientId);

    const existing = await accessRepository.listWhere({
      where: { patient_id: patientId, provider_id: provider.id },
      limit: 1,
    });

    if (existing.length > 0) {
      const perm = existing[0];
      if (perm.status === "granted") {
        throw new AppError("Access already granted", 400);
      }
      if (perm.status === "pending") {
        throw new AppError("Access request already pending", 400);
      }
      if (perm.status === "revoked") {
        const updated = await accessRepository.update(perm.id, {
          status: "pending",
          granted_at: new Date().toISOString(),
          expires_at: addDays(new Date(), ACCESS_PERMISSION_DAYS),
        });
        await createNotification({
          user_id: patient.user_id,
          type: NOTIFICATION_TYPES.ACCESS_REQUESTED,
          title: "Access request",
          body: "A healthcare provider has requested access to your records.",
          metadata: { permission_id: updated.id },
        });
        await auditLog({
          user_id: user.id,
          action_type: "access_request",
          record_id: null,
          metadata: { patient_id: patientId, provider_id: provider.id },
        });
        return updated;
      }
    }

    const created = await accessRepository.create({
      patient_id: patientId,
      provider_id: provider.id,
      status: "pending",
      granted_at: new Date().toISOString(),
      expires_at: addDays(new Date(), ACCESS_PERMISSION_DAYS),
    });
    await createNotification({
      user_id: patient.user_id,
      type: NOTIFICATION_TYPES.ACCESS_REQUESTED,
      title: "Access request",
      body: "A healthcare provider has requested access to your records.",
      metadata: { permission_id: created.id },
    });
    await auditLog({
      user_id: user.id,
      action_type: "access_request",
      metadata: { patient_id: patientId, provider_id: provider.id },
    });
    return created;
  },

  async grantAccess(user: User, permissionId: string): Promise<AccessPermission> {
    const patient = await patientService.getMyProfile(user);
    const perm = await accessRepository.findById(permissionId);
    if (!perm) {
      throw new AppError("Permission not found", 404);
    }
    if (perm.patient_id !== patient.id) {
      throw new AppError("Forbidden: not your permission to grant", 403);
    }
    if (perm.status === "granted") {
      throw new AppError("Access already granted", 400);
    }
    const updated = await accessRepository.update(permissionId, {
      status: "granted",
      granted_at: new Date().toISOString(),
      expires_at: addDays(new Date(), ACCESS_PERMISSION_DAYS),
    });
    const provider = await providerService.getProviderById(perm.provider_id);
    await createNotification({
      user_id: provider.user_id,
      type: NOTIFICATION_TYPES.ACCESS_GRANTED,
      title: "Access granted",
      body: "A patient has granted you access to their medical records.",
      metadata: { permission_id: permissionId },
    });
    await auditLog({
      user_id: user.id,
      action_type: "access_grant",
      metadata: { permission_id: permissionId, provider_id: perm.provider_id },
    });
    return updated;
  },

  async revokeAccess(user: User, permissionId: string): Promise<AccessPermission> {
    const patient = await patientService.getMyProfile(user);
    const perm = await accessRepository.findById(permissionId);
    if (!perm) {
      throw new AppError("Permission not found", 404);
    }
    if (perm.patient_id !== patient.id) {
      throw new AppError("Forbidden: not your permission to revoke", 403);
    }
    return accessRepository.update(permissionId, { status: "revoked" });
  },

  async listMyPermissions(user: User): Promise<AccessPermission[]> {
    const patient = await patientService.getMyProfile(user);
    return accessRepository.listWhere({
      where: { patient_id: patient.id },
      orderBy: "granted_at",
      ascending: false,
      limit: 100,
    });
  },

  async listMyPermissionsWithProvider(user: User): Promise<any[]> {
    const permissions = await this.listMyPermissions(user);
    
    const enriched = await Promise.all(
      permissions.map(async (perm) => {
        try {
          const provider = await providerService.getProviderById(perm.provider_id);
          const profile = await profileService.getProfileByUserId(provider.user_id);
          
          return {
            ...perm,
            provider_details: {
              fullName: profile?.fullName || null,
              phone: profile?.phone || null,
              specialization: provider.specialization || null,
              license_number: provider.license_number || null,
              verification_docs: provider.verification_docs || null,
            },
          };
        } catch {
          // If provider details can't be fetched, return permission without enrichment
          return {
            ...perm,
            provider_details: {
              fullName: null,
              phone: null,
              specialization: null,
              license_number: null,
              verification_docs: null,
            },
          };
        }
      }),
    );
    
    return enriched;
  },

  async listGrantedToMe(user: User): Promise<AccessPermission[]> {
    const provider = await providerService.getMyProfile(user);
    const list = await accessRepository.listWhere({
      where: { provider_id: provider.id, status: "granted" },
      orderBy: "expires_at",
      ascending: false,
      limit: 100,
    });
    const now = new Date().toISOString();
    return list.filter((p) => p.expires_at >= now);
  },

  async canProviderAccessRecord(
    providerId: string,
    recordId: string,
    patientId: string,
  ): Promise<boolean> {
    const perms = await accessRepository.listWhere({
      where: {
        provider_id: providerId,
        patient_id: patientId,
        status: "granted",
      },
      limit: 1,
    });
    if (perms.length === 0) return false;
    const now = new Date().toISOString();
    return perms[0].expires_at >= now;
  },

  async listGrantedToMeWithPatientDetails(user: User): Promise<any[]> {
    const granted = await this.listGrantedToMe(user);

    const enriched = await Promise.all(
      granted.map(async (perm) => {
        try {
          const patient = await patientService.getPatientById(perm.patient_id);
          const profile = await profileService.getProfileByUserId(patient.user_id);

          return {
            ...perm,
            patient_details: {
              user_id: patient.user_id,
              fullName: profile?.fullName || null,
              phone: profile?.phone || null,
              date_of_birth: patient.date_of_birth || null,
              gender: patient.gender || null,
            },
          };
        } catch {
          return {
            ...perm,
            patient_details: {
              user_id: null,
              fullName: null,
              phone: null,
              date_of_birth: null,
              gender: null,
            },
          };
        }
      }),
    );

    return enriched;
  },
};
