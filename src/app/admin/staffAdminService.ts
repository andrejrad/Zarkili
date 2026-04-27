import type { CreateStaffInput, StaffMember, UpdateStaffInput } from "../../domains/staff";
import type { StaffRepository } from "../../domains/staff/repository";

type UiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

function normalizeErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error) || !error.message.trim()) {
    return fallback;
  }

  const lower = error.message.toLowerCase();
  if (lower.includes("cross-tenant")) {
    return "You do not have permission to access data outside your tenant.";
  }

  if (lower.includes("not found")) {
    return "The requested staff record was not found.";
  }

  if (lower.includes("required") || lower.includes("is invalid") || lower.includes("must be")) {
    return "Please fill in all required fields correctly.";
  }

  return fallback;
}

export function createStaffAdminService(input: { staffRepository: StaffRepository }) {
  const { staffRepository } = input;

  async function readStaffList(tenantId: string, locationId: string): Promise<UiResult<StaffMember[]>> {
    try {
      const members = await staffRepository.listLocationStaff(tenantId, locationId);
      return { ok: true, data: members };
    } catch (error) {
      return { ok: false, message: normalizeErrorMessage(error, "Unable to load staff list right now.") };
    }
  }

  async function createStaffForTenant(
    staffId: string,
    createInput: CreateStaffInput
  ): Promise<UiResult<StaffMember>> {
    try {
      const member = await staffRepository.createStaff(staffId, createInput);
      return { ok: true, data: member };
    } catch (error) {
      return { ok: false, message: normalizeErrorMessage(error, "Unable to create staff member right now.") };
    }
  }

  async function updateStaffMember(
    staffId: string,
    tenantId: string,
    updateInput: UpdateStaffInput
  ): Promise<UiResult<void>> {
    try {
      await staffRepository.updateStaff(staffId, tenantId, updateInput);
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, message: normalizeErrorMessage(error, "Unable to update staff member right now.") };
    }
  }

  async function deactivateStaffMember(
    staffId: string,
    tenantId: string
  ): Promise<UiResult<void>> {
    try {
      await staffRepository.deactivateStaff(staffId, tenantId);
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, message: normalizeErrorMessage(error, "Unable to deactivate staff member right now.") };
    }
  }

  return {
    readStaffList,
    createStaffForTenant,
    updateStaffMember,
    deactivateStaffMember,
  };
}

export type StaffAdminService = ReturnType<typeof createStaffAdminService>;
