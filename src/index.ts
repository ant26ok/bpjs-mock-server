import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { 
  generateSignature, 
  encryptBpjsPayload, 
  decryptBpjsPayload 
} from './crypto';
import { vclaimApp } from './vclaim';
import { antreanApp } from './antrean';
import { 
  mockPesertaList, 
  mockSepStorage, 
  mockAntreanStorage 
} from './mockData';

const app = new Hono();
app.use('*', logger());
app.use('*', cors());

// Utility Endpoints
app.post('/api/tools/signature', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const consId = body.consId || '12345';
  const secretKey = body.secretKey || '98765';
  const timestamp = body.timestamp || String(Math.floor(Date.now() / 1000));

  const signature = generateSignature(consId, secretKey, timestamp);
  return c.json({
    consId,
    timestamp,
    signature,
    headers: {
      'x-cons-id': consId,
      'x-timestamp': timestamp,
      'x-signature': signature,
      'user_key': 'simrs-local-dev'
    }
  });
});

app.post('/api/tools/decrypt', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const consId = body.consId || '12345';
  const secretKey = body.secretKey || '98765';
  const timestamp = body.timestamp;
  const cipher = body.response || body.cipher;

  if (!timestamp || !cipher) {
    return c.json({ error: 'Field timestamp dan response/cipher wajib diisi.' }, 400);
  }

  try {
    const decrypted = decryptBpjsPayload(consId, secretKey, timestamp, cipher);
    return c.json({ success: true, decrypted });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.post('/api/tools/encrypt', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const consId = body.consId || '12345';
  const secretKey = body.secretKey || '98765';
  const timestamp = body.timestamp || String(Math.floor(Date.now() / 1000));
  const data = body.data;

  if (!data) {
    return c.json({ error: 'Field data wajib diisi.' }, 400);
  }

  const encrypted = encryptBpjsPayload(consId, secretKey, timestamp, data);
  return c.json({
    consId,
    timestamp,
    response: encrypted
  });
});

app.get('/api/stats', (c) => {
  return c.json({
    totalPeserta: mockPesertaList.length,
    totalSep: mockSepStorage.size,
    totalAntrean: mockAntreanStorage.size
  });
});

// Mount VClaim & Antrean
app.route('/vclaim', vclaimApp);
app.route('/antrean', antreanApp);

// Web Dashboard
app.get('/', (c) => {
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>BPJS VClaim v2 & Antrean RS Mock Server</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    pre, code, .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-cyan-500 selection:text-white">
  <!-- Top Navigation -->
  <header class="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center font-black text-white text-sm shadow-md shadow-cyan-500/20">
          BP
        </div>
        <div>
          <span class="font-extrabold text-sm sm:text-base text-white tracking-tight block leading-tight">
            BPJS Bridging Simulator
          </span>
          <span class="text-[10px] text-slate-400 font-medium block">
            VClaim v2 • Antrean RS • AES-256 + LZ-String Engine
          </span>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Mock Server Active (:3005)
        </span>
      </div>
    </div>
  </header>

  <main class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Server Credentials Guide -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-sm font-bold text-white mb-0.5">Konfigurasi Bridging BPJS Default</h2>
          <p class="text-xs text-slate-400">Gunakan nilai di bawah ini untuk pengaturan bridging SIMRS atau pengujian Postman.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span class="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">ConsID: <strong class="text-cyan-400">12345</strong></span>
          <span class="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">Secret: <strong class="text-cyan-400">98765</strong></span>
          <span class="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">UserKey: <strong class="text-cyan-400">simrs-dev</strong></span>
        </div>
      </div>
    </div>

    <!-- Main Grid: Tools & API Explorer -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Card 1: Live Decryptor & Encryptor -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <span>🔓</span> Live Payload Decryptor
          </h3>
          <span class="text-[11px] text-cyan-400 font-medium">AES-256-CBC + LZ-String</span>
        </div>

        <div class="grid grid-cols-3 gap-2 text-xs">
          <div>
            <label class="block text-slate-400 text-[11px] mb-1">Cons ID</label>
            <input type="text" id="toolConsId" value="12345" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono">
          </div>
          <div>
            <label class="block text-slate-400 text-[11px] mb-1">Secret Key</label>
            <input type="text" id="toolSecret" value="98765" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono">
          </div>
          <div>
            <label class="block text-slate-400 text-[11px] mb-1">Timestamp</label>
            <div class="flex gap-1">
              <input type="text" id="toolTimestamp" placeholder="UNIX Time" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono">
              <button onclick="setNowTimestamp()" title="Set Sekarang" class="px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-[10px]">Now</button>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-slate-400 text-[11px] mb-1">Encrypted String (Nilai field "response" BPJS)</label>
          <textarea id="toolCipher" rows="4" placeholder="Tempelkan string terenkripsi di sini..." class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"></textarea>
        </div>

        <div class="flex gap-2">
          <button onclick="executeDecrypt()" class="flex-1 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-xs font-bold text-white transition">
            Dekripsi Sekarang 🔓
          </button>
          <button onclick="executeEncrypt()" class="py-2 px-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300 transition">
            Enkripsi JSON 🔒
          </button>
        </div>

        <div>
          <label class="block text-slate-400 text-[11px] mb-1">Hasil Dekripsi (Plain JSON)</label>
          <pre id="toolResult" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-emerald-400 font-mono h-40 overflow-y-auto whitespace-pre-wrap">// Output hasil dekripsi akan tampil di sini</pre>
        </div>
      </div>

      <!-- Card 2: Interactive API Tester -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <span>⚡</span> One-Click Endpoint Simulator
          </h3>
          <span class="text-[11px] text-slate-400">VClaim v2 & Antrean RS</span>
        </div>

        <p class="text-xs text-slate-400">
          Uji coba endpoint BPJS secara langsung. Sistem akan menembak endpoint, menampilkan respons terenkripsi asli, dan langsung mendekripsinya secara instan.
        </p>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <button onclick="testCekPeserta()" class="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition">
            <span class="block font-bold text-white text-[11px]">1. Cek Peserta BPJS</span>
            <span class="block text-[10px] text-slate-400 font-mono">No: 0001234567890</span>
          </button>

          <button onclick="testCekRujukan()" class="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition">
            <span class="block font-bold text-white text-[11px]">2. Cek Rujukan Puskesmas</span>
            <span class="block text-[10px] text-slate-400 font-mono">0112B0011026P000001</span>
          </button>

          <button onclick="testInsertSep()" class="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition">
            <span class="block font-bold text-white text-[11px]">3. Buat SEP Rawat Jalan</span>
            <span class="block text-[10px] text-slate-400 font-mono">POST /vclaim/SEP/2.0/insert</span>
          </button>

          <button onclick="testUpdateTask()" class="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition">
            <span class="block font-bold text-white text-[11px]">4. Update Task ID 3 Antrean</span>
            <span class="block text-[10px] text-slate-400 font-mono">Poli tunggu dokter</span>
          </button>
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-slate-400 text-[11px]">Respons Server & Auto-Decrypt</span>
            <span id="testUrlLabel" class="text-[10px] text-cyan-400 font-mono truncate max-w-xs">-</span>
          </div>
          <pre id="apiTestOutput" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300 font-mono h-60 overflow-y-auto whitespace-pre-wrap">// Klik salah satu tombol di atas untuk menguji respons</pre>
        </div>
      </div>
    </div>
  </main>

  <footer class="bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
    <span>BPJS VClaim v2 & Antrean RS Mock Emulator • Hono Bun Engine</span>
  </footer>

  <script>
    function setNowTimestamp() {
      document.getElementById('toolTimestamp').value = Math.floor(Date.now() / 1000);
    }
    setNowTimestamp();

    async function executeDecrypt() {
      const consId = document.getElementById('toolConsId').value;
      const secretKey = document.getElementById('toolSecret').value;
      const timestamp = document.getElementById('toolTimestamp').value;
      const cipher = document.getElementById('toolCipher').value.trim();
      const resEl = document.getElementById('toolResult');

      if (!timestamp || !cipher) {
        alert('Mohon isi timestamp dan cipher text terlebih dahulu.');
        return;
      }

      resEl.innerText = 'Mendekripsi...';
      try {
        const res = await fetch('/api/tools/decrypt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consId, secretKey, timestamp, cipher })
        });
        const data = await res.json();
        if (data.success) {
          resEl.innerText = JSON.stringify(data.decrypted, null, 2);
        } else {
          resEl.innerText = 'Error: ' + data.error;
        }
      } catch (e) {
        resEl.innerText = 'Error: ' + e.message;
      }
    }

    async function executeEncrypt() {
      const consId = document.getElementById('toolConsId').value;
      const secretKey = document.getElementById('toolSecret').value;
      const timestamp = document.getElementById('toolTimestamp').value;
      let text = document.getElementById('toolCipher').value.trim();
      const resEl = document.getElementById('toolResult');

      try {
        const parsed = JSON.parse(text);
        const res = await fetch('/api/tools/encrypt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consId, secretKey, timestamp, data: parsed })
        });
        const d = await res.json();
        resEl.innerText = d.response;
      } catch (e) {
        alert('Masukkan JSON yang valid di kolom textarea untuk dienkripsi.');
      }
    }

    async function callAndDisplay(url, options = {}) {
      const out = document.getElementById('apiTestOutput');
      const label = document.getElementById('testUrlLabel');
      label.innerText = (options.method || 'GET') + ' ' + url;
      out.innerText = 'Memanggil mock endpoint...';

      const consId = '12345';
      const secretKey = '98765';
      const timestamp = String(Math.floor(Date.now() / 1000));

      const headers = {
        'x-cons-id': consId,
        'x-timestamp': timestamp,
        'x-secret-key': secretKey,
        'user_key': 'simrs-dev',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };

      try {
        const res = await fetch(url, { ...options, headers });
        const rawJson = await res.json();

        let display = '=== 1. RAW BPJS ENCRYPTED RESPONSE ===\n' + JSON.stringify(rawJson, null, 2);

        if (rawJson.response && typeof rawJson.response === 'string') {
          // Decrypt
          const decRes = await fetch('/api/tools/decrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consId, secretKey, timestamp, cipher: rawJson.response })
          });
          const decData = await decRes.json();
          if (decData.success) {
            display += '\n\n=== 2. DECRYPTED PAYLOAD (SIMRS READABLE) ===\n' + JSON.stringify(decData.decrypted, null, 2);
            document.getElementById('toolTimestamp').value = timestamp;
            document.getElementById('toolCipher').value = rawJson.response;
            document.getElementById('toolResult').innerText = JSON.stringify(decData.decrypted, null, 2);
          }
        }

        out.innerText = display;
      } catch (err) {
        out.innerText = 'Request error: ' + err.message;
      }
    }

    function testCekPeserta() {
      callAndDisplay('/vclaim/Peserta/nokartu/0001234567890/tglSEP/2026-10-10');
    }

    function testCekRujukan() {
      callAndDisplay('/vclaim/Rujukan/0112B0011026P000001');
    }

    function testInsertSep() {
      callAndDisplay('/vclaim/SEP/2.0/insert', {
        method: 'POST',
        body: JSON.stringify({
          request: {
            t_sep: {
              noKartu: '0001234567890',
              tglSep: '2026-10-10',
              jnsPelayanan: '2',
              klsRawat: { klsRawatHak: 'Kelas 1' },
              diagAwal: 'I10',
              poli: { tujuan: 'INT' },
              rujukan: { noRujukan: '0112B0011026P000001' }
            }
          }
        })
      });
    }

    function testUpdateTask() {
      callAndDisplay('/antrean/antrean/updatewaktu', {
        method: 'POST',
        body: JSON.stringify({
          kodebooking: 'BOOK-20261010-001',
          taskid: 3,
          waktu: Date.now()
        })
      });
    }
  </script>
</body>
</html>`;

  return c.html(html);
});

const PORT = Number(process.env.PORT || 3005);

export default {
  port: PORT,
  hostname: '0.0.0.0',
  fetch: app.fetch
};
