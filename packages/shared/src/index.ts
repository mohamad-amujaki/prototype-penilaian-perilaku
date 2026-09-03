/**
 * @app/shared — Package berbagi kode antara backend (API) dan frontend (Web).
 *
 * Memuat semua konstanta, fungsi kalkulasi skor, dan data master
 * yang digunakan oleh kedua sisi aplikasi.
 */

// Mesin kalkulasi skor: calculateScores(), getCategory(), scoreNilai120()
export * from "./scoring";

// Konstanta: NILAI_DASAR, BARS_LEVELS, BUDAYA_KERJA, mapping kode↔ID, tipe Role
export * from "./constants";

// Data master teks: PANDUAN, ANCHORS, FEEDBACKS (dalam Bahasa Indonesia)
export * from "./master-text";
