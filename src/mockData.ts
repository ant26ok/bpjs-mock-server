export interface PesertaBpjs {
  noKartu: string;
  nik: string;
  nama: string;
  pisa: string;
  sex: 'L' | 'P';
  tglLahir: string;
  tglCetakKartu: string;
  statusPeserta: {
    kode: string;
    keterangan: string;
  };
  jenisPeserta: {
    kode: string;
    keterangan: string;
  };
  hakKelas: {
    kode: string;
    keterangan: string;
  };
  provUmum: {
    kdProvider: string;
    nmProvider: string;
  };
  umur: {
    umurSekarang: string;
    umurSaatPelayanan: string;
  };
  noTelepon: string;
}

export interface RujukanBpjs {
  noKunjungan: string;
  tglKunjungan: string;
  peserta: PesertaBpjs;
  diagnosa: {
    kode: string;
    nama: string;
  };
  provPerujuk: {
    kode: string;
    nama: string;
  };
  poliRujukan: {
    kode: string;
    nama: string;
  };
  pelayanan: {
    kode: string;
    nama: string;
  };
}

export interface SepRecord {
  noSep: string;
  tglSep: string;
  noKartu: string;
  nama: string;
  jnsPelayanan: string;
  kelasRawat: string;
  diagnosa: string;
  poli: string;
  noRujukan: string;
  catatan?: string;
  created_at: string;
}

export interface AntreanRecord {
  kodebooking: string;
  jenispasien: 'JKN' | 'NON JKN';
  nomorkartu: string;
  nik: string;
  nohp: string;
  kodepoli: string;
  namapoli: string;
  pasienbaru: number;
  norm: string;
  tanggalperiksa: string;
  kodedokter: number;
  namadokter: string;
  jampraktek: string;
  jeniskunjungan: number;
  nomorreferensi: string;
  nomorantrean: string;
  angkaantrean: number;
  estimasidilayani: number;
  sisakuotajkn: number;
  kuotajkn: number;
  sisakuotanonjkn: number;
  kuotanonjkn: number;
  keterangan: string;
  tasks: Array<{ taskid: number; waktu: number }>;
}

// In-Memory Database Seed
export const mockPesertaList: PesertaBpjs[] = [
  {
    noKartu: '0001234567890',
    nik: '3301011205850001',
    nama: 'Budi Santoso',
    pisa: '1',
    sex: 'L',
    tglLahir: '1985-05-12',
    tglCetakKartu: '2018-01-10',
    statusPeserta: {
      kode: '0',
      keterangan: 'AKTIF'
    },
    jenisPeserta: {
      kode: '1',
      keterangan: 'Pekerja Penerima Upah (PPU)'
    },
    hakKelas: {
      kode: '1',
      keterangan: 'Kelas 1'
    },
    provUmum: {
      kdProvider: '0112B001',
      nmProvider: 'Puskesmas Kota Sehat'
    },
    umur: {
      umurSekarang: '41 tahun, 5 bulan',
      umurSaatPelayanan: '41 tahun'
    },
    noTelepon: '081234567890'
  },
  {
    noKartu: '0009876543210',
    nik: '3301015508920002',
    nama: 'Siti Aminah',
    pisa: '2',
    sex: 'P',
    tglLahir: '1992-08-15',
    tglCetakKartu: '2020-03-15',
    statusPeserta: {
      kode: '0',
      keterangan: 'AKTIF'
    },
    jenisPeserta: {
      kode: '3',
      keterangan: 'PBPU / Mandiri'
    },
    hakKelas: {
      kode: '2',
      keterangan: 'Kelas 2'
    },
    provUmum: {
      kdProvider: '0112B002',
      nmProvider: 'Klinik Pratama Waluyo'
    },
    umur: {
      umurSekarang: '34 tahun, 2 bulan',
      umurSaatPelayanan: '34 tahun'
    },
    noTelepon: '085678901234'
  }
];

