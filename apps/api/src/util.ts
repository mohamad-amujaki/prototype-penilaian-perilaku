import type { Role } from "@app/shared";
import { eq } from "drizzle-orm";
import { db } from "./db";
import * as t from "./schema";

const SECRET = process.env.JWT_SECRET ?? "dev-secret";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  nip: string | null;
  jabatan: string | null;
  unitId: string | null;
  roles: Role[];
  mustChangePassword: boolean;
};

export function uid(prefix = "id") {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

export function now() {
  return Math.floor(Date.now() / 1000);
}

export function signToken(payload: { sub: string }) {
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: now() + 60 * 60 * 24 }),
  ).toString("base64url");
  const sig = new Bun.CryptoHasher("sha256")
    .update(`${SECRET}.${body}`)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifyToken(token: string | undefined): { sub: string } | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = new Bun.CryptoHasher("sha256")
    .update(`${SECRET}.${body}`)
    .digest("base64url");
  if (expected !== sig) return null;
  const data = JSON.parse(Buffer.from(body, "base64url").toString()) as {
    sub: string;
    exp: number;
  };
  if (data.exp < now()) return null;
  return { sub: data.sub };
}

export function loadUser(userId: string): SessionUser | null {
  const user = db.select().from(t.users).where(eq(t.users.id, userId)).get();
  if (!user || !user.isActive) return null;
  const roles = db
    .select()
    .from(t.userRoles)
    .where(eq(t.userRoles.userId, userId))
    .all()
    .map((r) => r.role as Role);
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    nip: user.nip,
    jabatan: user.jabatan,
    unitId: user.unitId,
    roles,
    mustChangePassword: Boolean(user.mustChangePassword),
  };
}

export function hasRole(user: SessionUser, role: Role) {
  return user.roles.includes(role);
}

export function requireRole(user: SessionUser | null, roles: Role[]) {
  if (!user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  if (!roles.some((r) => user.roles.includes(r))) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
  return user;
}

export const DEFAULT_PASSWORD = "Password1";

export async function hashPassword(plain: string) {
  return Bun.password.hash(plain, { algorithm: "bcrypt", cost: 10 });
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAIL = 5;
const loginAttempts = new Map<string, { n: number; reset: number }>();

export function loginAttemptKey(email: string, ip: string) {
  return `${email.toLowerCase()}|${ip}`;
}

export function assertLoginAllowed(key: string) {
  const rec = loginAttempts.get(key);
  if (rec && rec.reset > Date.now() && rec.n >= LOGIN_MAX_FAIL) {
    const mins = Math.max(1, Math.ceil((rec.reset - Date.now()) / 60000));
    throw Object.assign(
      new Error(
        `Terlalu banyak percobaan login gagal. Coba lagi dalam ${mins} menit, atau minta admin reset password ke default.`,
      ),
      { status: 429 },
    );
  }
}

export function recordFailedLogin(key: string) {
  const tnow = Date.now();
  const rec = loginAttempts.get(key);
  if (!rec || rec.reset < tnow) {
    loginAttempts.set(key, { n: 1, reset: tnow + LOGIN_WINDOW_MS });
    return;
  }
  rec.n += 1;
}

export function clearLoginAttempts(key: string) {
  loginAttempts.delete(key);
}

export function clearLoginAttemptsForEmail(email: string) {
  const prefix = `${email.toLowerCase()}|`;
  for (const k of [...loginAttempts.keys()]) {
    if (k.startsWith(prefix)) loginAttempts.delete(k);
  }
}

export function notify(input: {
  userId: string;
  type: string;
  periodId?: string | null;
  subject: string;
  body: string;
}) {
  db.insert(t.notifications)
    .values({
      id: uid("ntf"),
      userId: input.userId,
      type: input.type,
      periodId: input.periodId ?? null,
      subject: input.subject,
      body: input.body,
      isRead: 0,
      createdAt: now(),
    })
    .run();
}

export function descendantUnitIds(rootId: string): Set<string> {
  const all = db.select().from(t.units).all();
  const ids = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const u of all) {
      if (u.parentUnitId && ids.has(u.parentUnitId) && !ids.has(u.id)) {
        ids.add(u.id);
        changed = true;
      }
    }
  }
  return ids;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      row.push(cur.trim());
      cur = "";
    } else if (ch === "\n") {
      row.push(cur.trim());
      if (row.some((c) => c.length)) rows.push(row);
      row = [];
      cur = "";
    } else if (ch !== "\r") cur += ch;
  }
  if (cur.length || row.length) {
    row.push(cur.trim());
    if (row.some((c) => c.length)) rows.push(row);
  }
  return rows;
}
