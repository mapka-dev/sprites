import ShelfPack from "@mapka/shelf-pack";
import mapnik from "@mapnik/mapnik";
import { extractSvgMetadata } from "./metadata.js";
import type { DataLayout, DataSvgImage, ImgLayout, SvgImage } from "./types.js";
import type { Metadata } from "./validate.js";

interface Item {
  height: number;
  width: number;
  id: string;
}

function heightAscThanNameComparator(a: Item, b: Item) {
  return b.height - a.height || (a.id === b.id ? 0 : a.id < b.id ? -1 : 1);
}

function isNotNull<T>(value: T | null): value is T {
  return value !== null
}

export interface Img {
  svg: Buffer;
  id: string;
}

export interface GenerateLayoutOptions {
  /**
   * Overrides the max_size in mapnik
   */
  maxIconSize?: number;
  /**
   * If set, filters out icons that mapnik says are too big
   */
  removeOversizedIcons?: boolean;

  /** 
   * If set, filters out icons that have no height or width attribute set
   * @default true
   */
  removeSizeMissingIcons?: boolean;

  /**
   * If false, omits stretch and placeholder metadata (`content`, `stretchX`, `stretchY`, `placeholder`) in {@link DataLayout}
   * @default true
   */
  extractMetadata?: boolean;
  /**
   * If true, generate {@link DataLayout} as first argument to callback and {@link ImgLayout} as the second argument; if false, generate only {@link ImgLayout} as the first argument to the callback function
   */
  format: boolean;
  pixelRatio: number;
  imgs: Img[];
}

export type LayoutResult<T extends GenerateLayoutOptions> = T["format"] extends true
  ? DataLayout
  : ImgLayout;


const oversizedRe = /image created from svg must be \d+ pixels or fewer on each side/;
const emptyRe = /image created from svg must have a width and height greater (then|than) zero/;

type NotPackedShelfPacked<T extends {x: number, y: number}> = Omit<T, 'x' | 'y'>;

/**
 * Create an image from an svg data
 */
function createImage(
  img: Img,
  options: GenerateLayoutOptions,
): Promise<NotPackedShelfPacked<SvgImage> | NotPackedShelfPacked<DataSvgImage> | null> {
  const { svg, id } = img;
  const {
    pixelRatio,
    maxIconSize,
    removeOversizedIcons,
    removeSizeMissingIcons,
    extractMetadata,
    format
  } = options;

  const svgImageOptions: { scale: number, max_size?: number } = {
    scale: pixelRatio,
  };
  if (typeof maxIconSize === 'number') {
    svgImageOptions.max_size = maxIconSize;
  }

  return new Promise<NotPackedShelfPacked<SvgImage> | NotPackedShelfPacked<DataSvgImage> | null>((resolve, reject) => {
    mapnik.Image.fromSVGBytes(
      svg,
      svgImageOptions,
      (err, image) => {
        if (err) {
          // Produce null result if image was too big and removeOversizedIcons is true
          // Check for specific error message to avoid false positive
          if (
            removeOversizedIcons && err.message.match(oversizedRe)) {
            return resolve(null);
          }
          // Produce a null result if no width or height attributes and removeSizeMissingIcons is true
          // The error message from mapnik has a typo "then"; account for potential future fix to "than".
          if (removeSizeMissingIcons && err.message.match(emptyRe)) {
            return resolve(null);
          }
          // Any other error is a real error
          return reject(err);
        }
        const height = image.height();
        const width = image.width();

        if (!width || !height) {
          return resolve(null);
        }

        // For the data layout JSON (when options.format is true), extract stretch and placeholder metadata if present
        // In addition to mapka-stretch and mapka-text-placeholder, also check for mapbox-stretch and mapbox-text-placeholder
        if (format && extractMetadata) {
          if (
            svg.includes("mapbox-stretch") ||
            svg.includes("mapbox-text-placeholder") ||
            svg.includes("mapka-stretch") ||
            svg.includes("mapka-text-placeholder")
          ) {
            extractSvgMetadata({ svg, pixelRatio }, (err: Error | null, metadata: Metadata) => {
              if (err) return reject(err);

              return resolve({
                svg,
                id,
                width,
                height,
                buffer: image,
                ...metadata,
              });
            });
            return;
          }
        }
        return resolve({
          svg,
          id,
          width,
          height,
          buffer: image,
        });
      },
    );
  });
}

async function createImages(options: GenerateLayoutOptions) {
  const images = await Promise.all(options.imgs.map((img) => createImage(img, options)));

  // Remove nulls because of removeSizeMissingIcons, removeOversizedIcons
  const nonNullImages = images.filter(isNotNull);

  // Sort images by height ascending and by id ascending
  const sortedImages = nonNullImages.toSorted(heightAscThanNameComparator);

  return sortedImages;
}

