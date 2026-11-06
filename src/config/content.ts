// Semua teks yang tampil di web, disalin dari docs/CONTENT.md.
// Agent tidak boleh mengarang fakta sekolah. Nilai yang belum pasti
// berbentuk teks pengganti dan diisi pemilik proyek.

export const content = {
  meta: {
    title: 'Open House',
    description:
      'Datang, lihat langsung, dan coba sendiri. Daftar hadir open house SMKIT As-Syifa Boarding School, Jalancagak, Subang.',
  },

  home: {
    hero: {
      title: 'Open House SMKIT As-Syifa',
      tagline: 'Datang, lihat langsung, dan coba sendiri.',
      info: 'Sabtu, 07 November 2026, 08.00 sampai 14.30 WIB, Jalancagak, Subang. Gratis.',
      cta: 'Daftar Hadir Open House',
      heroCta: 'Daftar Sekarang!',
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
        id: 'fasilitas',
        heading: 'Fasilitas',
        text: 'Lihat masjid, lobi, dan ruang belajar di lingkungan sekolah.',
      },
      {
        id: 'konsultasi',
        heading: 'Konsultasi',
        text: 'Tanyakan langsung kepada guru dan panitia, mulai dari jurusan sampai pendaftaran.',
      },
    ],

    campusBand: {
      kicker: 'Suasana sekolah',
      text: 'Kegiatan bersama di halaman sekolah.',
    },

    incentive: {
      heading: 'Daftar seleksi PMB saat open house, biayanya lebih ringan',
      text: 'Biaya pendaftaran seleksi normalnya Rp500 ribu. Jika mendaftar langsung saat open house, biayanya Rp100 ribu. Jika hadir tetapi mendaftar belakangan, biayanya Rp300 ribu.',
      laterNote: 'Sudah hadir, daftar menyusul.',
      note: 'Biaya seleksi PMB SMKIT As-Syifa',
    },

    eventInfo: {
      heading: 'Lokasi dan Informasi Acara',
      openMap: 'Buka Google Maps',
      addCalendar: 'Tambah ke kalender',
    },

    penginapan: {
      kicker: 'Penginapan',
      heading: 'Guest House As-Syifa',
      tagline: 'Nyaman menginap, tenang di hati.',
      text: '',
      note: 'Cek kamar dan pesan langsung melalui aplikasi Guest House.',
      cta: 'Buka Guest House',
      url: 'https://gh.assyifa.site/',
    },

    rundown: {
      heading: 'Susunan Acara',
      tagline: 'Jadwal kegiatan open house dari pagi hingga selesai.',
      // Ringkasan untuk peserta. Agenda internal panitia seperti persiapan,
      // briefing, jobdesk, dan perlengkapan tidak ditampilkan.
      groups: [
        {
          title: 'Registrasi dan Pembukaan',
          short: 'Registrasi',
          range: '08.00–09.45',
          items: [
            {
              time: '08.00–08.25',
              title: 'Registrasi dan penyambutan',
              location: 'Lobi Sekolah',
            },
            {
              time: '08.25–08.30',
              title: 'Peserta diarahkan ke aula',
              location: 'Aula SMK',
            },
            {
              time: '08.30–08.35',
              title: 'Pembukaan',
              location: 'Aula SMK',
            },
            {
              time: '08.35–08.40',
              title: 'Pembacaan ayat suci Al-Qur\u2019an',
              location: 'Aula SMK',
            },
            {
              time: '08.40–08.45',
              title: 'Sambutan kepala sekolah',
              location: 'Aula SMK',
            },
            {
              time: '08.45–09.00',
              title: 'Profil sekolah',
              location: 'Aula SMK',
            },
            {
              time: '09.00–09.30',
              title: 'Pengenalan jurusan RPL dan DKV',
              location: 'Aula SMK',
            },
            {
              time: '09.30–09.45',
              title: 'Pengarahan tour dan pembagian kelompok',
              location: 'Aula SMK',
            },
          ],
        },
        {
          title: 'Tour Kampus',
          short: 'Tour',
          range: '09.45–11.15',
          items: [
            {
              time: '09.45–10.15',
              title: 'Sesi 1 tour kampus',
              location: 'Sesuai kelompok',
            },
            {
              time: '10.15–10.45',
              title: 'Sesi 2 tour kampus',
              location: 'Sesuai kelompok',
            },
            {
              time: '10.45–11.15',
              title: 'Sesi 3 tour kampus',
              location: 'Sesuai kelompok',
            },
            {
              time: '11.15–11.30',
              title: 'Menuju titik kumpul di gedung sekolah',
              location: 'Gedung Sekolah',
            },
          ],
        },
        {
          title: 'Ishoma',
          short: 'Ishoma',
          range: '11.30–13.00',
          items: [
            {
              time: '11.30–11.40',
              title: 'Menuju masjid',
              location: 'Masjid',
            },
            {
              time: '11.40–12.15',
              title: 'Salat Zuhur berjamaah',
              location: 'Masjid',
            },
            {
              time: '12.15–13.00',
              title: 'Istirahat',
              location: 'Area Kampus 4',
            },
          ],
        },
        {
          title: 'Konsultasi dan Pendaftaran',
          short: 'Konsultasi',
          range: '13.00–14.25',
          items: [
            {
              time: '13.00–13.10',
              title: 'Pembukaan layanan PMB',
              location: 'Lobi Sekolah',
            },
            {
              time: '13.10–13.30',
              title: 'Sosialisasi PMB',
              location: 'Aula SMK',
            },
            {
              time: '13.30–14.15',
              title: 'Konsultasi individual',
              location: 'Aula dan Lobi',
            },
            {
              time: '14.15–14.25',
              title: 'Pendaftaran awal',
              location: 'Aula dan Lobi',
            },
          ],
        },
        {
          title: 'Penutupan',
          short: 'Penutupan',
          range: '14.25–14.30',
          items: [
            {
              time: '14.25–14.30',
              title: 'Ucapan terima kasih dan penutupan',
              location: 'Aula SMK',
            },
          ],
        },
      ],
    },

    panduan: {
      heading: 'Panduan Pengunjung',
      tagline: 'Sebelum berangkat, periksa kembali',
      lakukanTitle: 'Lakukan',
      hindariTitle: 'Hindari',
      lakukan: [
        { icon: 'shirt', text: 'Pakaian sopan dan rapi' },
        { icon: 'ticket', text: 'E-Ticket di lobi sekolah' },
        { icon: 'users', text: 'Tour asrama dengan pemandu' },
      ],
      hindari: [
        { icon: 'smoke', text: 'Rokok dan vape' },
        { icon: 'food', text: 'Makan dan minum di masjid dan lab' },
        { icon: 'tools', text: 'Peralatan lab tanpa izin' },
      ],
      moreLabel: 'Lihat panduan lengkap',
      groups: [
        {
          icon: 'parking',
          title: 'Saat tiba',
          items: [
            { icon: 'parking', text: 'Parkir di Syifa Mart atau depan Asrama 1 SMK' },
            { icon: 'ticket', text: 'Registrasi ulang di lobi sekolah' },
          ],
        },
        {
          icon: 'users',
          title: 'Saat tour',
          items: [
            { icon: 'users', text: 'Asrama hanya bersama pemandu' },
            { icon: 'door', text: 'Jangan masuk kamar tanpa izin' },
            { icon: 'child', text: 'Awasi balita yang ikut' },
          ],
        },
        {
          icon: 'mosque',
          title: 'Ibadah dan area kampus',
          items: [
            { icon: 'mosque', text: 'Salat Zuhur berjamaah pukul 11.40' },
            { icon: 'food', text: 'Makan dan minum di luar masjid mushola dan lab' },
            { icon: 'smoke', text: 'Seluruh area bebas rokok dan vape' },
          ],
        },
        {
          icon: 'book',
          title: 'Adab dan ketertiban',
          items: [
            { icon: 'speaker', text: 'Hindari klakson dan musik keras' },
            { icon: 'alert', text: 'Jangan bawa barang berbahaya' },
          ],
        },
      ],
      note: 'Ikuti arahan panitia di lokasi',
      ticket: {
        label: 'Sebelum berangkat',
        items: ['Pakaian sopan dan rapi', 'E-Ticket di lobi sekolah', 'Bebas rokok dan vape'],
        link: 'Baca panduan lengkap',
      },
    },

    form: {
      heading: 'Daftar sekarang!',
      tagline:
        'Isi form untuk bisa mendapatkan E-Ticket dan bergabung ke grup WhatsApp untuk informasi lebih lanjut.',
      progress: ['Data anak', 'Kehadiran'],
    },

    footer: {
      text: 'Ada pertanyaan sebelum datang? Hubungi admisi lewat WhatsApp.',
      cta: 'Chat admisi',
    },
  },

  groupPage: {
    kicker: 'Tour kampus',
    title: 'Pembagian Kelompok',
    lead: 'Kelompok A diisi pendaftar paling awal, kelompok B diisi pendaftar setelahnya. Cari nama Anda, lalu lihat urutan kunjungan saat tour kampus.',
    searchLabel: 'Cari nama atau sekolah',
    searchPlaceholder: 'Contoh: Ahmad atau SMP Negeri 1 Subang',
    searchHint: 'Nama ditampilkan disamarkan untuk menjaga privasi.',
    resultsLabel: '{count} nama cocok',
    routeLabel: 'Rute kunjungan',
    sessionsLabel: 'Jadwal sesi',
    membersLabel: 'Nama peserta',
    emptyTitle: 'Belum ada peserta',
    emptyText:
      'Daftar kelompok akan tampil setelah ada pendaftar. Hubungi panitia di meja registrasi bila nama Anda belum muncul.',
    noMatchTitle: 'Nama tidak ditemukan',
    noMatchText:
      'Periksa ejaan nama atau asal sekolah. Bila tetap tidak ditemukan, tanyakan kepada panitia di meja registrasi.',
    loadErrorTitle: 'Data kelompok belum bisa dimuat',
    loadErrorText:
      'Periksa koneksi internet lalu muat ulang halaman. Bila masih gagal, tanyakan kepada panitia di meja registrasi.',
    print: 'Cetak daftar',
    backToRundown: 'Kembali ke rundown',
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
        helper: 'Nama ayah, bunda, atau wali calon siswa.',
      },
    ],
    stepTwo: [
      {
        id: 'attendee_count',
        label: 'Jumlah orang yang akan hadir',
        helper: 'Total orang yang datang, termasuk calon siswa.',
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
        helper: 'Pilih salah satu.',
      },
    ],
    consent: {
      text: 'Saya setuju dihubungi lewat WhatsApp oleh pihak SMKIT As-Syifa terkait open house dan pendaftaran. Data saya hanya dipakai untuk keperluan itu.',
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
    server: 'Pendaftaran belum terkirim. Silakan coba lagi, atau hubungi admisi lewat WhatsApp.',
    closed: 'Pendaftaran online sudah ditutup. Silakan hubungi admisi.',
  },

  thankyou: {
    kicker: 'Pendaftaran terkirim',
    title: 'Terima kasih, pendaftaran sudah kami terima',
    lead: 'Tiket masuk sudah siap. Simpan atau kirim ke WhatsApp sebelum hari acara.',
    withSummary:
      'Total {jumlah hadir} orang, termasuk {nama anak}, kami tunggu di open house.',
    withoutSummary: 'Kami tunggu Ayah dan Bunda di open house.',
    ticket: {
      label: 'Tiket masuk',
      status: 'Terdaftar',
      codeLabel: 'Kode tiket',
      copy: 'Salin',
      copied: 'Tersalin',
      child: 'Calon siswa',
      attendees: 'Jumlah orang hadir',
      personUnit: 'orang',
      instruction: 'Tunjukkan QR code ini ke panitia di meja registrasi. Tidak perlu dicetak.',
      download: 'Simpan gambar tiket',
      share: 'Kirim ke WhatsApp',
      emptyTitle: 'Tiket tidak ditemukan',
      emptyText:
        'Data tiket tersimpan di perangkat yang dipakai saat mendaftar. Buka tautan tiket dari pesan WhatsApp panitia, atau hubungi admisi.',
      noJsNote:
        'Tiket digital memerlukan JavaScript. Buka tautan tiket dari pesan WhatsApp panitia, atau hubungi admisi.',
    },
    steps: {
      heading: 'Sebelum hari acara',
      joinTitle: 'Gabung grup WhatsApp',
      joinText: 'Pengingat dan informasi terbaru dibagikan lewat grup ini.',
      calendarTitle: 'Simpan jadwalnya',
      calendarText: 'Tambahkan jadwal ke kalender supaya tidak terlewat.',
      ticketTitle: 'Siapkan tiket saat tiba',
      ticketText: 'Buka tiket dari HP dan tunjukkan QR code di meja registrasi.',
    },
    event: {
      heading: 'Detail acara',
      openMap: 'Lihat lokasi di Google Maps',
    },
    help: {
      heading: 'Butuh bantuan?',
    },
    nextSteps: {
      joinWa: 'Gabung grup WhatsApp',
      waChannelNote: 'Saluran ini satu arah, nomor Bapak atau Ibu tidak terlihat oleh orang lain.',
      waGroupNote:
        'Di grup, anggota lain dapat melihat nomor Bapak atau Ibu. Bergabung bersifat pilihan.',
      addCalendar: 'Tambah ke kalender',
      chatAdmisi: 'Chat admisi',
      pmbLink: 'Lihat info pendaftaran PMB',
    },
    note: 'Panitia akan menghubungi lewat WhatsApp untuk memastikan kehadiran.',
  },

  ticketFinder: {
    kicker: 'Tiket digital',
    title: 'Cari tiket Open House',
    lead: 'Masukkan kode tiket atau nomor HP yang dipakai saat mendaftar. Tiket bisa dibuka dan disimpan lagi kapan saja.',
    label: 'Kode tiket atau nomor HP',
    placeholder: 'Contoh: OH-ABC123 atau 0812 3456 7890',
    hint: 'Nomor HP boleh ditulis dengan 08, 62, atau +62.',
    submit: 'Cari tiket',
    searching: 'Mencari tiket...',
    resultsHeading: 'Tiket ditemukan',
    multiple: 'Ada beberapa tiket dengan nomor ini. Pilih salah satu.',
    open: 'Buka tiket',
    attendees: 'orang',
    emptyTitle: 'Tiket tidak ditemukan',
    emptyText:
      'Periksa kembali kode tiket atau nomor HP-nya. Pastikan nomornya sama dengan yang dipakai saat mendaftar.',
    invalid: 'Masukkan kode tiket yang valid atau nomor HP Indonesia.',
    rateLimited: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
    server: 'Pencarian gagal. Periksa koneksi lalu coba lagi.',
  },

  privacy: {
    kicker: 'Privasi dan data',
    title: 'Kebijakan Privasi',
    lead: 'Kami hanya mencatat data yang dibutuhkan untuk menyiapkan open house dan menghubungi Ayah dan Bunda. Halaman ini menjelaskan data apa saja yang kami simpan dan cara meminta penghapusannya.',
    meta: 'Berlaku untuk pendaftaran Open House 07 November 2026.',
    dataItems: [
      'Nama anak',
      'Nomor HP orang tua',
      'Nama orang tua bila diisi',
      'Jumlah orang yang hadir',
      'Asal kota',
      'Asal sekolah',
      'Minat jurusan bila diisi',
      'Sumber kunjungan',
    ],
    collectedHeading: 'Data yang kami catat',
    collectedIntro: 'Saat mendaftar, kami mencatat data berikut:',
    usageHeading: 'Penggunaan dan akses',
    purposeLabel: 'Tujuan',
    purposeText: 'Informasi dan komunikasi open house serta pendaftaran.',
    accessLabel: 'Yang dapat melihat',
    accessText: 'Panitia penerimaan siswa baru.',
    retentionLabel: 'Lama penyimpanan',
    retentionText: '6 bulan.',
    sharingHeading: 'Pembagian ke pihak lain',
    sharingText: 'Tidak ada data yang dijual atau dibagikan untuk iklan pihak lain.',
    deletionHeading: 'Hak penghapusan data',
    deletionText:
      'Ayah dan Bunda berhak meminta seluruh data pendaftaran dihapus dari sistem kami secara permanen.',
    deletionAction: 'Minta hapus via WhatsApp',
  },

  waMessage: {
    greeting:
      'Assalamualaikum {sapaan}. Kami dari panitia Open House SMKIT As-Syifa Boarding School. Terima kasih sudah mendaftarkan {nama anak}. Kami ingin memastikan data pendaftaran dan membantu jika ada yang ingin ditanyakan. Apakah ada yang bisa kami bantu?',
  },
};
