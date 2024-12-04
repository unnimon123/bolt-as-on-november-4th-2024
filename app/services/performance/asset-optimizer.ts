import sharp from 'sharp';
import { StorageService } from '../storage-service';

export class AssetOptimizer {
  private static instance: AssetOptimizer;
  private readonly IMAGE_QUALITY = 80;
  private readonly MAX_WIDTH = 1200;

  private constructor() {}

  static getInstance(): AssetOptimizer {
    if (!AssetOptimizer.instance) {
      AssetOptimizer.instance = new AssetOptimizer();
    }
    return AssetOptimizer.instance;
  }

  async optimizeImage(
    imageBuffer: Buffer,
    options: {
      width?: number;
      quality?: number;
      format?: 'jpeg' | 'webp' | 'png';
    } = {}
  ): Promise<Buffer> {
    const width = options.width || this.MAX_WIDTH;
    const quality = options.quality || this.IMAGE_QUALITY;
    const format = options.format || 'webp';

    let optimizer = sharp(imageBuffer)
      .resize(width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });

    switch (format) {
      case 'webp':
        optimizer = optimizer.webp({ quality });
        break;
      case 'jpeg':
        optimizer = optimizer.jpeg({ quality });
        break;
      case 'png':
        optimizer = optimizer.png({ quality });
        break;
    }

    return optimizer.toBuffer();
  }

  async optimizeAndUpload(
    imageBuffer: Buffer,
    path: string,
    options?: {
      width?: number;
      quality?: number;
      format?: 'jpeg' | 'webp' | 'png';
    }
  ): Promise<string> {
    const optimizedBuffer = await this.optimizeImage(imageBuffer, options);
    return StorageService.uploadBuffer(optimizedBuffer, path);
  }

  generateSrcSet(
    baseUrl: string,
    widths: number[] = [320, 640, 960, 1200]
  ): string {
    return widths
      .map(width => `${baseUrl}?w=${width} ${width}w`)
      .join(', ');
  }
}