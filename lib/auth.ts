import { createSupabaseServer, createSupabaseServerAdmin } from './supabase-server';

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get the currently authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getUser() {
  const supabase = await createSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Get the profile (with role) for the current user.
 * Returns null if not authenticated or profile not found.
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const user = await getUser();
  if (!user) return null;

  // Use admin client to bypass RLS and read profile
  const supabaseAdmin = await createSupabaseServerAdmin();
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

/**
 * Require authentication. Returns user or throws redirect info.
 * Use in server components or API routes.
 */
export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

/**
 * Check if the current user has one of the specified roles.
 * Returns the user profile if authorized, throws otherwise.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<UserProfile> {
  const profile = await getUserProfile();
  if (!profile) {
    throw new Error('UNAUTHORIZED');
  }
  if (!profile.is_active) {
    throw new Error('ACCOUNT_DISABLED');
  }
  if (!allowedRoles.includes(profile.role)) {
    throw new Error('FORBIDDEN');
  }
  return profile;
}

/**
 * Helper to check role hierarchy
 */
export function canManageUsers(role: UserRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function canEditContent(role: UserRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'editor';
}

export function canViewDashboard(role: UserRole): boolean {
  return true; // All roles can view
}
