import { readdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { generateImage, generateOptimizedImage } from "./lib/image.js";
import { generateLayout, generateLayoutUnique } from "./lib/index.js";

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

[1, 2, 4].forEach(async (ratio) => {
  const dataLayout = await generateLayout(
    {
      imgs: buffers,
      pixelRatio: ratio,
      format: true,
    });
  await writeFile(
    resolve(import.meta.dirname, "src/__tests__/fixture", `sprite@${ratio}.json`),
    JSON.stringify(sortObjectKeysRecursively(dataLayout), null, 2),
    "utf8",
  );


  const imgLayout = await generateLayout(
    {
      imgs: buffers,
      pixelRatio: ratio,
      format: false,
    });

  const image = await generateImage(imgLayout);
  await writeFile(
    resolve(import.meta.dirname, "src/__tests__/fixture", `sprite@${ratio}.png`),
    image,
  );
  const imageOptimized = await generateOptimizedImage(imgLayout, { quality: 64 });
  await writeFile(
    resolve(import.meta.dirname, "src/__tests__/fixture", `sprite@${ratio}-64colors.png`),
    imageOptimized,
  );


  const dataLayoutUnique = await generateLayoutUnique(
    {
      imgs: buffers,
      pixelRatio: ratio,
      format: true,
    });
  await writeFile(
    resolve(import.meta.dirname, "src/__tests__/fixture", `sprite-uniq@${ratio}.json`),
    JSON.stringify(sortObjectKeysRecursively(dataLayoutUnique), null, 2),
    "utf8",
  );
  const imgLayoutUnique = await generateLayoutUnique(
    {
      imgs: buffers,
      pixelRatio: ratio,
      format: false,
    });
  const imageUnique = await generateImage(imgLayoutUnique);
  await writeFile(
    resolve(import.meta.dirname, "src/__tests__/fixture", `sprite-uniq@${ratio}.png`),
    imageUnique,
  );
});
