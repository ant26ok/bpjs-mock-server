import { Hono } from 'hono';
import { formatBpjsResponse } from './crypto';
import { 
  mockAntreanStorage, 
  mockJadwalDokter, 
  AntreanRecord 
} from './mockData';

export const antreanApp = new Hono();

function extractBpjsHeaders(c: any, defaultSecret = '98765') {
  const consId = c.req.header('x-cons-id') || '12345';
  const timestamp = c.req.header('x-timestamp') || String(Math.floor(Date.now() / 1000));
  const secretKey = c.req.header('x-secret-key') || defaultSecret;
  const isRaw = c.req.query('raw') === 'true' || c.req.header('x-raw-response') === 'true';

  return { consId, timestamp, secretKey, isRaw };
}

// 1. Tambah Antrean
antreanApp.post('/antrean/add', async (c) => {
  const { consId, timestamp, secretKey, isRaw } = extractBpjsHeaders(c);
  const body = await c.req.json().catch(() => ({}));

  const kodebooking = body.kodebooking || `BOOK-${Date.now()}`;
  const angkaantrean = mockAntreanStorage.size + 1;
  const prefix = body.kodepoli === 'MAT' ? 'C' : 'A';
  const nomorantrean = `${prefix}-${String(angkaantrean).padStart(2, '0')}`;

  const record: AntreanRecord = {
    kodebooking,
    jenispasien: body.jenispasien || 'JKN',
    nomorkartu: body.nomorkartu || '0001234567890',
    nik: body.nik || '3301011205850001',
    nohp: body.nohp || '081234567890',
    kodepoli: body.kodepoli || 'INT',
    namapoli: body.namapoli || 'Poli Penyakit Dalam',
    pasienbaru: Number(body.pasienbaru || 0),
    norm: body.norm || 'RM-001234',
    tanggalperiksa: body.tanggalperiksa || new Date().toISOString().slice(0, 10),
    kodedokter: Number(body.kodedokter || 101),
    namadokter: body.namadokter || 'dr. Hendro Sp.PD',
    jampraktek: body.jampraktek || '08:00-12:00',
    jeniskunjungan: Number(body.jeniskunjungan || 1),
    nomorreferensi: body.nomorreferensi || '0112B0011026P000001',
    nomorantrean,
    angkaantrean,
    estimasidilayani: Date.now() + 1800000,
    sisakuotajkn: 15,
    kuotajkn: 20,
    sisakuotanonjkn: 10,
    kuotanonjkn: 10,
    keterangan: 'Peserta diharapkan datang 30 menit sebelum jadwal pemeriksaan.',
    tasks: [{ taskid: 1, waktu: Date.now() }]
  };

  mockAntreanStorage.set(kodebooking, record);

  const payload = {
    nomorantrean: record.nomorantrean,
    angkaantrean: record.angkaantrean,
    kodebooking: record.kodebooking,
    norm: record.norm,
    namapoli: record.namapoli,
    namadokter: record.namadokter,
    estimasidilayani: record.estimasidilayani,
    sisakuotajkn: record.sisakuotajkn,
    kuotajkn: record.kuotajkn,
    sisakuotanonjkn: record.sisakuotanonjkn,
    kuotanonjkn: record.kuotanonjkn,
    keterangan: record.keterangan
  };

  return c.json(formatBpjsResponse(consId, secretKey, timestamp, 200, 'Ok', payload, !isRaw));
});

// 2. Update Waktu Antrean (Task ID 1 s/d 7)
antreanApp.post('/antrean/updatewaktu', async (c) => {
  const { consId, timestamp, secretKey, isRaw } = extractBpjsHeaders(c);
  const body = await c.req.json().catch(() => ({}));

  const { kodebooking, taskid, waktu } = body;
  if (!kodebooking || !taskid || !waktu) {
    return c.json({
      metaData: {
        code: '201',
        message: 'Field kodebooking, taskid, dan waktu wajib diisi.'
      },
      response: null
    }, 200);
  }

  const record = mockAntreanStorage.get(kodebooking);
  if (!record) {
    return c.json({
      metaData: {
        code: '201',
        message: `Antrean dengan kodebooking ${kodebooking} tidak ditemukan.`
      },
      response: null
    }, 200);
  }

  record.tasks.push({ taskid: Number(taskid), waktu: Number(waktu) });

  const taskNames: Record<number, string> = {
    1: 'Mulai tunggu admisi',
    2: 'Selesai admisi / pendaftaran',
    3: 'Mulai tunggu poli',
    4: 'Selesai dilayani dokter',
    5: 'Mulai tunggu farmasi',
    6: 'Selesai ambil obat',
    7: 'Batal pelayanan'
  };

  const payload = {
    kodebooking,
    taskid: Number(taskid),
    taskName: taskNames[Number(taskid)] || 'Unknown Task',
    waktu: Number(waktu),
    status: 'Tercatat di server bridging BPJS Antrean'
  };

  return c.json(formatBpjsResponse(consId, secretKey, timestamp, 200, 'Ok', payload, !isRaw));
});

// 3. Batal Antrean
antreanApp.post('/antrean/batal', async (c) => {
  const { consId, timestamp, secretKey, isRaw } = extractBpjsHeaders(c);
  const body = await c.req.json().catch(() => ({}));
  const { kodebooking, keterangan } = body;

  const record = mockAntreanStorage.get(kodebooking);
  if (!record) {
    return c.json({
      metaData: {
        code: '201',
        message: `Antrean ${kodebooking} tidak ditemukan.`
      },
      response: null
    }, 200);
  }

  record.tasks.push({ taskid: 7, waktu: Date.now() });
  return c.json(formatBpjsResponse(consId, secretKey, timestamp, 200, 'Ok', { kodebooking, keterangan: keterangan || 'Dibatalkan oleh pasien/faskes' }, !isRaw));
});

// 4. Jadwal Dokter
antreanApp.get('/jadwaldokter/kodepoli/:poli/tanggal/:tgl', (c) => {
  const { consId, timestamp, secretKey, isRaw } = extractBpjsHeaders(c);
  const poli = c.req.param('poli');

  const filtered = mockJadwalDokter.filter(d => d.kodepoli.toLowerCase() === poli.toLowerCase());
  return c.json(formatBpjsResponse(consId, secretKey, timestamp, 200, 'Ok', filtered, !isRaw));
});
