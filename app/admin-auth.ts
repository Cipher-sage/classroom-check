import { getAuthConfig, type AdminUser } from './auth';
export function isAdmin(user: AdminUser | null) {
 try {
  const id = getAuthConfig().adminGithubId;
  return Boolean(user && user.githubId === id && user.userId === `github:${id}`);
 } catch { return false; }
}
