# BPJS VClaim v2 & Antrean RS Mock Server

Emulator lokal web service bridging **BPJS Kesehatan (VClaim v2 & Antrean RS)** mandiri berbasis Bun & Hono. Dirancang khusus untuk mempermudah developer SIMRS menguji integrasi bridging tanpa ketergantungan koneksi sandbox BPJS yang sering down, lengkap dengan **Enkripsi AES-256-CBC + Kompresi LZ-String** dan **Web Decryptor GUI**.

---

## Fitur Utama

- **Enkripsi & Dekripsi Otentik BPJS**:
  - Algoritma: `SHA256(consId + secretKey + timestamp)` → Key (32 byte) & IV (16 byte pertama).
  - Dekompresi otomatis `LZ-String` (`compressToEncodedURIComponent`).
  - Perhitungan HMAC-SHA256 untuk header `x-signature`.
- **Web Decryptor & Testing Playground (`/`)**:
  - Form dekripsi & enkripsi payload langsung di browser.
  - One-click tester endpoint BPJS dengan tampilan respons asli vs hasil dekripsi berdampingan.
- **Kredensial Default Emulator**:
  - `x-cons-id`: `12345`
  - `x-secret-key`: `98765`
  - `user_key`: `simrs-dev`
- **Mode Raw / Unencrypted**:
  - Tambahkan parameter `?raw=true` atau header `x-raw-response: true` untuk menerima respons JSON langsung tanpa enkripsi saat proses debugging.

---

## Daftar Endpoint Bridging

### 1. VClaim v2 (`/vclaim/*`)
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/vclaim/Peserta/nokartu/:nokartu/tglSEP/:tgl` | Cek data kepesertaan BPJS via No Kartu |
| `GET` | `/vclaim/Peserta/nik/:nik/tglSEP/:tgl` | Cek kepesertaan via NIK KTP |
| `GET` | `/vclaim/Rujukan/:norujukan` | Cek detail rujukan FKTP (Puskesmas/Klinik) |
| `GET` | `/vclaim/Rujukan/Peserta/:nokartu` | List riwayat rujukan peserta |
| `POST` | `/vclaim/SEP/2.0/insert` | Pembuatan SEP v2.0 baru |
| `GET` | `/vclaim/SEP/:nosep` | Cari detail data SEP |
| `DELETE` | `/vclaim/SEP/2.0/delete` | Pembatalan / hapus SEP |

### 2. Antrean RS (`/antrean/*`)
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/antrean/antrean/add` | Tambah antrean pendaftaran Mobile JKN |
| `POST` | `/antrean/antrean/updatewaktu` | Update waktu Task ID (1 s/d 7) antrean |
| `POST` | `/antrean/antrean/batal` | Pembatalan nomor antrean |
| `GET` | `/antrean/jadwaldokter/kodepoli/:poli/tanggal/:tgl` | Ambil jadwal dokter poliklinik |

### 3. Utility Tools (`/api/tools/*`)
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/tools/signature` | Hitung `x-signature` otomatis |
| `POST` | `/api/tools/decrypt` | Dekripsi payload `response` BPJS |
| `POST` | `/api/tools/encrypt` | Enkripsi JSON sembarang ke format BPJS |

---

## Contoh Request (cURL)

### Cek Peserta (dengan Enkripsi):
```bash
TIMESTAMP=$(date +%s)
curl http://localhost:3005/vclaim/Peserta/nokartu/0001234567890/tglSEP/2026-10-10 \
  -H "x-cons-id: 12345" \
  -H "x-timestamp: $TIMESTAMP" \
  -H "x-secret-key: 98765" \
  -H "user_key: simrs-dev"
```

### Cek Peserta (Mode Debug Raw JSON):
```bash
curl "http://localhost:3005/vclaim/Peserta/nokartu/0001234567890/tglSEP/2026-10-10?raw=true"
```

---

## Menjalankan Server & Test

```bash
# Menjalankan server lokal (Port 3005)
bun run start

# Menjalankan unit test
bun run test
```
