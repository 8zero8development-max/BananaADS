import { describe, it, expect } from 'vitest';
import { decodeBase64, decodeAudioData } from '../utils/audioUtils';

describe('Audio Utils', () => {
  describe('decodeBase64', () => {
    it('should decode base64 string to Uint8Array', () => {
      const base64 = 'SGVsbG8gV29ybGQ='; // "Hello World" in base64
      const result = decodeBase64(base64);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(11);
    });

    it('should handle empty string', () => {
      const result = decodeBase64('');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });
  });

  describe('decodeAudioData', () => {
    it('should decode audio data correctly', async () => {
      // Mock AudioContext
      const mockAudioContext = {
        createBuffer: vi.fn().mockReturnValue({
          getChannelData: vi.fn().mockReturnValue(new Float32Array(100))
        }),
        sampleRate: 24000
      } as any;

      // Create test data (16-bit PCM)
      const testData = new Uint8Array(200); // 100 samples * 2 bytes per sample
      const dataView = new DataView(testData.buffer);
      for (let i = 0; i < 100; i++) {
        dataView.setInt16(i * 2, Math.sin(i / 10) * 32767, true);
      }

      const result = await decodeAudioData(testData, mockAudioContext, 24000, 1);

      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, 100, 24000);
      expect(result).toBeDefined();
    });

    it('should handle different sample rates', async () => {
      const mockAudioContext = {
        createBuffer: vi.fn().mockReturnValue({
          getChannelData: vi.fn().mockReturnValue(new Float32Array(50))
        }),
        sampleRate: 44100
      } as any;

      const testData = new Uint8Array(100);
      const result = await decodeAudioData(testData, mockAudioContext, 44100, 1);

      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, 50, 44100);
    });
  });
});