// Semua teks yang tampil di web, disalin dari docs/CONTENT.md.
// Agent tidak boleh mengarang fakta sekolah. Nilai yang belum pasti
// berbentuk teks pengganti dan diisi pemilik proyek.

export const content = {
  meta: {
    title: 'Open House SMKIT As Syifa Boarding School',
    description:
      'Datang, lihat langsung, dan coba sendiri. Daftar hadir open house SMKIT As Syifa Boarding School, Jalancagak, Subang.',
  },

  home: {
    hero: {
      title: 'Open House SMKIT As Syifa',
      tagline: 'Datang, lihat langsung, dan coba sendiri.',
      info: `Sabtu, 07 November 2026, 08.00 sampai 15.00 WIB, Jalancagak, Subang. Gratis.`,
      cta: 'Daftar Hadir Open House',
    },

    story: [
      {
        id: 'jurusan',
        heading: 'Jurusan',
        text: 'Dengar langsung pemaparan jurusan RPL dan DKV di aula.',
      },
      {
        id: 'kelas-dan-lab',
        heading: 'Kelas dan lab',
        text: 'Lihat ruang belajarnya dan coba sendiri di lab.',
      },
      {
        id: 'asrama',
        heading: 'Asrama',
        text: 'Keliling asrama bersama panitia dan lihat tempat anak tinggal dan beristirahat.',
      },
      {
        id: 'konsultasi',
        heading: 'Konsultasi',
        text: 'Tanyakan langsung kepada guru dan panitia, mulai dari jurusan sampai pendaftaran.',
      },
    ],

    incentive: {
      heading: 'Daftar saat open house, biayanya lebih ringan',
      text: 'Biaya pendaftaran seleksi normalnya Rp500 ribu. Jika mendaftar langsung saat open house, biayanya Rp100 ribu. Jika hadir tetapi mendaftar belakangan, biayanya Rp300 ribu.',
      note: 'Ini adalah biaya pendaftaran seleksi, bukan biaya pendidikan.',
    },

    eventInfo: {
      openMap: 'Buka Google Maps',
      addCalendar: 'Tambah ke kalender',
    },

    rundown: {
      heading: 'Susunan Acara',
      tagline: 'Jadwal kegiatan open house dari pagi hingga selesai.',
      items: [
        { time: '08:00 - 08:30', title: 'Registrasi dan Penyambutan', desc: 'Registrasi ulang kehadiran peserta serta pembagian panduan open house.' },
        { time: '08:30 - 09:30', title: 'Pemaparan Sekolah dan Jurusan', desc: 'Pengenalan kurikulum boarding school serta keunggulan jurusan RPL dan DKV di aula.' },
        { time: '09:30 - 11:30', title: 'Tur Kampus dan Praktik Lab', desc: 'Kunjungan langsung ke ruang kelas, laboratorium komputer dan desain, serta asrama santri.' },
        { time: '11:30 - 13:00', title: 'Ishoma', desc: 'Salat berjamaah di masjid kampus dan istirahat siang bersama.' },
        { time: '13:00 - 14:30', title: 'Konsultasi PMB dan Pendaftaran', desc: 'Konsultasi langsung dengan tim admisi dan guru, serta layanan pendaftaran seleksi berinsentif.' },
        { time: '14:30 - 15:00', title: 'Ramah Tamah dan Penutupan', desc: 'Sesi penutupan open house dan pembagian cinderamata.' },
      ],
    },

    form: {
      heading: 'Daftar hadir',
      tagline: 'Cukup dua langkah, tidak sampai satu menit.',
      progress: ['Data anak', 'Kehadiran'],
    },

    footer: {
      text: 'Ada pertanyaan sebelum datang? Hubungi admisi lewat WhatsApp.',
      cta: 'Chat admisi',
    },
  },

  form: {
    stepOne: [
      {
        id: 'child_name',
        label: 'Nama anak',
        helper: 'Nama calon siswa',
      },
      {
        id: 'parent_phone',
        label: 'Nomor HP orang tua atau wali',
        helper: 'Nomor ini yang akan kami hubungi lewat WhatsApp.',
      },
      {
        id: 'parent_name',
        label: 'Nama orang tua atau wali',
        helper: 'Boleh dikosongkan.',
      },
    ],
    stepTwo: [
      {
        id: 'attendee_count',
        label: 'Jumlah yang akan hadir',
        helper: 'Hitung termasuk anak.',
      },
      {
        id: 'city',
        label: 'Asal kota atau kabupaten',
        example: 'Subang',
      },
      {
        id: 'school',
        label: 'Asal sekolah',
        example: 'SMP Negeri 1 Subang',
      },
      {
        id: 'interest_major',
        label: 'Minat jurusan',
        options: ['RPL', 'DKV', 'Belum tahu'],
        helper: 'Boleh dikosongkan.',
      },
    ],
    consent: {
      text: 'Saya setuju dihubungi lewat WhatsApp oleh pihak SMKIT As Syifa terkait open house dan pendaftaran. Data saya hanya dipakai untuk keperluan itu.',
      linkText: 'Kebijakan privasi',
      linkHref: '/privasi',
    },
    buttons: {
      next: 'Lanjut',
      back: 'Kembali',
      submit: 'Kirim pendaftaran',
      submitting: 'Mengirim...',
    },
    majors: {
      rpl: 'RPL',
      dkv: 'DKV',
      belum_tahu: 'Belum tahu',
    },
  },

  errors: {
    required: 'Bagian ini perlu diisi.',
    name_short: 'Nama minimal 2 huruf.',
    phone: 'Nomor HP belum sesuai. Contoh yang benar: 081234567890.',
    attendee_count: 'Pilih jumlah antara 1 dan 10.',
    consent: 'Centang dulu persetujuan agar kami boleh menghubungi.',
    turnstile: 'Pemeriksaan keamanan belum selesai. Coba lagi sebentar.',
    server: 'Pendaftaran belum terkirim. Silakan coba lagi, atau hubungi admisi lewat WhatsApp.',
    closed: 'Pendaftaran online sudah ditutup. Silakan hubungi admisi.',
  },

  thankyou: {
    title: 'Terima kasih, pendaftaran sudah kami terima',
    withSummary: 'Kami tunggu {nama anak} dan {jumlah hadir} orang di open house pada Sabtu 07 November 2026, pukul 08.00 sampai 15.00 WIB.',
    withoutSummary: 'Kami tunggu Bapak dan Ibu di open house pada Sabtu 07 November 2026, pukul 08.00 sampai 15.00 WIB.',
    nextSteps: {
      joinWa: 'Gabung WhatsApp Open House',
      waChannelNote:
        'Saluran ini satu arah, nomor Bapak atau Ibu tidak terlihat oleh orang lain.',
      waGroupNote:
        'Di grup, anggota lain dapat melihat nomor Bapak atau Ibu. Bergabung bersifat pilihan.',
      addCalendar: 'Tambah ke kalender',
      chatAdmisi: 'Chat admisi',
      pmbLink: 'Lihat info pendaftaran PMB',
    },
    note: 'Panitia akan menghubungi lewat WhatsApp untuk memastikan kehadiran.',
  },

  privacy: {
    collector: 'SMKIT As Syifa Boarding School',
    dataCollected:
      'nama anak, nomor HP orang tua, nama orang tua bila diisi, jumlah yang hadir, asal kota, asal sekolah, minat jurusan bila diisi, dan sumber kunjungan',
    purpose: 'informasi dan komunikasi open house serta pendaftaran',
    viewers: 'panitia penerimaan siswa baru',
    storageDuration: '6 bulan',
    deleteRequest: 'hubungi admisi lewat WhatsApp di nomor 0811-2222-3934',
    noSharing: 'Tidak ada data yang dijual atau dibagikan untuk iklan pihak lain.',
  },

  waMessage: {
    greeting: 'Assalamualaikum {sapaan}. Kami dari panitia Open House SMKIT As Syifa Boarding School. Terima kasih sudah mendaftarkan {nama anak}. Kami ingin memastikan data pendaftaran dan membantu jika ada yang ingin ditanyakan. Apakah ada yang bisa kami bantu?',
  },
};
