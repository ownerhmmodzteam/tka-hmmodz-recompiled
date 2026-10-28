# TKAORA v2.1 — Vercel Serverless

Website latihan TKA dengan katalog 14 materi, pratinjau PDF di dalam website, dan simulasi 15 soal. Tidak ada sistem poin, level, kredit, atau leaderboard.

## Deploy ke Vercel

1. Upload/push seluruh isi folder ini ke repository GitHub.
2. Di Vercel pilih **Add New → Project**, impor repository tersebut.
3. Framework Preset: **Other**. Build Command dan Output Directory dapat dikosongkan; `vercel.json` mengatur routing.
4. Klik **Deploy**. API serverless tersedia di `/api/health` dan `/api/materials`.

## PDF materi (tanpa redirect saat membaca)

Masukkan file PDF yang memang boleh digunakan ke `public/pdfs/` dengan nama `tka-01.pdf` sampai `tka-14.pdf`. Pada entri terkait di `materials.json`, ubah `hasPdf` menjadi `true` (tambahkan properti tersebut), lalu commit dan deploy ulang. File yang tersedia akan dibuka di viewer website melalui URL `/pdfs/tka-01.pdf`, bukan dialihkan ke Google Drive. Arsip source ini tidak menyertakan PDF sumber; file Google Drive tidak otomatis diunduh atau disalin.

## Progres belajar

Karena Vercel Functions tidak menyediakan filesystem permanen untuk penyimpanan aplikasi, catatan materi tersimpan di `localStorage` browser/perangkat pengguna. Catatan tidak tersinkron otomatis lintas perangkat atau browser. Jika perlu sinkronisasi akun, hubungkan database seperti Vercel Postgres, Neon, atau Supabase.

## Uji lokal di Termux

```bash
pkg install nodejs-lts git -y
npm install
npx vercel dev
```

Buka URL lokal yang ditampilkan CLI. Untuk menjalankan server Express lokal lama, gunakan `npm start` (API progres server lokal berbeda dari mode Vercel).

## Struktur penting

- `public/` — frontend, CSS, JS, soal latihan, dan aset PDF
- `api/materials.js` — Vercel Function untuk katalog materi
- `api/health.js` — endpoint status
- `materials.json` — katalog 14 materi dan tautan sumber
- `public/questions.json` — 15 soal latihan orisinal beserta pembahasan
- `vercel.json` — konfigurasi build dan routing Vercel
