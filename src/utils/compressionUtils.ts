import LZString from 'lz-string';

export const CompressionUtils = {
  compress(data: string): string {
    return LZString.compressToUTF16(data);
  },

  decompress(compressed: string): string {
    return LZString.decompressFromUTF16(compressed) || '';
  }
};
