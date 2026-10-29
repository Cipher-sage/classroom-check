// Class-list (roster) helpers: registration-number normalising and loose name matching.
export type RosterRow = { key: string; matric: string; name: string };

const fixTail = (s: string) => s.replace(/[OIL0-9]+$/, (r) => r.replace(/O/g, '0').replace(/[IL]/g, '1'));

// UG19/MDMD/1002, ug19-mdmd-1002, "UG19 MDMD 1OO2" all become UG19MDMD1002.
export function rosterKey(input: string): string {
  return fixTail(String(input).toUpperCase().replace(/[^A-Z0-9]/g, ''));
}

export function nameTokens(input: string): string[] {
  return String(input).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['’`]/g, '').split(/[^a-z]+/).filter((t) => t.length > 1);
}

function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

const sameToken = (a: string, b: string) => a === b || (Math.min(a.length, b.length) >= 5 && distance(a, b) <= 1) || (Math.min(a.length, b.length) >= 9 && distance(a, b) <= 2);

// The student must give up to three of the names on the list (any order, small spelling slips allowed), with at most one extra name.
export function nameMatches(input: string, rosterName: string): boolean {
  const given = nameTokens(input), wanted = nameTokens(rosterName);
  if (!wanted.length) return false;
  const used = new Set<number>();
  let hits = 0;
  for (const w of wanted) {
    const i = given.findIndex((g, idx) => !used.has(idx) && sameToken(g, w));
    if (i >= 0) { used.add(i); hits++; }
  }
  return hits >= Math.min(3, wanted.length) && given.length - hits <= 1;
}

// Accepts lines like "UG00/ABCD/1001, Ada Obi Nwosu" (comma, tab, | or ; between the two parts).
export function parseRoster(text: string): { rows: RosterRow[]; skipped: number; duplicate: string | null } {
  const rows: RosterRow[] = [], seen = new Set<string>();
  let skipped = 0, duplicate: string | null = null;
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^(\S+?)\s*[,\t|;]\s*(.+)$/) || line.match(/^(\S+)\s+(.+)$/);
    if (!m) { skipped++; continue; }
    const key = rosterKey(m[1]), name = m[2].trim().replace(/^"|"$/g, '').trim();
    if (!/^[A-Z0-9]{6,30}$/.test(key) || !/\d/.test(key) || nameTokens(name).length < 1 || name.length > 150) { skipped++; continue; }
    if (seen.has(key)) { duplicate = duplicate || m[1]; continue; }
    seen.add(key);
    rows.push({ key, matric: fixTail(m[1].toUpperCase()), name });
  }
  return { rows, skipped, duplicate };
}
