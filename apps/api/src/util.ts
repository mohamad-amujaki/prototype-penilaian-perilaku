/**
 * util.ts — Utilitas Autentikasi dan Keamanan
 *
 * Berisi fungsi-fungsi pendukung untuk:
 * 1. Autentikasi JWT (sign/verify token)
 * 2. Hashing password dengan bcrypt
 * 3. Otorisasi berbasis peran (role-based authorization)
 * 4. Rate limiting login (anti brute-force)
 * 5. Notifikasi dalam aplikasi
 * 6. Traversal hierarki unit organisasi
 * 7. Parser CSV
 */

import type { Role } from "@app/shared";
import { eq } from "drizzle-orm";
import { db } from "./db";
import * as t from "./schema";

// Secret key untuk JWT - WAJIB diatur di environment variable saat production
if (!process.env.JWT_SECRET) {
  console.warn(
    "[SECURITY] JWT_SECRET belum diatur. Menggunakan fallback untuk development. " +
    "Di production, set JWT_SECRET ke string acak minimal 32 karakter.",
  );
}
const SECRET = process.env.JWT_SECRET ?? "dev-secret-prototype-only";

/**
 * Tipe data sesi pengguna yang dikirim ke frontend.
 * Berisi data profil dasar + daftar peran.
 */
export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  nip: string | null;
  jabatan: string | null;
  unitId: string | null;
  roles: Role[];                    // Daftar peran (bisa lebih dari satu)
  mustChangePassword: boolean;      // true jika admin mereset password
};

// ==================== GENERATOR ID & TIMESTAMP ====================

/**
 * Membuat ID unik dengan prefix.
 * Format: prefix_12 karakter random
 * Contoh: "usr_a1b2c3d4e5f6", "asg_x9y8z7w6v5u4"
 */
export function uid(prefix = "id") {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

/**
 * Mendapatkan timestamp saat ini dalam format Unix epoch (detik).
 * Digunakan untuk created_at dan updated_at di database.
 */
export function now() {
  return Math.floor(Date.now() / 1000);
}

// ==================== AUTENTIKASI JWT ====================

/**
 * Menandatangani token JWT (implementasi sederhana).
 *
 * Format token: base64url(body).signature
 * Body berisi: { sub: userId, ver: tokenVersion, exp: timestamp_kedaluwarsa }
 * Signature: HMAC-SHA256(secret + "." + body)
 *
 * Masa berlaku token: 24 jam dari waktu pembuatan.
 * Token akan di-invalidate saat password berubah (tokenVersion naik).
 */
export function signToken(payload: { sub: string; ver: number }) {
  // Buat body dengan masa berlaku 24 jam
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: now() + 60 * 60 * 24 }),
  ).toString("base64url");

  // Buat signature menggunakan HMAC-SHA256
  const sig = new Bun.CryptoHasher("sha256")
    .update(`${SECRET}.${body}`)
    .digest("base64url");

  return `${body}.${sig}`;
}

/**
 * Memverifikasi token JWT.
 * Mengembalikan payload (berisi sub/userId) jika valid, atau null jika:
 * - Token tidak ada
 * - Signature tidak cocok
 * - Token sudah kedaluwarsa
 * - Token version tidak cocok dengan database (password sudah berubah)
 */
export function verifyToken(token: string | undefined): { sub: string } | null {
  if (!token) return null;

  // Pisahkan token menjadi body dan signature
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  // Verifikasi signature
  const expected = new Bun.CryptoHasher("sha256")
    .update(`${SECRET}.${body}`)
    .digest("base64url");
  if (expected !== sig) return null;

  // Parse body dan cek masa berlaku
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      sub: string;
      ver: number;
      exp: number;
    };
    if (data.exp < now()) return null; // Token sudah kedaluwarsa

    // Cek token version di database — jika tidak cocok, password sudah berubah
    const user = db.select().from(t.users).where(eq(t.users.id, data.sub)).get();
    if (!user || user.tokenVersion !== data.ver) return null;

    return { sub: data.sub };
  } catch {
    return null; // Token malformed, tolak
  }
}

// ==================== LOAD USER ====================

/**
 * Memuat data pengguna dari database berdasarkan ID.
 * Mengembalikan SessionUser jika pengguna aktif, atau null jika:
 * - Pengguna tidak ditemukan
 * - Pengguna tidak aktif (is_active = 0)
 */
