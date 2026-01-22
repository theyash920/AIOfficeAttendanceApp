import { SHA256 } from 'crypto-js';

export const TokenHasher = {
  generateSessionToken(userId: string): string {
    const timestamp = new Date().getTime();
    const rawData = `${userId}-${timestamp}`;
    return SHA256(rawData).toString();
  }
};
