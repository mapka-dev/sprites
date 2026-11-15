import { globSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
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
import { test } from "vitest";

console.log(
  resolve(join(import.meta.dirname, "../../../sprites-generate/src/__tests__/fixture/svg/*.svg")),
);

const fixtures = globSync(
  resolve(join(import.meta.dirname, "../../../sprites-generate/src/__tests__/fixture/svg/*.svg")),
).map((im) => ({
  svg: readFileSync(im),
  id: basename(im).replace(".svg", ""),
}));

test("scale 1x", async ({ bench }) => {
  await bench.compare(
    bench("generate sprite @mapka/sprites-generate", async () => {
      const layout = await mapkaGenerateLayout({
        imgs: fixtures,
        pixelRatio: 1,
        format: false,
      });

      await mapkaGenerateImage(layout);
    }),
    bench("generate sprite @mapbox/spritezero", async () => {
      await new Promise((resolve, reject) => {
        mapboxGenerateLayout(
          {
            imgs: fixtures,
            pixelRatio: 1,
            format: false,
          },
          (err?: Error | null, layout?: ImgLayout | DataLayout) => {
            if (err || !layout) {
              reject(err ?? new Error("spritezero returned no layout"));
              return;
            }
            mapboxGenerateImage(layout as ImgLayout, (err?: Error | null, image?: Buffer) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(image);
            });
          },
        );
      });
    }),
  );
});
