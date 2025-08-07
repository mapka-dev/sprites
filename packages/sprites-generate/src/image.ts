import type { Buffer } from "node:buffer";
import mapnik from "@mapnik/mapnik";
import type { ImgLayout } from "./types.js";

const emptyPNG = new mapnik.Image(1, 1).encodeSync("png");

/**
 * Generate a PNG image with positioned icons on a sprite.
 *
 */
export function generateImage(layout: ImgLayout): Promise<Buffer> {
  if (typeof layout !== "object") {
    throw new Error("layout must be an object");
  }

  if (!layout.items.length) return Promise.resolve(emptyPNG);

  const {
    width,
    height,
    items,
  } = layout;

  return new Promise<Buffer>((resolve, reject) => {
    mapnik.blend(
      items,
      {
        width,
        height,
      },
      (err?: Error | null, image?: Buffer) => {
        if (err) return reject(err);
        if (!image) return reject();

        resolve(image);
      },
    );
  });
}

interface OptimizationOptions {
  quality?: number;
}

/**
 * Generate a PNG image with positioned icons on a sprite.
 *
 */
export function generateOptimizedImage(layout: ImgLayout, {quality = 128}: OptimizationOptions): Promise<Buffer> {
  if (typeof layout !== "object") {
    throw new Error("layout must be an object");
  }

  if (!layout.items.length) return Promise.resolve(emptyPNG);

  const {
    width,
    height,
    items,
  } = layout;
  

    return new Promise<Buffer>((resolve, reject) => {
    mapnik.blend(
      items,
      {
        format: "png",
        mode: "hextree",
        quality,
        width,
        height,
      },
      (err?: Error | null, image?: Buffer) => {
        if (err) return reject(err);
        if (!image) return reject();

        resolve(image);
      },
    );
  });

}
