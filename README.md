# Wedding Planner 💍

Aplikasi web untuk merencanakan pernikahan dari awal sampai hari H. Dibuat dengan **React + Vite + Tailwind CSS**, siap di-deploy ke **Vercel**.

## Fitur

| Menu | Isi |
| --- | --- |
| **Beranda** | Foto pasangan, hitung mundur (hari/jam/menit/detik), detail akad & resepsi (link Google Maps), ringkasan progress, tugas minggu ini, pembayaran mendatang |
| **Undangan** | Daftar tamu (pihak wanita/pria, grup, jumlah orang), RSVP, tambah banyak sekaligus, kirim undangan via WhatsApp dengan template pesan, catat amplop/hadiah, export CSV |
| **Checklist** | Tugas dengan kategori, prioritas & deadline, template 39 tugas yang deadline-nya otomatis menyesuaikan tanggal nikah, filter & urutkan |
| **Anggaran** | Total anggaran, rencana, terpakai, sisa; pengeluaran dengan estimasi vs harga deal, DP/pelunasan, jatuh tempo; alokasi per kategori (bisa dibagi otomatis), export CSV |
| **Vendor** | Bandingkan kandidat vendor, status (survey/nego/booked), rating, kontak WhatsApp/Instagram, langsung masukkan ke anggaran |
| **Moodboard** | Banyak board, unggah foto inspirasi, catatan, palet warna (+ preset inspirasi palet), label Dekorasi/Gaun/Groom/dll, zoom |
| **Rundown** | Jadwal acara per sesi (Hari H, lamaran, siraman, …) dengan PJ, template, bisa dicetak |
| **Seserahan & Mahar** | Daftar barang, budget vs harga beli, tandai yang sudah dibeli |
| **Tabungan** | Setor/tarik, target, berapa yang perlu ditabung per bulan, grafik 6 bulan, kontribusi per orang. Saldo tampil di pojok atas |
| **Catatan** | Catatan bebas (hasil meeting vendor, kontak, dll) |
| **Pengaturan** | Detail pernikahan, link undangan digital & template pesan WA, backup/restore data, reset |

Ikon lonceng menampilkan pengingat: tugas terlambat/mendekati deadline, pembayaran jatuh tempo, dan undangan yang belum dikirim.

## Penyimpanan data

Semua data disimpan **di browser** (IndexedDB), tanpa server/database dan tanpa login. Artinya:

- Data hanya ada di perangkat & browser yang dipakai.
- Untuk pindah perangkat atau berjaga-jaga, pakai **Pengaturan → Unduh backup**, lalu **Pulihkan dari backup** di perangkat lain.

## Menjalankan di komputer

```bash
npm install
npm run dev
```

Buka http://localhost:5173.

## Deploy ke Vercel

1. Push repo ini ke GitHub.
2. Di [vercel.com/new](https://vercel.com/new), import repo ini.
3. Vercel otomatis mendeteksi **Vite**. Biarkan default (build: `npm run build`, output: `dist`), klik **Deploy**.

File `vercel.json` sudah mengatur agar semua halaman (misal `/checklist`) bisa dibuka langsung/di-refresh.

Atau lewat CLI:

```bash
npm i -g vercel
vercel --prod
```
