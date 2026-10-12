import type { Priority } from '../store'

export const CHECKLIST_CATEGORIES = [
  'Planning',
  'Administrasi',
  'Venue',
  'Vendor',
  'Busana',
  'Dekorasi',
  'Undangan',
  'Seserahan',
  'Acara',
  'Kesehatan',
  'Lainnya',
]

/** offset = days relative to the wedding date (negative = before). */
export const CHECKLIST_TEMPLATE: { title: string; category: string; priority: Priority; offset: number }[] = [
  // 12 - 9 bulan
  { title: 'Diskusi konsep & tema pernikahan', category: 'Planning', priority: 'tinggi', offset: -365 },
  { title: 'Tentukan total budget & sumber dana', category: 'Planning', priority: 'tinggi', offset: -360 },
  { title: 'Tentukan tanggal akad & resepsi', category: 'Planning', priority: 'tinggi', offset: -355 },
  { title: 'Buat draft daftar tamu', category: 'Undangan', priority: 'sedang', offset: -340 },
  { title: 'Survey & booking venue', category: 'Venue', priority: 'tinggi', offset: -330 },
  { title: 'Lamaran / pertemuan keluarga', category: 'Acara', priority: 'tinggi', offset: -300 },
  { title: 'Pilih Wedding Organizer (opsional)', category: 'Vendor', priority: 'sedang', offset: -290 },
  { title: 'Booking katering & jadwalkan food tasting', category: 'Vendor', priority: 'tinggi', offset: -280 },
  { title: 'Booking fotografer & videografer', category: 'Vendor', priority: 'tinggi', offset: -270 },
  // 8 - 6 bulan
  { title: 'Booking MUA & attire (sewa/jahit)', category: 'Busana', priority: 'tinggi', offset: -240 },
  { title: 'Booking dekorasi & florist', category: 'Dekorasi', priority: 'sedang', offset: -230 },
  { title: 'Booking entertainment / band / MC', category: 'Vendor', priority: 'sedang', offset: -210 },
  { title: 'Buat moodboard dekor & palet warna', category: 'Dekorasi', priority: 'rendah', offset: -200 },
  { title: 'Pilih desain undangan (cetak & digital)', category: 'Undangan', priority: 'sedang', offset: -180 },
  { title: 'Sesi prewedding', category: 'Acara', priority: 'sedang', offset: -170 },
  // 5 - 3 bulan
  { title: 'Daftar nikah ke KUA / Catatan Sipil', category: 'Administrasi', priority: 'tinggi', offset: -120 },
  { title: 'Siapkan dokumen (KTP, KK, akta, N1-N4, foto)', category: 'Administrasi', priority: 'tinggi', offset: -115 },
  { title: 'Suntik TT & cek kesehatan pranikah', category: 'Kesehatan', priority: 'sedang', offset: -110 },
  { title: 'Kursus / bimbingan pranikah', category: 'Administrasi', priority: 'sedang', offset: -100 },
  { title: 'Pilih & pesan cincin kawin', category: 'Busana', priority: 'tinggi', offset: -100 },
  { title: 'Tentukan mahar', category: 'Seserahan', priority: 'tinggi', offset: -95 },
  { title: 'Fitting baju pertama', category: 'Busana', priority: 'sedang', offset: -90 },
  { title: 'Pesan souvenir', category: 'Vendor', priority: 'rendah', offset: -90 },
  { title: 'Finalisasi daftar tamu', category: 'Undangan', priority: 'tinggi', offset: -80 },
  // 2 - 1 bulan
  { title: 'Cetak undangan', category: 'Undangan', priority: 'sedang', offset: -60 },
  { title: 'Belanja & hias seserahan', category: 'Seserahan', priority: 'sedang', offset: -50 },
  { title: 'Sebar undangan', category: 'Undangan', priority: 'tinggi', offset: -45 },
  { title: 'Susun rundown acara bersama WO/MC', category: 'Acara', priority: 'tinggi', offset: -40 },
  { title: 'Fitting baju final', category: 'Busana', priority: 'sedang', offset: -30 },
  { title: 'Technical meeting dengan semua vendor', category: 'Vendor', priority: 'tinggi', offset: -21 },
  { title: 'Konfirmasi RSVP tamu', category: 'Undangan', priority: 'sedang', offset: -21 },
  { title: 'Siapkan seragam keluarga & panitia', category: 'Busana', priority: 'rendah', offset: -21 },
  // 2 minggu - H-1
  { title: 'Perawatan diri (facial, spa, dll)', category: 'Kesehatan', priority: 'rendah', offset: -14 },
  { title: 'Pelunasan vendor', category: 'Vendor', priority: 'tinggi', offset: -10 },
  { title: 'Siapkan amplop & tim penerima tamu', category: 'Acara', priority: 'sedang', offset: -7 },
  { title: 'Gladi resik', category: 'Acara', priority: 'tinggi', offset: -2 },
  { title: 'Pengajian / siraman / midodareni', category: 'Acara', priority: 'sedang', offset: -1 },
  { title: 'Istirahat cukup & cek barang bawaan', category: 'Kesehatan', priority: 'sedang', offset: -1 },
  // Setelah
  { title: 'Ambil buku nikah & ucapan terima kasih ke vendor', category: 'Lainnya', priority: 'rendah', offset: 7 },
]

