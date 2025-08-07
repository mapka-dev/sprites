import { readdirSync, writeFile } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { generateImage, generateLayout, generateLayoutUnique, generateOptimizedImage } from "./lib/index.js";

function filepaths(dir) {
  return readdirSync(dir)
    .filter((d) => !d.match(/^\./))
    .map((d) => join(dir, d));
}

async function loadFile(file) {
  const svg = await readFile(file);
  return {
    svg,
    id: basename(file).replace(".svg", ""),
  };
}

const svgDir = resolve(import.meta.dirname, "src/__tests__/fixture", "svg");
const buffers = await Promise.all(filepaths(svgDir).map(loadFile));


/**
 * Sorts the keys of an object recursively.
 * Only works for simple objects containing strings, numbers, booleans and arrays of the same.
 */
function sortObjectKeysRecursively<T>(obj: T): T {
  if (obj === null) {
    return obj;
  }
  if (typeof obj === "string") {
    return obj;
  }
  if (typeof obj === "number") {
    return obj;
  }
  if (typeof obj === "boolean") {
    return obj;
  }
  if (typeof obj === "undefined") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeysRecursively) as T;
  }

  const sortedKeys = Object.keys(obj).sort();
  const sortedObj = {} as T;

  for (const key of sortedKeys) {
    sortedObj[key] = sortObjectKeysRecursively(obj[key]);
  }

  return sortedObj;
}

[1, 2, 4].forEach((ratio) => {
  generateLayout(
    {
      imgs: buffers,
      pixelRatio: ratio,
      format: true,
    },
    (err, formattedLayout) => {
      if (err) throw err;
      writeFile(
        resolve(import.meta.dirname, "src/__tests__/fixture", `sprite@${ratio}.json`),
        JSON.stringify(sortObjectKeysRecursively(formattedLayout), null, 2),
        "utf8",
        (err) => {
          if (err) throw err;
        },
      );
    },
  );
  generateLayout(
    {
      imgs: buffers,
      pixelRatio: ratio,
    },
    (err, layout) => {
      if (err) throw err;
      generateImage(layout, (err, image) => {
        if (err) throw err;
        writeFile(
          resolve(import.meta.dirname, "src/__tests__/fixture", `sprite@${ratio}.png`),
          image,
          (err) => {
            if (err) throw err;
          },
        );
      });
    },
  );
  
  generateLayout(
    {
      imgs: buffers,
      pixelRatio: ratio,
    },
    (err, layout) => {
      if (err) throw err;
      generateOptimizedImage(layout, {quality: 64}, (err, image) => {
        if (err) throw err;
        writeFile(
          resolve(import.meta.dirname, "src/__tests__/fixture", `sprite@${ratio}-64colors.png`),
          image,
          (err) => {
            if (err) throw err;
          },
        );
      });
    },
  );


  generateLayoutUnique(
    {
      imgs: buffers,
      pixelRatio: ratio,
      format: true,
    },
    (err, formattedLayout) => {
      if (err) throw err;
      writeFile(
        resolve(import.meta.dirname, "src/__tests__/fixture", `sprite-uniq@${ratio}.json`),
        JSON.stringify(sortObjectKeysRecursively(formattedLayout), null, 2),
        "utf8",
        (err) => {
          if (err) throw err;
        },
      );
    },
  );
  generateLayoutUnique(
    {
      imgs: buffers,
      pixelRatio: ratio,
    },
    (err, layout) => {
      if (err) throw err;
      generateImage(layout, (err, image) => {
        if (err) throw err;
        writeFile(
          resolve(import.meta.dirname, "src/__tests__/fixture", `sprite-uniq@${ratio}.png`),
          image,
          (err) => {
            if (err) throw err;
          },
        );
      });
    },
  );
});
