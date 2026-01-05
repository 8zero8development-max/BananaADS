export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  useWorker?: boolean;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  format: 'image/jpeg',
  useWorker: true,
};

// Worker instance (lazy-loaded)
let compressionWorker: Worker | null = null;
let workerSupported: boolean | null = null;

// Pending compression requests
const pendingRequests = new Map<string, {
  resolve: (value: string) => void;
  reject: (reason: Error) => void;
}>();

/**
 * Check if Web Workers and OffscreenCanvas are supported
 */
function isWorkerSupported(): boolean {
  if (workerSupported !== null) return workerSupported;
  
  try {
    workerSupported = typeof Worker !== 'undefined' && 
                      typeof OffscreenCanvas !== 'undefined';
  } catch {
    workerSupported = false;
  }
  
  return workerSupported;
}

/**
 * Get or create the compression worker
 */
function getCompressionWorker(): Worker | null {
  if (!isWorkerSupported()) return null;
  
  if (!compressionWorker) {
    try {
      // Create worker from inline code to avoid separate file loading issues
      const workerCode = `
        self.onmessage = async (event) => {
          const { type, id, imageData, width, height, quality, format } = event.data;
          
          if (type !== 'compress') return;

          try {
            const canvas = new OffscreenCanvas(width, height);
            const context = canvas.getContext('2d');
            
            if (!context) throw new Error('Failed to get canvas context');

            context.putImageData(imageData, 0, 0);

            const blob = await canvas.convertToBlob({ type: format, quality });
            const reader = new FileReaderSync();
            const arrayBuffer = reader.readAsArrayBuffer(blob);
            
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = 'data:' + format + ';base64,' + btoa(binary);

            self.postMessage({ type: 'result', id, success: true, data: base64 });
          } catch (error) {
            self.postMessage({ 
              type: 'result', 
              id, 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      compressionWorker = new Worker(URL.createObjectURL(blob));
      
      compressionWorker.onmessage = (event) => {
        const { id, success, data, error } = event.data;
        const pending = pendingRequests.get(id);
        
        if (pending) {
          pendingRequests.delete(id);
          if (success) {
            pending.resolve(data);
          } else {
            pending.reject(new Error(error || 'Compression failed'));
          }
        }
      };
      
      compressionWorker.onerror = (error) => {
        console.error('Compression worker error:', error);
        // Reject all pending requests
        pendingRequests.forEach((pending, id) => {
          pending.reject(new Error('Worker error'));
          pendingRequests.delete(id);
        });
      };
    } catch (error) {
      console.warn('Failed to create compression worker:', error);
      workerSupported = false;
      return null;
    }
  }
  
  return compressionWorker;
}

/**
 * Compress image using Web Worker (non-blocking)
 */
async function compressWithWorker(
  imageData: ImageData,
  width: number,
  height: number,
  quality: number,
  format: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<string> {
  const worker = getCompressionWorker();
  if (!worker) {
    throw new Error('Worker not available');
  }

  const id = `compress-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    
    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Compression timeout'));
      }
    }, 30000);
    
    // Wrap resolve/reject to clear timeout
    const wrappedResolve = (value: string) => {
      clearTimeout(timeout);
      resolve(value);
    };
    const wrappedReject = (reason: Error) => {
      clearTimeout(timeout);
      reject(reason);
    };
    
    pendingRequests.set(id, { resolve: wrappedResolve, reject: wrappedReject });
    
    worker.postMessage({
      type: 'compress',
      id,
      imageData,
      width,
      height,
      quality,
      format
    });
  });
}

/**
 * Compress image on main thread (fallback)
 */
function compressOnMainThread(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
  format: 'image/jpeg' | 'image/png' | 'image/webp'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL(format, quality);
}

export async function compressImage(
  base64: string,
  options: CompressionOptions = {}
): Promise<string> {
  const { maxWidth, maxHeight, quality, format, useWorker } = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = async () => {
      try {
        let width = img.width;
        let height = img.height;

        if (maxWidth && width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = Math.round(height * ratio);
        }

        if (maxHeight && height > maxHeight) {
          const ratio = maxHeight / height;
          height = maxHeight;
          width = Math.round(width * ratio);
        }

        // Try to use Web Worker for non-blocking compression
        if (useWorker && isWorkerSupported()) {
          try {
            // First, draw to canvas to get ImageData
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, width, height);
              const imageData = ctx.getImageData(0, 0, width, height);
              
              const result = await compressWithWorker(imageData, width, height, quality!, format!);
              resolve(result);
              return;
            }
          } catch (workerError) {
            console.warn('Worker compression failed, falling back to main thread:', workerError);
          }
        }

        // Fallback to main thread compression
        const compressedBase64 = compressOnMainThread(img, width, height, quality!, format!);
        resolve(compressedBase64);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    img.src = base64;
  });
}

/**
 * Terminate the compression worker to free resources
 */
export function terminateCompressionWorker(): void {
  if (compressionWorker) {
    compressionWorker.terminate();
    compressionWorker = null;
  }
  pendingRequests.clear();
}

export async function compressImageFile(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64, options);
        resolve(compressed);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

export function getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = base64;
  });
}

export function estimateBase64Size(base64: string): number {
  const base64Data = base64.split(',')[1] || base64;
  return Math.round((base64Data.length * 3) / 4);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
