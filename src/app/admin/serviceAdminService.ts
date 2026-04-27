import type { CreateServiceInput, Service, UpdateServiceInput } from "../../domains/services";
import type { ServiceRepository } from "../../domains/services/repository";

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
    return "The requested service record was not found.";
  }

  if (
    lower.includes("required") ||
    lower.includes("must be") ||
    lower.includes("between") ||
    lower.includes("must not be empty")
  ) {
    return "Please fill in all required fields correctly.";
  }

  return fallback;
}

export function createServiceAdminService(input: { serviceRepository: ServiceRepository }) {
  const { serviceRepository } = input;

  async function readServicesList(tenantId: string): Promise<UiResult<Service[]>> {
    try {
      const services = await serviceRepository.listServicesByTenant(tenantId);
      return { ok: true, data: services };
    } catch (error) {
      return { ok: false, message: normalizeErrorMessage(error, "Unable to load services list right now.") };
    }
  }

  async function createServiceForTenant(
    serviceId: string,
    createInput: CreateServiceInput
  ): Promise<UiResult<Service>> {
    try {
      const service = await serviceRepository.createService(serviceId, createInput);
      return { ok: true, data: service };
    } catch (error) {
      return { ok: false, message: normalizeErrorMessage(error, "Unable to create service right now.") };
    }
  }

  async function updateService(
    serviceId: string,
    tenantId: string,
    updateInput: UpdateServiceInput
  ): Promise<UiResult<void>> {
    try {
      await serviceRepository.updateService(serviceId, tenantId, updateInput);
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, message: normalizeErrorMessage(error, "Unable to update service right now.") };
    }
  }

  async function archiveService(
    serviceId: string,
    tenantId: string
  ): Promise<UiResult<void>> {
    try {
      await serviceRepository.archiveService(serviceId, tenantId);
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, message: normalizeErrorMessage(error, "Unable to archive service right now.") };
    }
  }

  return {
    readServicesList,
    createServiceForTenant,
    updateService,
    archiveService,
  };
}

export type ServiceAdminService = ReturnType<typeof createServiceAdminService>;