export function loadUser(userId: string): SessionUser | null {
  // Ambil data pengguna
  const user = db.select().from(t.users).where(eq(t.users.id, userId)).get();
  if (!user || !user.isActive) return null;

  // Ambil daftar peran pengguna
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

// ==================== OTORISASI ====================

/**
 * Mengecek apakah pengguna memiliki peran tertentu.
 * Mengembalikan true jika ya, false jika tidak.
 */
export function hasRole(user: SessionUser, role: Role) {
  return user.roles.includes(role);
}

/**
 * Memastikan pengguna memiliki salah satu peran yang diizinkan.
 * Melempar error 401 jika pengguna null (belum login).
 * Melempar error 403 jika pengguna tidak memiliki peran yang diperlukan.
 */
export function requireRole(user: SessionUser | null, roles: Role[]) {
  if (!user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  if (!roles.some((r) => user.roles.includes(r))) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
  return user;
}

// ==================== PASSWORD ====================

/** Password default untuk akun baru atau setelah reset: "Password1" */
export const DEFAULT_PASSWORD = "Password1";

/**
 * Meng-hash password menggunakan bcrypt dengan cost factor 10.
 * Cost 10 berarti 2^10 = 1024 iterasi hashing (cukup aman untuk produksi).
 */
export async function hashPassword(plain: string) {
  return Bun.password.hash(plain, { algorithm: "bcrypt", cost: 10 });
}

// ==================== RATE LIMITING LOGIN ====================

/** Durasi jendela rate limiting: 15 menit (dalam milidetik) */
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/** Maksimal percobaan login gagal sebelum dikunci: 5 kali */
const LOGIN_MAX_FAIL = 5;

/**
 * Penyimpanan sementara percobaan login gagal (di memori).
 * Struktur: Map<"email|ip", { n: jumlah_gagal, reset: waktu_reset }>
 */
const loginAttempts = new Map<string, { n: number; reset: number }>();

/**
 * Membuat kunci unik untuk rate limiting berdasarkan email dan IP.
 * Format: "email|ip" (contoh: "user@email.com|192.168.1.1")
 */
export function loginAttemptKey(email: string, ip: string) {
  return `${email.toLowerCase()}|${ip}`;
}

/**
 * Mengecek apakah login diizinkan untuk kunci tertentu.
 * Melempar error 429 (Too Many Requests) jika sudah mencapai batas.
 */
export function assertLoginAllowed(key: string) {
  const rec = loginAttempts.get(key);
  if (rec && rec.reset > Date.now() && rec.n >= LOGIN_MAX_FAIL) {
    // Hitung sisa waktu kunci dalam menit
    const mins = Math.max(1, Math.ceil((rec.reset - Date.now()) / 60000));
    throw Object.assign(
      new Error(
        `Terlalu banyak percobaan login gagal. Coba lagi dalam ${mins} menit, atau minta admin reset password ke default.`,
      ),
      { status: 429 },
    );
  }
}

/**
 * Mencatat percobaan login gagal.
 * Jika ini gagal pertama atau jendela sudah reset, mulai hitungan baru.
 * Jika belum, tambahkan jumlah gagal.
 */
export function recordFailedLogin(key: string) {
  const tnow = Date.now();
  const rec = loginAttempts.get(key);
  if (!rec || rec.reset < tnow) {
    // Mulai hitungan baru
    loginAttempts.set(key, { n: 1, reset: tnow + LOGIN_WINDOW_MS });
    return;
  }
  rec.n += 1;
}

/**
 * Menghapus catatan percobaan login untuk kunci tertentu.
 * Dipanggil setelah login berhasil.
 */
export function clearLoginAttempts(key: string) {
  loginAttempts.delete(key);
}

/**
 * Menghapus semua catatan percobaan login untuk email tertentu.
 * Dipanggil saat admin mereset password pengguna.
 */
export function clearLoginAttemptsForEmail(email: string) {
  const prefix = `${email.toLowerCase()}|`;
  for (const k of [...loginAttempts.keys()]) {
    if (k.startsWith(prefix)) loginAttempts.delete(k);
  }
}

// ==================== NOTIFIKASI ====================

/**
 * Membuat notifikasi baru di database.
 * Digunakan untuk memberitahu pengguna tentang perubahan status.
 *
 * Tipe notifikasi yang tersedia:
 * - period_active: periode penilaian diaktifkan
 * - deadline_reminder: pengingat deadline
 * - result_ready: hasil penilaian tersedia
 * - result_revised: penilaian direvisi
 * - period_closed: periode ditutup
 */
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

// ==================== CSRF PROTECTION ====================

/** Nama cookie dan header CSRF */
export const CSRF_COOKIE = "pp_csrf";
export const CSRF_HEADER = "x-csrf-token";

/**
 * Membuat token CSRF acak (32 bytes hex).
 * Disimpan di cookie yang bisa dibaca JS, dikirim ulang sebagai header.
 */
export function generateCsrfToken(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

/**
 * Memvalidasi CSRF token (double-submit cookie pattern).
 * Membandingkan nilai cookie dengan header X-CSRF-Token.
 * Melempar error 403 jika tidak cocok.
 */
export function assertCsrf(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieToken = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${CSRF_COOKIE}=`))
    ?.slice(CSRF_COOKIE.length + 1);
  const headerToken = request.headers.get(CSRF_HEADER);
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw Object.assign(new Error("CSRF token tidak valid"), { status: 403 });
  }
}

// ==================== HIERARKI UNIT ====================

/** Cache hierarki unit: Map<rootId, Set<descendantIds>> */
const unitHierarchyCache = new Map<string, Set<string>>();

/**
 * Invalidasi cache hierarki unit (panggil saat unit ditambah/diubah).
 */
export function invalidateUnitHierarchyCache() {
  unitHierarchyCache.clear();
}

/**
 * Mendapatkan semua ID unit yang merupakan keturunan dari unit induk tertentu.
 * Menggunakan BFS (Breadth-First Search) untuk traversal hierarki.
 * Hasil di-cache per rootId agar tidak query berulang.
 *
 * Contoh: Jika unit_kinerja memiliki child unit_analisa,
 * maka descendantUnitIds("unit_kinerja") = {"unit_kinerja", "unit_analisa"}
 *
 * Digunakan untuk otorisasi pimpinan: mereka hanya bisa melihat unit di bawah mereka.
 */
export function descendantUnitIds(rootId: string): Set<string> {
  const cached = unitHierarchyCache.get(rootId);
  if (cached) return cached;

  const all = db.select().from(t.units).all();
  const ids = new Set<string>([rootId]);
  let changed = true;

  // Loop sampai tidak ada unit baru yang ditambahkan
  while (changed) {
    changed = false;
    for (const u of all) {
      // Jika unit ini parent-nya sudah ada di set, tambahkan unit ini juga
      if (u.parentUnitId && ids.has(u.parentUnitId) && !ids.has(u.id)) {
        ids.add(u.id);
        changed = true;
      }
    }
  }

  unitHierarchyCache.set(rootId, ids);
  return ids;
}

// ==================== PARSER CSV ====================

/**
 * Parser CSV sederhana tanpa library eksternal.
 *
 * Mendukung:
 * - Koma sebagai delimiter
 * - Kutip ganda ("") untuk escape karakter khusus
 * - Baris kosong dilewati
 * - Karakter \r (Windows line ending) diabaikan
 *
 * Contoh input:
 *   "NIP","Nama","Email"
 *   199001011234567890,"Budi Pratama","budi@demo.go.id"
 *
 * Mengembalikan: array of array of string (rows of cells)
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";          // Current cell value
  let q = false;         // Inside quoted string?

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (q) {
      // Inside quoted string
      if (ch === '"' && text[i + 1] === '"') {
        // Escaped quote ("") → tambahkan satu kutip
        cur += '"';
        i++;
      } else if (ch === '"') {
        q = false; // End of quoted string
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      q = true; // Start of quoted string
    } else if (ch === ",") {
      // Delimiter: simpan cell dan mulai cell baru
      row.push(cur.trim());
      cur = "";
    } else if (ch === "\n") {
      // Newline: simpan cell terakhir dan baris ini selesai
      row.push(cur.trim());
      if (row.some((c) => c.length)) rows.push(row); // Skip baris kosong
      row = [];
      cur = "";
    } else if (ch !== "\r") {
      // Karakter biasa (abaikan \r)
      cur += ch;
    }
  }

  // Handle baris terakhir (tanpa newline di akhir)
  if (cur.length || row.length) {
    row.push(cur.trim());
    if (row.some((c) => c.length)) rows.push(row);
  }

  return rows;
}
