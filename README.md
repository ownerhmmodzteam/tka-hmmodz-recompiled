# TKAORA v2.2

Website latihan TKA: katalog 14 materi, pembaca PDF di dalam website, latihan 15 soal, dan catatan belajar pribadi. Tanpa poin, level, atau peringkat.

## Deploy ke Vercel

1. Push seluruh isi folder ini ke root repository GitHub (`app.js` harus ada di root).
2. Import repository di Vercel. Framework akan terdeteksi sebagai **Express**; biarkan Build Command dan Output Directory kosong.
3. Deploy.

`app.js` adalah satu-satunya entrypoint: ia mengimpor Express, menyajikan folder `public/`, dan menyediakan `/api/health` dan `/api/materials`.

## Jalankan lokal

```bash
npm install
npm start
```

Buka `http://localhost:8080`.

## Menambah PDF materi

1. Simpan file ke `public/pdfs/` dengan nama `tka-01.pdf` sampai `tka-14.pdf`.
2. Di `materials.json`, ubah `"hasPdf": false` menjadi `true` pada materi terkait.
3. Commit dan deploy ulang.

## Catatan belajar

Disimpan di `localStorage` perangkat pengguna, karena Vercel tidak punya penyimpanan file permanen. Jawaban latihan yang sedang berjalan disimpan di `sessionStorage` tab. Untuk sinkronisasi antarperangkat, hubungkan database (Neon, Supabase, atau Vercel Postgres).

## Struktur

- `app.js` — server Express (entrypoint Vercel)
- `materials.json` — katalog materi dan tautan sumber
- `public/index.html`, `public/css/style.css`, `public/js/main.js` — frontend
- `public/questions.json` — 15 soal latihan beserta pembahasan