/** Default budget categories with suggested share of the total budget (%). */
export const BUDGET_CATEGORIES: { name: string; share: number }[] = [
  { name: 'Venue', share: 20 },
  { name: 'Katering', share: 30 },
  { name: 'Dekorasi', share: 10 },
  { name: 'Busana & MUA', share: 10 },
  { name: 'Dokumentasi', share: 8 },
  { name: 'Entertainment', share: 4 },
  { name: 'Undangan & Souvenir', share: 5 },
  { name: 'Seserahan & Mahar', share: 5 },
  { name: 'Cincin', share: 4 },
  { name: 'Administrasi', share: 1 },
  { name: 'Lain-lain', share: 3 },
]

export const VENDOR_CATEGORIES = [
  'Venue',
  'Katering',
  'Wedding Organizer',
  'Dekorasi',
  'MUA',
  'Busana',
  'Fotografer',
  'Videografer',
  'Entertainment',
  'MC',
  'Undangan',
  'Souvenir',
  'Cincin',
  'Lainnya',
]

export const RUNDOWN_TEMPLATE: { time: string; title: string; pic: string }[] = [
  { time: '05:00', title: 'Rias pengantin & keluarga', pic: 'MUA' },
  { time: '07:30', title: 'Penghulu & tamu akad tiba', pic: 'WO' },
  { time: '08:00', title: 'Prosesi akad nikah', pic: 'Penghulu' },
  { time: '08:45', title: 'Sungkeman & foto keluarga', pic: 'Fotografer' },
  { time: '09:30', title: 'Istirahat & ganti busana', pic: 'MUA' },
  { time: '11:00', title: 'Resepsi dimulai - kirab pengantin', pic: 'MC' },
  { time: '11:15', title: 'Sambutan & doa', pic: 'MC' },
  { time: '11:30', title: 'Ramah tamah & makan', pic: 'Katering' },
  { time: '12:30', title: 'Sesi foto bersama tamu', pic: 'Fotografer' },
  { time: '13:30', title: 'Resepsi selesai', pic: 'WO' },
]

export const SESERAHAN_TEMPLATE = [
  'Mahar',
  'Seperangkat alat sholat',
  'Al-Quran',
  'Perhiasan',
  'Tas',
  'Sepatu / sandal',
  'Pakaian / kain',
  'Pakaian dalam',
  'Skincare',
  'Make up',
  'Parfum',
  'Perlengkapan mandi',
  'Kue / buah',
]

export const PALETTE_PRESETS: { name: string; desc: string; colors: { name: string; hex: string }[] }[] = [
  {
    name: 'Garden Fresh & Warm Champagne',
    desc: 'Rona hijau botani dengan kemilau gading sutra dan aksen emas klasik.',
    colors: [
      { name: 'Sage Pine', hex: '#44684D' },
      { name: 'Ivory Silk', hex: '#FAF1EA' },
      { name: 'Warm Gold', hex: '#D4A359' },
      { name: 'Aged Teak', hex: '#735C40' },
    ],
  },
  {
    name: 'Dusty Rose Romance',
    desc: 'Merah muda pudar yang lembut berpadu krem dan mauve hangat.',
    colors: [
      { name: 'Dusty Rose', hex: '#C98B8B' },
      { name: 'Blush', hex: '#F2D7D5' },
      { name: 'Cream', hex: '#FBF5EE' },
      { name: 'Mauve', hex: '#8E6170' },
    ],
  },
  {
    name: 'Terracotta Sunset',
    desc: 'Nuansa bumi hangat: terakota, pasir, dan hijau zaitun.',
    colors: [
      { name: 'Terracotta', hex: '#BC5B3A' },
      { name: 'Sand', hex: '#E8D5BC' },
      { name: 'Olive', hex: '#7A7F4E' },
      { name: 'Cocoa', hex: '#5A3A2E' },
    ],
  },
  {
    name: 'Royal Navy & Gold',
    desc: 'Elegan dan formal: biru navy pekat dengan emas dan putih mutiara.',
    colors: [
      { name: 'Navy', hex: '#1F2E4A' },
      { name: 'Gold', hex: '#C9A24A' },
      { name: 'Pearl', hex: '#F6F3EC' },
      { name: 'Slate', hex: '#6B7489' },
    ],
  },
  {
    name: 'Rustic Boho',
    desc: 'Pampas, kayu, dan tanah liat untuk suasana outdoor yang santai.',
    colors: [
      { name: 'Pampas', hex: '#E9DCC6' },
      { name: 'Clay', hex: '#B07A5A' },
      { name: 'Driftwood', hex: '#8C7A68' },
      { name: 'Moss', hex: '#5E6B4E' },
    ],
  },
  {
    name: 'Sakura Lavender',
    desc: 'Ungu lavender lembut dengan pink sakura dan putih bersih.',
    colors: [
      { name: 'Lavender', hex: '#B9A7D1' },
      { name: 'Sakura', hex: '#F3C6D3' },
      { name: 'Snow', hex: '#FCFAFB' },
      { name: 'Plum', hex: '#6D4C7D' },
    ],
  },
  {
    name: 'Classic Black Tie',
    desc: 'Monokrom modern dengan sentuhan champagne.',
    colors: [
      { name: 'Onyx', hex: '#1C1C1C' },
      { name: 'Champagne', hex: '#E7D3B0' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Smoke', hex: '#8A8580' },
    ],
  },
  {
    name: 'Tropical Emerald',
    desc: 'Zamrud tropis, peach segar, dan krem pantai.',
    colors: [
      { name: 'Emerald', hex: '#1F6F5C' },
      { name: 'Peach', hex: '#F4B89A' },
      { name: 'Shell', hex: '#F7EFE4' },
      { name: 'Palm', hex: '#3E5D3A' },
    ],
  },
]