function normalizeOptions<T extends GenerateLayoutOptions>(options: T): T {
  const {
    extractMetadata = true,
    removeSizeMissingIcons = true,
    pixelRatio,
    imgs = []
  } = options;

  if (!Array.isArray(imgs)) {
    throw new Error("imgs must be an array");
  }
  if (!Number.isInteger(pixelRatio)) {
    throw new Error("pixelRatio must be a number");
  }

  return {
    ...options,
    pixelRatio,
    extractMetadata,
    removeSizeMissingIcons,
    imgs,
  };
}

/**
 * Pack a list of images with width and height into a sprite layout.
 * options object with the following keys:
 * Generated Layout Object with sprite contents
 */
export async function generateLayout<T extends GenerateLayoutOptions>(
  options: T,
): Promise<LayoutResult<T>> {
  const normalizedOptions = normalizeOptions(options);

  // Create images from all svg images using same options
  const allImages = await createImages(normalizedOptions);

  /**
   * Create a ShelfPack instance with autoResize = true
   * Pack all images into the sprite
   * Packing will mutate the images in place and add `x` and `y` properties
   */
  const sprite = new ShelfPack(1, 1, { autoResize: true });
  sprite.pack(allImages, {
    inPlace: true
  });

  if (normalizedOptions.format === false) {
    return {
      width: sprite.w,
      height: sprite.h,
      items: allImages as SvgImage[]
    } as LayoutResult<T>;
  }

  if (normalizedOptions.format === true) {
    const dataLayout: DataLayout = {};
    (allImages as DataSvgImage[]).forEach((item) => {
      dataLayout[item.id] = {
        width: item.width,
        height: item.height,
        x: item.x,
        y: item.y,
        pixelRatio: options.pixelRatio
      };

      if (item.placeholder) {
        dataLayout[item.id].placeholder = item.placeholder;
      }
      if (item.content) {
        dataLayout[item.id].content = item.content;
      }
      if (item.stretchX) {
        dataLayout[item.id].stretchX = item.stretchX;
      }
      if (item.stretchY) {
        dataLayout[item.id].stretchY = item.stretchY;
      }
    });
    return dataLayout as LayoutResult<T>;
  }

  throw new Error("Invalid format");
}

/**
 * Same as generateLayout but can be used to dedupe identical SVGs
 * and still preserve the reference.
 *
 * For example if `A.svg` and `B.svg` are identical, a single icon
 * will be in the sprite image and both A and B will reference the same image
 *
 */
export async function generateLayoutUnique<T extends GenerateLayoutOptions>(
  options: T,
): Promise<LayoutResult<T>> {
  const normalizedOptions = normalizeOptions(options);

  /* The svg signature of each item */
  const svgPerItemId: Record<string, string> = {};

  /* The items for each SVG signature */
  const itemIdsPerSvg: Record<string, string[]> = {};

  normalizedOptions.imgs.forEach((item) => {
    var svg = item.svg.toString("base64");

    svgPerItemId[item.id] = svg;

    if (svg in itemIdsPerSvg) {
      itemIdsPerSvg[svg].push(item.id);
    } else {
      itemIdsPerSvg[svg] = [item.id];
    }
  });

  /* Only keep 1 item per svg signature for packing */
  normalizedOptions.imgs = normalizedOptions.imgs.filter((item) => {
    var svg = svgPerItemId[item.id];
    return item.id === itemIdsPerSvg[svg][0];
  });

  const allImages = await createImages(normalizedOptions);

  /**
   * Create a ShelfPack instance with autoResize = true
   * Pack all images into the sprite
   * Packing will mutate the images in place and add `x` and `y` properties
   */
  const sprite = new ShelfPack(1, 1, { autoResize: true });
  sprite.pack(allImages, {
    inPlace: true
  });

  if (normalizedOptions.format) {
    const dataLayout: DataLayout = {};
    (allImages as DataSvgImage[]).forEach((item) => {
      const svg = svgPerItemId[item.id];
      const itemIdsToUpdate = itemIdsPerSvg[svg];

      itemIdsToUpdate.forEach((itemIdToUpdate) => {
        dataLayout[itemIdToUpdate] = {
          width: item.width,
          height: item.height,
          x: item.x,
          y: item.y,
          pixelRatio: options.pixelRatio
        };

        if (item.placeholder) {
          dataLayout[itemIdToUpdate].placeholder = item.placeholder;
        }
        if (item.content) {
          dataLayout[itemIdToUpdate].content = item.content;
        }
        if (item.stretchX) {
          dataLayout[itemIdToUpdate].stretchX = item.stretchX;
        }
        if (item.stretchY) {
          dataLayout[itemIdToUpdate].stretchY = item.stretchY;
        }
      });
    });
    return dataLayout as LayoutResult<T>;
  }

  return {
    width: sprite.w,
    height: sprite.h,
    items: allImages as SvgImage[]
  } as LayoutResult<T>;
}

