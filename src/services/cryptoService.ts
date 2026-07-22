import CryptoJS from 'crypto-js';

export const CryptoService = {
  // Task 9.1: Encrypt data using AES-256
  encrypt(text: string, key: string): string {
    return CryptoJS.AES.encrypt(text, key).toString();
  },

  // Task 9.1: Decrypt data
  decrypt(ciphertext: string, key: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    return bytes.toString(CryptoJS.enc.Utf8);
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