export const mockRujukanList: RujukanBpjs[] = [
  {
    noKunjungan: '0112B0011026P000001',
    tglKunjungan: '2026-10-08',
    peserta: mockPesertaList[0],
    diagnosa: {
      kode: 'I10',
      nama: 'Essential (primary) hypertension'
    },
    provPerujuk: {
      kode: '0112B001',
      nama: 'Puskesmas Kota Sehat'
    },
    poliRujukan: {
      kode: 'INT',
      nama: 'Penyakit Dalam'
    },
    pelayanan: {
      kode: '2',
      nama: 'Rawat Jalan'
    }
  },
  {
    noKunjungan: '0112B0021026P000002',
    tglKunjungan: '2026-10-09',
    peserta: mockPesertaList[1],
    diagnosa: {
      kode: 'H52.1',
      nama: 'Myopia'
    },
    provPerujuk: {
      kode: '0112B002',
      nama: 'Klinik Pratama Waluyo'
    },
    poliRujukan: {
      kode: 'MAT',
      nama: 'Mata'
    },
    pelayanan: {
      kode: '2',
      nama: 'Rawat Jalan'
    }
  }
];

export const mockSepStorage: Map<string, SepRecord> = new Map([
  [
    '0112R0011026V000001',
    {
      noSep: '0112R0011026V000001',
      tglSep: '2026-10-10',
      noKartu: '0001234567890',
      nama: 'Budi Santoso',
      jnsPelayanan: 'Rawat Jalan',
      kelasRawat: 'Kelas 1',
      diagnosa: 'I10 - Essential (primary) hypertension',
      poli: 'Poli Penyakit Dalam',
      noRujukan: '0112B0011026P000001',
      created_at: new Date().toISOString()
    }
  ]
]);

export const mockAntreanStorage: Map<string, AntreanRecord> = new Map([
  [
    'BOOK-20261010-001',
    {
      kodebooking: 'BOOK-20261010-001',
      jenispasien: 'JKN',
      nomorkartu: '0001234567890',
      nik: '3301011205850001',
      nohp: '081234567890',
      kodepoli: 'INT',
      namapoli: 'Poli Penyakit Dalam',
      pasienbaru: 0,
      norm: 'RM-001234',
      tanggalperiksa: '2026-10-10',
      kodedokter: 101,
      namadokter: 'dr. Hendro Sp.PD',
      jampraktek: '08:00-12:00',
      jeniskunjungan: 1,
      nomorreferensi: '0112B0011026P000001',
      nomorantrean: 'A-01',
      angkaantrean: 1,
      estimasidilayani: Date.now() + 1800000,
      sisakuotajkn: 19,
      kuotajkn: 20,
      sisakuotanonjkn: 10,
      kuotanonjkn: 10,
      keterangan: 'Peserta diharapkan hadir 30 menit sebelum jadwal.',
      tasks: [
        { taskid: 1, waktu: Date.now() - 3600000 },
        { taskid: 2, waktu: Date.now() - 3000000 }
      ]
    }
  ]
]);

export const mockJadwalDokter = [
  {
    kodesubspesialis: 'INT',
    namasubspesialis: 'Penyakit Dalam',
    kodedokter: 101,
    namadokter: 'dr. Hendro Sp.PD',
    kodepoli: 'INT',
    namapoli: 'Poli Penyakit Dalam',
    jadwal: [
      { hari: 1, namahari: 'Senin', jampraktek: '08:00-12:00', kapasitas: 30 },
      { hari: 2, namahari: 'Selasa', jampraktek: '08:00-12:00', kapasitas: 30 },
      { hari: 3, namahari: 'Rabu', jampraktek: '08:00-12:00', kapasitas: 30 },
      { hari: 4, namahari: 'Kamis', jampraktek: '08:00-12:00', kapasitas: 30 },
      { hari: 5, namahari: 'Jumat', jampraktek: '08:00-11:30', kapasitas: 25 },
      { hari: 6, namahari: 'Sabtu', jampraktek: '08:00-11:00', kapasitas: 20 }
    ]
  },
  {
    kodesubspesialis: 'MAT',
    namasubspesialis: 'Mata',
    kodedokter: 102,
    namadokter: 'dr. Maya Sp.M',
    kodepoli: 'MAT',
    namapoli: 'Poli Mata',
    jadwal: [
      { hari: 1, namahari: 'Senin', jampraktek: '09:00-13:00', kapasitas: 25 },
      { hari: 3, namahari: 'Rabu', jampraktek: '09:00-13:00', kapasitas: 25 },
      { hari: 5, namahari: 'Jumat', jampraktek: '09:00-12:00', kapasitas: 20 }
    ]
  }
];
