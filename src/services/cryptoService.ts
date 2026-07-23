import CryptoJS from 'crypto-js';
import { CompressionUtils } from '@/utils/compressionUtils';

export const CryptoService = {
  // Task 9.1: Encrypt data using AES-256 with optional compression
  encrypt(text: string, key: string, compress: boolean = false): string {
    const dataToEncrypt = compress ? CompressionUtils.compress(text) : text;
    return CryptoJS.AES.encrypt(dataToEncrypt, key).toString();
  },

  // Task 9.1: Decrypt data
  decrypt(ciphertext: string, key: string, isCompressed: boolean = false): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return isCompressed ? CompressionUtils.decompress(decrypted) : decrypted;
  },

  // Task 9.2: Hash password (never store plain text)
  hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  },

  // Verify password against stored hash
  verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }
};
