/**
 * Web Worker for image compression
 * Offloads CPU-intensive image processing from the main thread
 */

export interface CompressionMessage {
  type: 'compress';
  id: string;
  imageData: ImageData;
  width: number;
  height: number;
  quality: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface CompressionResult {
  type: 'result';
  id: string;
  success: boolean;
  data?: string;
  error?: string;
}

// Worker context
const ctx: Worker = self as unknown as Worker;

ctx.onmessage = async (event: MessageEvent<CompressionMessage>) => {
  const { type, id, imageData, width, height, quality, format } = event.data;
  
  if (type !== 'compress') {
    return;
  }

  try {
    // Create OffscreenCanvas for worker-based rendering
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    // Put the image data on the canvas
    context.putImageData(imageData, 0, 0);

    // Convert to blob with compression
    const blob = await canvas.convertToBlob({
      type: format,
      quality: quality
    });

    // Convert blob to base64
    const reader = new FileReaderSync();
    const arrayBuffer = reader.readAsArrayBuffer(blob);
    const base64 = arrayBufferToBase64(arrayBuffer, format);

    const result: CompressionResult = {
      type: 'result',
      id,
      success: true,
      data: base64
    };
    
    ctx.postMessage(result);
  } catch (error) {
    const result: CompressionResult = {
      type: 'result',
      id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    ctx.postMessage(result);
  }
};

function arrayBufferToBase64(buffer: ArrayBuffer, mimeType: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

export {};
