/**
 * Types pour le module HR (Human Resources)
 * Gestion des employés, rôles, permissions et invitations
 */

// ─── Permission ──────────────────────────────────────────────────────────────

export interface Permission {
  id: string;
  codename: string;
  label: string;
  module: string;
}

// ─── Role ────────────────────────────────────────────────────────────────────

export interface Role {
  id: string;
  name: string;
  organization: string;
  permissions: Permission[];
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  permission_ids: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permission_ids?: string[];
}

// ─── Employee ────────────────────────────────────────────────────────────────

export interface EmployeeUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  phone: string;
}

export interface Employee {
  id: string;
  user: EmployeeUser;
  employee_id: string;
  created_at: string;
  updated_at: string;
}

// ─── Membership ──────────────────────────────────────────────────────────────

export interface Membership {
  id: string;
  employee: Employee;
  organization: string;
  role: Role | null;
  extra_permissions: Permission[];
  all_permissions: string[];  // Liste des codenames
  is_active: boolean;
  joined_at: string;
  created_at: string;
}

export interface UpdateMembershipData {
  role_id?: string | null;
  extra_permission_ids?: string[];
  is_active?: boolean;
}

// Type pour les memberships de l'utilisateur connecté (avec infos org)
export interface MyMembershipOrganization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  is_active: boolean;
}

export interface MyMembership {
  id: string;
  organization: MyMembershipOrganization;
  role: Role | null;
  extra_permissions: Permission[];
  all_permissions: string[];  // Liste des codenames
  is_active: boolean;
  joined_at: string;
  created_at: string;
}

// ─── Invitation ──────────────────────────────────────────────────────────────

export interface InvitationOrganization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export interface InvitationInvitedBy {
  email: string;
  first_name: string;
  last_name: string;
}

export interface Invitation {
  id: string;
  email: string;
  organization: InvitationOrganization;
  invited_by: InvitationInvitedBy;
  role: Role | null;
  permissions: Permission[];
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface CreateInvitationData {
  email: string;
  role_id?: string | null;
  permission_ids?: string[];
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface CreateRoleResponse {
  message: string;
  data: Role;
}

export interface UpdateRoleResponse {
  message: string;
  data: Role;
}

export interface DeleteRoleResponse {
  message: string;
}

export interface CreateInvitationResponse {
  message: string;
  data: Invitation;
}

export interface UpdateMembershipResponse {
  message: string;
  data: Membership;
}

export interface DeleteMembershipResponse {
  message: string;
}

export interface AcceptInvitationResponse {
  message: string;
  data: {
    organization: {
      id: string;
      name: string;
      slug: string;
    };
    membership_id: string;
  };
}

export interface DeclineInvitationResponse {
  message: string;
}
