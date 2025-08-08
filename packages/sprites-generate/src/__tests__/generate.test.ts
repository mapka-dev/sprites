/** biome-ignore-all lint/suspicious/noExplicitAny: todo */

import { globSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import mapnik from "@mapnik/mapnik";
import { describe, expect, test } from "vitest";
import { generateLayout, generateLayoutUnique } from "../generate.js";

import { generateImage, generateOptimizedImage } from "../image.js";

const emptyPNG = new mapnik.Image(1, 1).encodeSync("png");

const fixtures = globSync(resolve(join(import.meta.dirname, "/fixture/svg/*.svg"))).map((im) => ({
  svg: readFileSync(im),
  id: basename(im).replace(".svg", ""),
}));

function getFixtures() {
  return fixtures.sort(() => Math.random() - 0.5);
}

test("generateLayout", async () => {
  const layout = await generateLayout({ imgs: getFixtures(), pixelRatio: 1, format: false });

  expect(layout.items.length).toBe(362);
  expect(layout.items[0].x).toBe(0);
  expect(layout.items[0].y).toBe(0);
});

test("generateLayout with icon size filter", async () => {
  const layout = await generateLayout({
    imgs: getFixtures(),
    pixelRatio: 1,
    format: false,
    removeOversizedIcons: true,
    maxIconSize: 15,
  });

  expect(layout.items.length).toBe(119);
  expect(layout.items[0].x).toBe(0);
  expect(layout.items[0].y).toBe(0);
});

test("generateLayoutUnique", async () => {
  const layout = await generateLayoutUnique({
    imgs: getFixtures(),
    pixelRatio: 1,
    format: false,
  });
  expect(layout.items.length).toBe(361);
  expect(layout.items[0].x).toBe(0);
  expect(layout.items[0].y).toBe(0);
});

test("generateLayout", async () => {
  const layout = await generateLayout({
    imgs: getFixtures(),
    pixelRatio: 1,
    format: true,
  });
  expect(Object.keys(layout).length).toBe(362);
  // unique-24.svg and unique-24-copy.svg are NOT deduped
  // so the json references different x/y
  expect(layout["unique-24"]).not.toEqual(layout["unique-24-copy"]);
});

test("generateLayoutUnique", async () => {
  const layout = await generateLayoutUnique({
    imgs: getFixtures(),
    pixelRatio: 1,
    format: true,
  });
  expect(Object.keys(layout).length).toBe(362);
  // unique-24.svg and unique-24-copy.svg are deduped into a single one
  // but the json still references both, so still 362
  expect(layout["unique-24"]).toEqual(layout["unique-24-copy"]);
});

describe("generateImage", () => {
  test.each([[1], [2], [4]])("@%i scale", async (scale) => {
    const pngPath = resolve(join(import.meta.dirname, `fixture/sprite@${scale}.png`));
    const png = readFileSync(pngPath);
    const jsonPath = resolve(join(import.meta.dirname, `fixture/sprite@${scale}.json`));
    const json = JSON.parse(readFileSync(jsonPath, { encoding: "utf-8" }));

    const formatted = await generateLayout({
      imgs: getFixtures(),
      pixelRatio: scale,
      format: true,
    });
    expect(formatted).toEqual(json);

    const dataLayout = await generateLayout({
      imgs: getFixtures(),
      pixelRatio: scale,
      format: false,
    });
    const spriteImage = await generateImage(dataLayout);

    expect(spriteImage).toBeInstanceOf(Buffer);
    expect(Math.abs(spriteImage.length - png.length)).toBeLessThan(1000);
  });
});

// Generating both a valid layout and image in one pass
describe("generateImage with format:true", () => {
  test.each([[1], [2], [4]])("@%i scale", async (scale) => {
    const optimizedPngPath = resolve(
      join(import.meta.dirname, `fixture/sprite@${scale}-64colors.png`),
    );
    const png = readFileSync(optimizedPngPath);


    const dataLayout = await generateLayout(
      {
        imgs: getFixtures(),
        pixelRatio: scale,
        format: true,
      });
    const imageLayout = await generateLayout(
      {
        imgs: getFixtures(),
        pixelRatio: scale,
        format: false,
      });

    expect(imageLayout).toBeInstanceOf(Object);
    expect(dataLayout).toBeInstanceOf(Object);

    const image = await generateOptimizedImage(imageLayout, { quality: 64 });
    expect(image).toBeInstanceOf(Buffer);
    expect(Math.abs(image.length - png.length)).toBeLessThan(1000);
    resolve();
  });
});

describe("generateImageUnique", async () => {
  test.each([[1], [2], [4]])("@%i scale", async (scale) => {
    const pngPath = resolve(join(import.meta.dirname, `fixture/sprite-uniq@${scale}.png`));
    const png = readFileSync(pngPath);
    const jsonPath = resolve(join(import.meta.dirname, `fixture/sprite-uniq@${scale}.json`));
    const json = JSON.parse(readFileSync(jsonPath, { encoding: "utf-8" }));


    const dataLayout = await generateLayoutUnique({
      imgs: getFixtures(),

      pixelRatio: scale,
      format: true
    },
    );
    expect(dataLayout).toEqual(json);

    const imgLayout = await generateLayoutUnique({
      imgs: getFixtures(),
      pixelRatio: scale,
      format: false
    });
    const image = await generateImage(imgLayout);
    expect(image).toBeInstanceOf(Buffer);

    expect(Math.abs(image.length - png.length)).toBeLessThan(1000);
  });
});

test("generateLayout with empty input", async () => {
  const layout = await generateLayout({ imgs: [], pixelRatio: 1, format: true });
  expect(layout).toEqual({});
});

test("generateLayoutUnique with empty input", async () => {
  const layout = await generateLayoutUnique({ imgs: [], pixelRatio: 1, format: true });
  expect(layout).toEqual({});
});

test("generateImage with empty input", async () => {
  const layout = await generateLayout({ imgs: [], pixelRatio: 1, format: false });
  const image = await generateImage(layout);
  expect(image).toBeInstanceOf(Buffer);
});

test("generateImage unique with empty input", async () => {
  const layout = await generateLayoutUnique({ imgs: [], pixelRatio: 1, format: false });
  const image = await generateImage(layout);
  expect(image).toBeInstanceOf(Buffer);
});

test("generateImage unique with max_size", async () => {
  await expect(
    () => generateLayoutUnique({ imgs: getFixtures(), pixelRatio: 1, format: false, maxIconSize: 10 }))
    .rejects.toThrowError(/image created from svg must be \d+ pixels or fewer on each side/);
});

test("generateLayout relative width/height SVG returns empty", async () => {
  var fixtures = [
    {
      id: "relative-dimensions",
      svg: readFileSync(join(import.meta.dirname, "./fixture/relative-dimensions.svg")),
    },
    {
      id: "art",
      svg: readFileSync(join(import.meta.dirname, "./fixture/svg/art-gallery-18.svg")),
    },
  ];

  const layout = await generateLayout({ imgs: fixtures, pixelRatio: 1, format: true });
  expect(layout).toEqual({
    art: { width: 18, height: 18, x: 0, y: 0, pixelRatio: 1 },
  });
});

test("generateLayout only relative width/height SVG returns empty sprite object", async () => {
  var fixtures = [
    {
      id: "relative-dimensions",
      svg: readFileSync(join(import.meta.dirname, "./fixture/relative-dimensions.svg")),
    },
  ];

  const layout = await generateLayout({ imgs: fixtures, pixelRatio: 1, format: false });
  expect(layout).toEqual({ width: 1, height: 1, items: [] });

  const image = await generateImage(layout);
  expect(image).toEqual(emptyPNG);
});

test("generateLayout containing image with no width or height SVG", async () => {
  var fixtures = [
    {
      id: "no-width-or-height",
      svg: readFileSync(join(import.meta.dirname, "./fixture/no-width-or-height.svg")),
    },
    {
      id: "art",
      svg: readFileSync(join(import.meta.dirname, "./fixture/svg/art-gallery-18.svg")),
    },
  ];

  const layout = await generateLayout({ imgs: fixtures, pixelRatio: 1, format: true });
  // only "art" is in layout
  expect(layout).toEqual({ art: { width: 18, height: 18, x: 0, y: 0, pixelRatio: 1 } });
});

test("generateLayout containing only image with no width or height", async () => {
  var fixtures = [
    {
      id: "no-width-or-height",
      svg: readFileSync(join(import.meta.dirname, "./fixture/no-width-or-height.svg")),
    },
  ];

  const layout = await generateLayout({ imgs: fixtures, pixelRatio: 1, format: false });
  // empty layout
  expect(layout).toEqual({ width: 1, height: 1, items: [] });

  const image = await generateImage(layout);
  // empty image
  expect(image).toEqual(emptyPNG);
});

test("generateLayout with extractMetadata option set to false", async () => {
  var fixtures = [
    {
      id: "cn",
      svg: readFileSync(
        join(import.meta.dirname, "./fixture/svg-metadata/cn-nths-expy-2-affinity.svg"),
      ),
    },
  ];

  const layout = await generateLayout({
    imgs: fixtures,
    pixelRatio: 1,
    format: true,
    extractMetadata: false,
  });
  expect(layout).toEqual({ cn: { width: 20, height: 23, x: 0, y: 0, pixelRatio: 1 } });
});

test("generateLayout without extractMetadata option set (defaults to true)", async () => {
  var fixtures = [
    {
      id: "cn",
      svg: readFileSync(
        join(import.meta.dirname, "./fixture/svg-metadata/cn-nths-expy-2-affinity.svg"),
      ),
    },
  ];

  const layout = await generateLayout({ imgs: fixtures, pixelRatio: 1, format: true });
  expect(layout).toEqual({
    cn: {
      width: 20,
      height: 23,
      x: 0,
      y: 0,
      pixelRatio: 1,
      content: [2, 5, 18, 18],
      stretchX: [[4, 16]],
      stretchY: [[5, 16]],
    },
  });
});

test("generateLayout without extractMetadata option set (defaults to true) when generating an image layout (format set to false)", async () => {
  const fixtures = [
    {
      id: "cn",
      svg: readFileSync(
        join(import.meta.dirname, "./fixture/svg-metadata/cn-nths-expy-2-affinity.svg"),
      ),
    },
  ];
  const layout = await generateLayout({
    imgs: fixtures,
    pixelRatio: 1,
    format: false,
  });
  // @ts-expect-error - we're testing the type
  expect(layout.items[0].stretchX).toBeUndefined();
});

test("generateLayout with both placeholder and stretch zone", async () => {
  const fixtures = [
    {
      id: "au-national-route-5",
      svg: readFileSync(
        join(import.meta.dirname, "./fixture/svg-metadata/au-national-route-5.svg"),
      ),
    },
  ];
  const layout = await generateLayout({ imgs: fixtures, pixelRatio: 1, format: true });
  expect(layout).toEqual({
    "au-national-route-5": {
      width: 38,
      height: 20,
      x: 0,
      y: 0,
      pixelRatio: 1,
      content: [3, 7, 23, 18],
      stretchX: [[5, 7]],
      placeholder: [0, 7, 38, 13],
    },
  });
});
