import { Hono } from 'hono';
import { 
  verifySignature, 
  formatBpjsResponse, 
  decryptBpjsPayload 
} from './crypto';
import { 
  mockPesertaList, 
  mockRujukanList, 
  mockSepStorage, 
  SepRecord 
} from './mockData';

export const vclaimApp = new Hono();

// Helper to extract & validate headers
function extractBpjsHeaders(c: any, defaultSecret = '98765') {
  const consId = c.req.header('x-cons-id') || '12345';
  const timestamp = c.req.header('x-timestamp') || String(Math.floor(Date.now() / 1000));
  const signature = c.req.header('x-signature') || '';
  const userKey = c.req.header('user_key') || '';
  const secretKey = c.req.header('x-secret-key') || defaultSecret;

  // Header raw mode: if client passes ?raw=true or header x-raw-response: true, return unencrypted
  const isRaw = c.req.query('raw') === 'true' || c.req.header('x-raw-response') === 'true';

  return { consId, timestamp, signature, userKey, secretKey, isRaw };
}

// 1. Cek Peserta berdasarkan No Kartu
vclaimApp.get('/Peserta/nokartu/:nokartu/tglSEP/:tgl', (c) => {
  const { consId, timestamp, secretKey, isRaw } = extractBpjsHeaders(c);
  const nokartu = c.req.param('nokartu');
  const tgl = c.req.param('tgl');

  const peserta = mockPesertaList.find(p => p.noKartu === nokartu);
  if (!peserta) {
    return c.json({
      metaData: {
        code: '201',
        message: `Data Peserta dengan Nomor Kartu ${nokartu} tidak ditemukan.`
      },
      response: null
    }, 200);
  }

  const payload = {
    peserta: {
      ...peserta,
      tglSEP: tgl
    }
  };

  return c.json(formatBpjsResponse(consId, secretKey, timestamp, 200, 'Sukses', payload, !isRaw));
});

// 2. Cek Peserta berdasarkan NIK
vclaimApp.get('/Peserta/nik/:nik/tglSEP/:tgl', (c) => {
  const { consId, timestamp, secretKey, isRaw } = extractBpjsHeaders(c);
  const nik = c.req.param('nik');
  const tgl = c.req.param('tgl');

  const peserta = mockPesertaList.find(p => p.nik === nik);
  if (!peserta) {
    return c.json({
      metaData: {
        code: '201',
        message: `Data Peserta dengan NIK ${nik} tidak ditemukan.`
      },
      response: null
    }, 200);
  }

  const payload = {
    peserta: {
      ...peserta,
      tglSEP: tgl
    }
  };

  return c.json(formatBpjsResponse(consId, secretKey, timestamp, 200, 'Sukses', payload, !isRaw));
});

// 3. Cek Rujukan berdasarkan No Rujukan
vclaimApp.get('/Rujukan/:norujukan', (c) => {
  const { consId, timestamp, secretKey, isRaw } = extractBpjsHeaders(c);
  const norujukan = c.req.param('norujukan');

  const rujukan = mockRujukanList.find(r => r.noKunjungan === norujukan);
  if (!rujukan) {
    return c.json({
      metaData: {
        code: '201',
        message: `Data Rujukan dengan nomor ${norujukan} tidak ditemukan.`
      },
      response: null
    }, 200);
  }

  const payload = { rujukan };
  return c.json(formatBpjsResponse(consId, secretKey, timestamp, 200, 'Sukses', payload, !isRaw));
});

// 4. Cek List Rujukan berdasarkan No Kartu
vclaimApp.get('/Rujukan/Peserta/:nokartu', (c) => {
  const { consId, timestamp, secretKey, isRaw } = extractBpjsHeaders(c);
  const nokartu = c.req.param('nokartu');

  const list = mockRujukanList.filter(r => r.peserta.noKartu === nokartu);
  if (list.length === 0) {
    return c.json({
      metaData: {
        code: '201',
        message: `Data Rujukan untuk peserta nomor ${nokartu} tidak ditemukan.`
      },
      response: null
    }, 200);
  }

  const payload = { rujukan: list };
  return c.json(formatBpjsResponse(consId, secretKey, timestamp, 200, 'Sukses', payload, !isRaw));
});

// 5. Insert SEP 2.0
vclaimApp.post('/SEP/2.0/insert', async (c) => {
  const { consId, timestamp, secretKey, isRaw } = extractBpjsHeaders(c);
  const body = await c.req.json().catch(() => ({}));

  // Body can contain request object
  const reqData = body.request?.t_sep || body;
  const noKartu = reqData.noKartu || '0001234567890';
  const peserta = mockPesertaList.find(p => p.noKartu === noKartu) || mockPesertaList[0];

  const counter = mockSepStorage.size + 1;
  const seq = String(counter).padStart(6, '0');
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 4) + now.toISOString().slice(5, 7);
  const noSep = `0112R001${dateStr}V${seq}`;

  const newSep: SepRecord = {
    noSep,
    tglSep: reqData.tglSep || now.toISOString().slice(0, 10),
    noKartu: peserta.noKartu,
    nama: peserta.nama,
    jnsPelayanan: reqData.jnsPelayanan === '1' ? 'Rawat Inap' : 'Rawat Jalan',
    kelasRawat: reqData.klsRawat?.klsRawatHak || 'Kelas 1',
    diagnosa: reqData.diagAwal || 'I10 - Essential (primary) hypertension',
    poli: reqData.poli?.tujuan || 'Poli Penyakit Dalam',
    noRujukan: reqData.rujukan?.noRujukan || '0112B0011026P000001',
    catatan: reqData.catatan || '',
    created_at: now.toISOString()
  };

  mockSepStorage.set(noSep, newSep);

  const payload = {
    sep: {
      noSep: newSep.noSep,
      tglSep: newSep.tglSep,
      jnsPelayanan: newSep.jnsPelayanan,
      poli: newSep.poli,
      diagnosa: newSep.diagnosa,
      peserta: {
        noKartu: peserta.noKartu,
        nama: peserta.nama,
        noMr: reqData.noMR || 'RM-001234'
      }
    }
  };

  return c.json(formatBpjsResponse(consId, secretKey, timestamp, 200, 'Sukses Pembuatan SEP', payload, !isRaw));
});

// 6. Cari Detail SEP
vclaimApp.get('/SEP/:nosep', (c) => {
  const { consId, timestamp, secretKey, isRaw } = extractBpjsHeaders(c);
  const nosep = c.req.param('nosep');

  const sep = mockSepStorage.get(nosep);
  if (!sep) {
    return c.json({
      metaData: {
        code: '201',
        message: `Data SEP dengan nomor ${nosep} tidak ditemukan.`
      },
      response: null
    }, 200);
  }

  const payload = { sep };
  return c.json(formatBpjsResponse(consId, secretKey, timestamp, 200, 'Sukses', payload, !isRaw));
});

// 7. Hapus SEP
vclaimApp.delete('/SEP/2.0/delete', async (c) => {
  const { consId, timestamp, secretKey, isRaw } = extractBpjsHeaders(c);
  const body = await c.req.json().catch(() => ({}));
  const noSep = body.request?.t_sep?.noSep || body.noSep;

  if (!noSep || !mockSepStorage.has(noSep)) {
    return c.json({
      metaData: {
        code: '201',
        message: `SEP ${noSep || ''} tidak ditemukan atau sudah dihapus.`
      },
      response: null
    }, 200);
  }

  mockSepStorage.delete(noSep);
  return c.json(formatBpjsResponse(consId, secretKey, timestamp, 200, 'Sukses Hapus SEP', { noSep }, !isRaw));
});
