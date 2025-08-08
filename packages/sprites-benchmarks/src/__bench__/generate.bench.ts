import { globSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { describe } from "node:test";
import {
  type DataLayout,
  type ImgLayout,
  generateImage as mapboxGenerateImage,
  generateLayout as mapboxGenerateLayout,
} from "@mapbox/spritezero";
import {
  generateImage as mapkaGenerateImage,
  generateLayout as mapkaGenerateLayout,
} from "@mapka/sprites-generate";

import { bench } from "vitest";

console.log(
  resolve(join(import.meta.dirname, "../../../sprites-generate/src/__tests__/fixture/svg/*.svg")),
);

const fixtures = globSync(
  resolve(join(import.meta.dirname, "../../../sprites-generate/src/__tests__/fixture/svg/*.svg")),
).map((im) => ({
  svg: readFileSync(im),
  id: basename(im).replace(".svg", ""),
}));

describe("scale 1x", () => {
  bench("generate sprite @mapka/sprites-generate", async () => {
    const layout = await mapkaGenerateLayout({
      imgs: fixtures,
      pixelRatio: 1,
      format: false,
    });

    await mapkaGenerateImage(layout);
  });

  bench("generate sprite @mapka/sprites-generate", async () => {
    await new Promise((resolve) => {
      mapboxGenerateLayout(
        {
          imgs: fixtures,
          pixelRatio: 2,
          format: false,
        },
        (err?: Error | null, layout?: ImgLayout | DataLayout) => {
          if (err || !layout) {
            throw err;
          }
          mapboxGenerateImage(layout as ImgLayout, (err?: Error | null, image?: Buffer) => {
            if (err) {
              throw err;
            }
            resolve(image);
          });
        },
      );
    });
  });
});
