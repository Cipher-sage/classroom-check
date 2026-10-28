import { eq, inArray } from 'drizzle-orm';
import { getAdminUser } from '../../auth';
import { isAdmin } from '../../admin-auth';
import { getDb } from '../../../db';
import { exams, attempts } from '../../../db/schema';

export const dynamic = 'force-dynamic';
const privateHeaders = { 'Cache-Control': 'private, no-store, max-age=0', Pragma: 'no-cache', 'Cross-Origin-Resource-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff' };

export async function GET() {
  const user = await getAdminUser();
  if (!user) return Response.json({ error: 'Please sign in to download a backup.' }, { status: 401, headers: privateHeaders });
  if (!isAdmin(user)) return Response.json({ error: 'Administrator access only.' }, { status: 403, headers: privateHeaders });
  try {
    const db = getDb();
    // D1 batch executes both owner-scoped reads in one database transaction.
    const [ownedExams, ownedAttempts] = await db.batch([
      db.select().from(exams).where(eq(exams.owner, user.userId)),
      db.select().from(attempts).where(inArray(attempts.exam, db.select({ id: exams.id }).from(exams).where(eq(exams.owner, user.userId))))
    ]);
    const exportedAt = new Date().toISOString();
    const body = { format: 'classroom-check-backup', version: 1, exportedAt, exams: ownedExams, attempts: ownedAttempts };
    return Response.json(body, { headers: { ...privateHeaders, 'Content-Disposition': `attachment; filename="cat-500-level-backup-${exportedAt.slice(0, 10)}.json"` } });
  } catch {
    return Response.json({ error: 'Backup could not be created. Please retry.' }, { status: 500, headers: privateHeaders });
  }
}
