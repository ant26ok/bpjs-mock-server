import crypto from 'node:crypto';
import LZString from 'lz-string';

export interface BpjsHeaders {
  consId: string;
  secretKey: string;
  timestamp: string;
}

export function generateSignature(consId: string, secretKey: string, timestamp: string): string {
  const payload = `${consId}&${timestamp}`;
  return crypto.createHmac('sha256', secretKey).update(payload).digest('base64');
}

export function verifySignature(
  consId: string, 
  secretKey: string, 
  timestamp: string, 
  signature: string
): boolean {
  const expected = generateSignature(consId, secretKey, timestamp);
  return expected === signature;
}

export function deriveKeyAndIv(consId: string, secretKey: string, timestamp: string) {
  const keyString = `${consId}${secretKey}${timestamp}`;
  const keyHash = crypto.createHash('sha256').update(keyString).digest();
  const iv = keyHash.subarray(0, 16);
  return { key: keyHash, iv };
}

export function encryptBpjsPayload(
  consId: string, 
  secretKey: string, 
  timestamp: string, 
  data: any
): string {
  const { key, iv } = deriveKeyAndIv(consId, secretKey, timestamp);
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  const compressed = LZString.compressToEncodedURIComponent(jsonStr);

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(compressed, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

export function decryptBpjsPayload(
  consId: string, 
  secretKey: string, 
  timestamp: string, 
  encryptedBase64: string
): any {
  const { key, iv } = deriveKeyAndIv(consId, secretKey, timestamp);

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decryptedCompressed = decipher.update(encryptedBase64, 'base64', 'utf8');
  decryptedCompressed += decipher.final('utf8');

  const decompressed = LZString.decompressFromEncodedURIComponent(decryptedCompressed);
  if (!decompressed) {
    throw new Error('Gagal mendekompresi payload LZ-String.');
  }

  try {
    return JSON.parse(decompressed);
  } catch {
    return decompressed;
  }
}

export function formatBpjsResponse(
  consId: string,
  secretKey: string,
  timestamp: string,
  code: number | string,
  message: string,
  data?: any,
  encrypt = true
) {
  const metaData = {
    code: String(code),
    message
  };

  if (!data) {
    return { metaData, response: null };
  }

  if (!encrypt) {
    return { metaData, response: data };
  }

  const encryptedResponse = encryptBpjsPayload(consId, secretKey, timestamp, data);
  return {
    metaData,
    response: encryptedResponse
  };
}
