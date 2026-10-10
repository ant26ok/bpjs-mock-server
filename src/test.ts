import assert from 'node:assert';
import { 
  generateSignature, 
  verifySignature, 
  encryptBpjsPayload, 
  decryptBpjsPayload, 
  formatBpjsResponse 
} from './crypto';
import appServer from './index';

console.log('=== TEST: BPJS VCLAIM & ANTREAN MOCK SERVER ===');

const consId = '12345';
const secretKey = '98765';
const timestamp = '1791550000';

// 1. Signature Tests
const sig = generateSignature(consId, secretKey, timestamp);
assert(typeof sig === 'string' && sig.length > 20);
assert.strictEqual(verifySignature(consId, secretKey, timestamp, sig), true);
assert.strictEqual(verifySignature(consId, secretKey, timestamp, 'invalid'), false);
console.log('✓ HMAC-SHA256 Signature calculation & verification passed');

// 2. Encryption & Decryption Symmetry
const sampleData = {
  nama: 'Budi Santoso',
  noKartu: '0001234567890',
  diagnosa: 'I10 - Hipertensi Primer',
  pelayanan: 'Rawat Jalan'
};

const cipher = encryptBpjsPayload(consId, secretKey, timestamp, sampleData);
assert(typeof cipher === 'string' && cipher.length > 30);

const decrypted = decryptBpjsPayload(consId, secretKey, timestamp, cipher);
assert.deepStrictEqual(decrypted, sampleData);
console.log('✓ AES-256-CBC + LZ-String roundtrip symmetry passed');

// 3. Test App Fetch: Cek Peserta
const resPeserta = await appServer.fetch(
  new Request('http://localhost/vclaim/Peserta/nokartu/0001234567890/tglSEP/2026-10-10', {
    headers: {
      'x-cons-id': consId,
      'x-timestamp': timestamp,
      'x-secret-key': secretKey
    }
  })
);
assert.strictEqual(resPeserta.status, 200);
const jsonPeserta = await resPeserta.json();
assert.strictEqual(jsonPeserta.metaData.code, '200');
assert(typeof jsonPeserta.response === 'string');
const decPeserta = decryptBpjsPayload(consId, secretKey, timestamp, jsonPeserta.response);
assert.strictEqual(decPeserta.peserta.nama, 'Budi Santoso');
assert.strictEqual(decPeserta.peserta.noKartu, '0001234567890');
console.log('✓ VClaim Cek Peserta by NoKartu passed');

// 4. Test App Fetch: Cek Peserta Not Found
const resNotFound = await appServer.fetch(
  new Request('http://localhost/vclaim/Peserta/nokartu/9999999999999/tglSEP/2026-10-10', {
    headers: { 'x-cons-id': consId, 'x-timestamp': timestamp, 'x-secret-key': secretKey }
  })
);
const jsonNotFound = await resNotFound.json();
assert.strictEqual(jsonNotFound.metaData.code, '201');
assert.strictEqual(jsonNotFound.response, null);
console.log('✓ VClaim Peserta 201 Not Found handling passed');

// 5. Test App Fetch: Insert SEP
const resSep = await appServer.fetch(
  new Request('http://localhost/vclaim/SEP/2.0/insert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cons-id': consId,
      'x-timestamp': timestamp,
      'x-secret-key': secretKey
    },
    body: JSON.stringify({
      request: {
        t_sep: {
          noKartu: '0001234567890',
          tglSep: '2026-10-10',
          jnsPelayanan: '2',
          diagAwal: 'I10',
          poli: { tujuan: 'INT' }
        }
      }
    })
  })
);
assert.strictEqual(resSep.status, 200);
const jsonSep = await resSep.json();
assert.strictEqual(jsonSep.metaData.code, '200');
const decSep = decryptBpjsPayload(consId, secretKey, timestamp, jsonSep.response);
assert(decSep.sep.noSep.startsWith('0112R001'));
console.log('✓ VClaim Insert SEP passed (No SEP: ' + decSep.sep.noSep + ')');

// 6. Test App Fetch: Antrean Update Task ID
const resTask = await appServer.fetch(
  new Request('http://localhost/antrean/antrean/updatewaktu', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cons-id': consId,
      'x-timestamp': timestamp,
      'x-secret-key': secretKey
    },
    body: JSON.stringify({
      kodebooking: 'BOOK-20261010-001',
      taskid: 3,
      waktu: 1791551000
    })
  })
);
assert.strictEqual(resTask.status, 200);
const jsonTask = await resTask.json();
assert.strictEqual(jsonTask.metaData.code, '200');
const decTask = decryptBpjsPayload(consId, secretKey, timestamp, jsonTask.response);
assert.strictEqual(decTask.taskid, 3);
assert.strictEqual(decTask.kodebooking, 'BOOK-20261010-001');
console.log('✓ Antrean RS Update Task ID passed');

// 7. Test App Fetch: Decrypt Utility API
const resUtilDec = await appServer.fetch(
  new Request('http://localhost/api/tools/decrypt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consId,
      secretKey,
      timestamp,
      cipher
    })
  })
);
const jsonUtilDec = await resUtilDec.json();
assert.strictEqual(jsonUtilDec.success, true);
assert.deepStrictEqual(jsonUtilDec.decrypted, sampleData);
console.log('✓ Web Decryptor Utility API passed');

console.log('=== ALL 7 TEST SUITES PASSED SUCCESSFULLY ===');
