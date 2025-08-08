
/**
 * @see https://mapnik.org/documentation/node-mapnik/3.6/#blend
 */
interface BlendOptions {
  /** 
   * Output image format 
   */
  format?: "png" | "jpeg" | "webp";

  /** 
   * Image width in pixels 
   */
  width?: number;
  
  /** 
   * Image height in pixels 
   */
  height?: number;
  
  /** 
   * Compression level - references internal zlib compression algorithm
   * (platform-dependent values)
   */
  compression?: number;
  
  /** Whether to re-encode the image */
  reencode?: boolean;
  
  /** Enable palette-based encoding */
  palette?: boolean;
  
  /** 
   * Color quantization algorithm mode
   * - hextree: Hexadecimal tree algorithm
   * - octree: Octree algorithm
   */
  mode?: 'hextree' | 'octree';
  
  /** 
   * Image quality setting:
   * - JPEG & WebP: 0-100 (0 = lowest quality, 100 = highest quality)
   * - PNG: 2-256 (2 = highest quality, 256 = lowest quality)
   */
  quality?: number;
}

declare module "@mapnik/mapnik" {
    export class Image {
      constructor(width: number, height: number);
      width(): number;
      height(): number;
      encodeSync(format: string): Buffer;
      static fromSVGBytes(svg: Buffer, options: any, callback: (err: Error | null, image: Image) => void);
    }

    /**
     * @see https://mapnik.org/documentation/node-mapnik/3.6/#blend
     */ 
    export function blend(
      items: Buffer[] | {buffer: Image}[],
      options: BlendOptions, 
      callback: (err: Error | null, image: Buffer) => void
    );
}