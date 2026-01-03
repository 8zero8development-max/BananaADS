import { useCallback } from 'react';
import { decodeBase64, decodeAudioData } from '../utils/audioUtils';

export function useAudioPlayback() {
  const playAudio = useCallback(async (base64Audio: string, voiceName: string = 'Kore') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });
      const decodedData = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(decodedData, audioCtx, 24000, 1);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();

      return source;
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    }
  }, []);

  return { playAudio };
}