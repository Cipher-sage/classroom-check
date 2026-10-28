import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';
import { authConfig, sessionUser, type AuthConfig } from './auth-core';

export type AdminUser = { userId: string; githubId: string; displayName: string; expiresAt: number };

export function getAuthConfig(): AuthConfig {
  return authConfig(env as unknown as Record<string, unknown>);
}

export function authConfigured(): boolean {
  try { getAuthConfig(); return true; } catch { return false; }
}

export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const requestHeaders = await headers();
    return await sessionUser(requestHeaders.get('cookie'), getAuthConfig());
  } catch { return null; }
}
