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
| **Chat** | Grup chat dengan pasangan, keluarga, atau WO. Undang lewat email; anggota hanya bisa ikut chat, tidak bisa melihat data planner |
| **Pengaturan** | Detail pernikahan, link undangan digital & template pesan WA, backup/restore data, reset |

Ikon lonceng menampilkan pengingat: tugas terlambat/mendekati deadline, pembayaran jatuh tempo, dan undangan yang belum dikirim.

## Akun & penyimpanan (Supabase)

Pengguna harus **daftar / masuk** (email + password). Data planner tersimpan di tabel `planner` (satu baris JSON per akun) dan foto di bucket Storage `media`, dilindungi Row Level Security sehingga tiap akun hanya bisa membaca datanya sendiri. Login dengan akun yang sama di HP dan laptop untuk melihat data yang sama.

### Setup sekali di Supabase

1. **Buat tabel & bucket**: buka dashboard Supabase → **SQL Editor** → tempel isi `supabase/migrations/20261012000000_init.sql` → **Run**. Lalu ulangi untuk `supabase/migrations/20261013000000_chat.sql` (tabel & realtime untuk fitur Chat).
   (Atau dengan CLI: `supabase link --project-ref ebovbhmdevhxisiyhmjl` lalu `supabase db push`.)
2. **Authentication → Sign In / Providers → Email**: biarkan **Confirm email** aktif. Akses Chat ditentukan dari email akun, jadi tanpa konfirmasi orang lain bisa mendaftar memakai email yang kamu undang dan ikut membaca chat. (Untuk tes cepat boleh dimatikan sementara.)
3. **Authentication → URL Configuration**: isi **Site URL** dengan alamat Vercel kamu (misal `https://wedding-planner-xxx.vercel.app`) dan tambahkan URL yang sama di **Redirect URLs**. Link konfirmasi & reset password akan membuka alamat ini.

Konfigurasi klien ada di `.env` (URL project & publishable key, aman untuk dibagikan). `VITE_SITE_URL` opsional: isi dengan URL Vercel agar link email yang diminta dari aplikasi Android membuka website.

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

## Aplikasi Android (APK)

Project Android dibuat dengan [Capacitor](https://capacitorjs.com) di folder `android/`.

### Cara 1: otomatis lewat GitHub Actions (tanpa install apa pun)

Workflow `.github/workflows/android.yml` membangun APK setiap ada push ke `main` (atau jalankan manual di tab **Actions → Build Android APK → Run workflow**). Setelah selesai, unduh **wedding-planner-apk** di bagian *Artifacts*, ekstrak, lalu pasang `app-debug.apk` di HP (izinkan "instal dari sumber tidak dikenal").

### Cara 2: build di komputer

Butuh Node 22, JDK 21, dan Android Studio (Android SDK 36).

```bash
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# hasil: android/app/build/outputs/apk/debug/app-debug.apk
```

Atau `npx cap open android` lalu **Run** dari Android Studio ke HP yang tersambung.

Setiap mengubah kode web, jalankan lagi `npm run build && npx cap sync android` sebelum build APK.
