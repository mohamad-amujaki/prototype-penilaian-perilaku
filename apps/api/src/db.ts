/**
 * db.ts — Koneksi database SQLite menggunakan Bun
 *
 * Menginisialisasi database SQLite dengan:
 * - WAL journal mode (Write-Ahead Logging) untuk performa lebih baik
 * - Foreign keys aktif untuk menjaga integritas data
 * - Drizzle ORM sebagai query builder
 *
 * Database disimpan di folder ../data/app.db relatif terhadap file ini.
 */

import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import * as schema from "./schema";

// Path database: apps/api/data/app.db
const dbPath = join(import.meta.dir, "../data/app.db");

// Buat folder data jika belum ada (recursive = buat semua parent folder)
mkdirSync(join(import.meta.dir, "../data"), { recursive: true });

// Buat koneksi SQLite dan konfigurasi
const sqlite = new Database(dbPath, { create: true });
sqlite.exec("PRAGMA journal_mode = WAL;");  // Mode WAL untuk performa concurrent read/write
sqlite.exec("PRAGMA foreign_keys = ON;");    // Aktifkan foreign key constraint

// Ekspor koneksi database dan ORM
export const db = drizzle(sqlite, { schema });
export { sqlite, schema };
