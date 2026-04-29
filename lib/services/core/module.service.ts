/**
 * Services pour le catalogue de modules et leurs installations par organisation.
 */

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import type {
  Module,
  ModuleCode,
  OrganizationModule,
} from "@/lib/types/core";

class ModuleCatalogService {
  /** Liste des modules actifs (catalogue public côté authentifié). */
  async getAll(): Promise<Module[]> {
    return apiClient.get<Module[]>(API_ENDPOINTS.CORE.MODULES.CATALOG);
  }
}

class OrganizationModuleService {
  /** Liste des modules installés sur une organisation. */
  async list(orgId: string): Promise<OrganizationModule[]> {
    return apiClient.get<OrganizationModule[]>(
      API_ENDPOINTS.CORE.MODULES.LIST(orgId),
    );
  }

  /** Installe un module (idempotent côté backend). */
  async install(orgId: string, moduleCode: ModuleCode): Promise<OrganizationModule> {
    return apiClient.post<OrganizationModule>(
      API_ENDPOINTS.CORE.MODULES.INSTALL(orgId),
      { module_code: moduleCode },
    );
  }

  /** Active / désactive l'installation sans la supprimer. */
  async setEnabled(
    orgId: string,
    installationId: string,
    isEnabled: boolean,
  ): Promise<OrganizationModule> {
    return apiClient.patch<OrganizationModule>(
      API_ENDPOINTS.CORE.MODULES.UPDATE(orgId, installationId),
      { is_enabled: isEnabled },
    );
  }

  /** Désinstalle complètement (supprime la ligne). */
  async uninstall(orgId: string, installationId: string): Promise<void> {
    await apiClient.delete<void>(
      API_ENDPOINTS.CORE.MODULES.UNINSTALL(orgId, installationId),
    );
  }
}

export const moduleCatalogService = new ModuleCatalogService();
export const organizationModuleService = new OrganizationModuleService();
