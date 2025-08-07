/** biome-ignore-all lint/suspicious/noExplicitAny: todo */

import { globSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import mapnik from "@mapnik/mapnik";
import { describe, expect, test } from "vitest";
import {
  generateImage,
  generateLayout,
  generateLayoutUnique,
  generateOptimizedImage,
} from "../generate.js";

const emptyPNG = new mapnik.Image(1, 1).encodeSync("png");

const fixtures = globSync(resolve(join(import.meta.dirname, "/fixture/svg/*.svg"))).map((im) => ({
  svg: readFileSync(im),
  id: basename(im).replace(".svg", ""),
}));

function getFixtures() {
  return fixtures.sort(() => Math.random() - 0.5);
}

test("generateLayout", () => {
  generateLayout(
    { imgs: getFixtures(), pixelRatio: 1, format: false },
    (err?: Error, layout?: any) => {
      expect(err).toBeNull();
      expect(layout.items.length).toBe(362);
      expect(layout.items[0].x).toBe(0);
      expect(layout.items[0].y).toBe(0);
    },
  );
});

test("generateLayout with icon size filter", () => {
  generateLayout(
    {
      imgs: getFixtures(),
      pixelRatio: 1,
      format: false,
      removeOversizedIcons: true,
      maxIconSize: 15,
    },
    (err?: Error, layout?: any) => {
      expect(err).toBeNull();
      expect(layout.items.length).toBe(119);
      expect(layout.items[0].x).toBe(0);
      expect(layout.items[0].y).toBe(0);
    },
  );
});



test("generateLayoutUnique", () => {
  generateLayoutUnique(
    {
      imgs: getFixtures(),
      pixelRatio: 1,
      format: false,
    },
    (err?: Error, layout?: any) => {
      expect(err).toBeNull();
      // unique-24.svg and unique-24-copy.svg are unique
      expect(layout.items.length).toBe(361);
      expect(layout.items[0].x).toBe(0);
      expect(layout.items[0].y).toBe(0);
    },
  );
});

test("generateLayout", () => {
  generateLayout(
    {
      imgs: getFixtures(),
      pixelRatio: 1,
      format: true,
    },
    (err?: Error, formatted?: any) => {
      expect(err).toBeNull();
      expect(Object.keys(formatted).length).toBe(362);
      // unique-24.svg and unique-24-copy.svg are NOT deduped
      // so the json references different x/y
      expect(formatted["unique-24"]).not.toEqual(formatted["unique-24-copy"]);
    },
  );
});

test("generateLayoutUnique", () => {
  generateLayoutUnique(
    {
      imgs: getFixtures(),
      pixelRatio: 1,
      format: true,
    },
    (err?: Error, formatted?: any) => {
      expect(err).toBeNull();
      // unique-24.svg and unique-24-copy.svg are deduped into a single one
      // but the json still references both, so still 362
      expect(Object.keys(formatted).length).toBe(362);
      // should be same x/y
      expect(formatted["unique-24"]).toEqual(formatted["unique-24-copy"]);
    },
  );
});

describe("generateImage", () => {
  test.each([[1], [2], [4]])("@%i scale", async (scale) => {
    const pngPath = resolve(join(import.meta.dirname, `fixture/sprite@${scale}.png`));
    const png = readFileSync(pngPath);
    const jsonPath = resolve(join(import.meta.dirname, `fixture/sprite@${scale}.json`));
    const json = JSON.parse(readFileSync(jsonPath, { encoding: "utf-8" }));

    await new Promise<void>((resolve, reject) => {
      generateLayout(
        { imgs: getFixtures(), pixelRatio: scale, format: true },
        (err?: Error, formatted?: object) => {
          if (err) reject(err);

          generateLayout(
            { imgs: getFixtures(), pixelRatio: scale, format: false },
            (err?: Error, layout?: any) => {
              if (err) reject(err);
              expect(formatted).toEqual(json);

              generateImage(layout, (err?: Error, res?: any) => {
                if (err) reject(err);
                expect(res).toBeInstanceOf(Buffer);

                expect(Math.abs(res.length - png.length)).toBeLessThan(1000);
                resolve();
              });
            },
          );
        },
      );
    });
  });
});

// Generating both a valid layout and image in one pass
describe("generateImage with format:true", () => {
  test.each([[1], [2], [4]])("@%i scale", async (scale) => {
    const optimizedPngPath = resolve(
      join(import.meta.dirname, "fixture/sprite@" + scale + "-64colors.png"),
    );
    const png = readFileSync(optimizedPngPath);

    await new Promise<void>((resolve, reject) => {
      generateLayout(
        {
          imgs: getFixtures(),
          pixelRatio: scale,
          format: true,
        },
        (err?: Error, dataLayout?: any, imageLayout?: any) => {
          if (err) reject(err);
          expect(imageLayout).toBeInstanceOf(Object);
          expect(dataLayout).toBeInstanceOf(Object);

          generateOptimizedImage(imageLayout, { quality: 64 }, (err?: Error, res?: any) => {
            if (err) reject(err);
            expect(res).toBeInstanceOf(Buffer);

            expect(Math.abs(res.length - png.length)).toBeLessThan(1000);
            resolve();
          });
        },
      );
    });
  });
});

describe("generateImageUnique", async () => {
  test.each([[1], [2], [4]])("@%i scale", async (scale) => {
    const pngPath = resolve(join(import.meta.dirname, `fixture/sprite-uniq@${scale}.png`));
    const png = readFileSync(pngPath);
    const jsonPath = resolve(join(import.meta.dirname, `fixture/sprite-uniq@${scale}.json`));
    const json = JSON.parse(readFileSync(jsonPath, { encoding: "utf-8" }));

    await new Promise<void>((resolve, reject) => {
      generateLayoutUnique(
        { imgs: getFixtures(), pixelRatio: scale, format: true },
        (err?: Error, formatted?: object) => {
          if (err) reject(err);

          generateLayoutUnique(
            { imgs: getFixtures(), pixelRatio: scale, format: false },
            (err?: Error, layout?: any) => {
              if (err) reject(err);
              expect(formatted).toEqual(json);

              generateImage(layout, (err?: Error, res?: any) => {
                if (err) reject(err);
                expect(res).toBeInstanceOf(Buffer);

                expect(Math.abs(res.length - png.length)).toBeLessThan(1000);
                resolve();
              });
            },
          );
        },
      );
    });
  });
});

test("generateLayout with empty input", () => {
  generateLayout({ imgs: [], pixelRatio: 1, format: true }, (err?: Error, layout?: any) => {
    expect(err).toBeNull();
    expect(layout).toEqual({});
  });
});

test("generateLayoutUnique with empty input", () => {
  generateLayoutUnique({ imgs: [], pixelRatio: 1, format: true }, (err?: Error, layout?: any) => {
    expect(err).toBeNull();
    expect(layout).toEqual({});
  });
});

test("generateImage with empty input", () => {
  generateLayout({ imgs: [], pixelRatio: 1, format: false }, (err?: Error, layout?: any) => {
    expect(err).toBeNull();
    generateImage(layout, (err?: Error, sprite?: any) => {
      expect(err).toBeNull();
      expect(sprite).toBeDefined();
      expect(sprite).toBeInstanceOf(Object);
    });
  });
});

test("generateImage unique with empty input", () => {
  generateLayoutUnique({ imgs: [], pixelRatio: 1, format: false }, (err?: Error, layout?: any) => {
    expect(err).toBeNull();
    generateImage(layout, (err?: Error, sprite?: any) => {
      expect(err).toBeNull();
      expect(sprite).toBeDefined();
      expect(sprite).toBeInstanceOf(Object);
    });
  });
});

test("generateImage unique with max_size", () => {
  generateLayoutUnique(
    { imgs: getFixtures(), pixelRatio: 1, format: false, maxIconSize: 10 },
    (err: Error | null) => {
      expect(err).toBeInstanceOf(Error);
      expect(err?.message).toMatch(
        /image created from svg must be \d+ pixels or fewer on each side/,
      );
    },
  );
});

test("generateLayout relative width/height SVG returns empty", () => {
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

  generateLayout(
    { imgs: fixtures, pixelRatio: 1, format: true },
    (err?: Error, formatted?: object) => {
      expect(err).toBeNull();
      expect(formatted).toEqual({
        art: { width: 18, height: 18, x: 0, y: 0, pixelRatio: 1 },
      });
    },
  );
});

test("generateLayout only relative width/height SVG returns empty sprite object", () => {
  var fixtures = [
    {
      id: "relative-dimensions",
      svg: readFileSync(join(import.meta.dirname, "./fixture/relative-dimensions.svg")),
    },
  ];

  generateLayout({ imgs: fixtures, pixelRatio: 1, format: false }, (err?: Error, layout?: any) => {
    expect(err).toBeNull();
    // empty layout
    expect(layout).toEqual({ width: 1, height: 1, items: [] });

    generateImage(layout, (err?: Error, image?: any) => {
      expect(err).toBeNull();
      //only "art" is in layout
      expect(image).toEqual(emptyPNG);
    });
  });
});

test("generateLayout containing image with no width or height SVG", () => {
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

  generateLayout(
    { imgs: fixtures, pixelRatio: 1, format: true },
    (err?: Error, formatted?: object) => {
      expect(err).toBeNull();

      //only "art" is in layout
      expect(formatted).toEqual({ art: { width: 18, height: 18, x: 0, y: 0, pixelRatio: 1 } });
    },
  );
});

test("generateLayout containing only image with no width or height", () => {
  var fixtures = [
    {
      id: "no-width-or-height",
      svg: readFileSync(join(import.meta.dirname, "./fixture/no-width-or-height.svg")),
    },
  ];

  generateLayout({ imgs: fixtures, pixelRatio: 1, format: false }, (err?: Error, layout?: any) => {
    expect(err).toBeNull();

    // empty layout
    expect(layout).toEqual({ width: 1, height: 1, items: [] });

    generateImage(layout, (err?: Error, image?: any) => {
      expect(err).toBeNull();
      //empty PNG response
      expect(image).toEqual(emptyPNG);
    });
  });
});

test("generateLayout with extractMetadata option set to false", () => {
  var fixtures = [
    {
      id: "cn",
      svg: readFileSync(
        join(import.meta.dirname, "./fixture/svg-metadata/cn-nths-expy-2-affinity.svg"),
      ),
    },
  ];

  generateLayout(
    { imgs: fixtures, pixelRatio: 1, format: true, extractMetadata: false },
    (err?: Error, formatted?: object) => {
      expect(err).toBeNull();
      expect(formatted).toEqual({ cn: { width: 20, height: 23, x: 0, y: 0, pixelRatio: 1 } });
    },
  );
});

test("generateLayout without extractMetadata option set (defaults to true)", () => {
  var fixtures = [
    {
      id: "cn",
      svg: readFileSync(
        join(import.meta.dirname, "./fixture/svg-metadata/cn-nths-expy-2-affinity.svg"),
      ),
    },
  ];

  generateLayout(
    { imgs: fixtures, pixelRatio: 1, format: true },
    (err?: Error, formatted?: object) => {
      expect(err).toBeNull();
      expect(formatted).toEqual({
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
    },
  );
});

test("generateLayout without extractMetadata option set (defaults to true) when generating an image layout (format set to false)", () => {
  const fixtures = [
    {
      id: "cn",
      svg: readFileSync(
        join(import.meta.dirname, "./fixture/svg-metadata/cn-nths-expy-2-affinity.svg"),
      ),
    },
  ];

  generateLayout(
    { imgs: fixtures, pixelRatio: 1, format: false },
    (err?: Error, formatted?: any) => {
      expect(err).toBeNull();
      expect(formatted.items[0].stretchX).toBeUndefined();
    },
  );
});

test("generateLayout with both placeholder and stretch zone", () => {
  const fixtures = [
    {
      id: "au-national-route-5",
      svg: readFileSync(
        join(import.meta.dirname, "./fixture/svg-metadata/au-national-route-5.svg"),
      ),
    },
  ];
  generateLayout(
    { imgs: fixtures, pixelRatio: 1, format: true },
    (err?: Error, formatted?: object) => {
      expect(err).toBeNull();
      expect(formatted).toEqual({
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
    },
  );
});
