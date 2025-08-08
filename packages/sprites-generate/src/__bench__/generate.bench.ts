import { globSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { bench } from "vitest";
import { generateLayout } from "../generate.js";

const fixtures = globSync(resolve(join(import.meta.dirname, "../__tests__/fixture/svg/*.svg"))).map((im) => ({
  svg: readFileSync(im),
  id: basename(im).replace(".svg", ""),
}));

function getFixtures() {
  return fixtures.sort(() => Math.random() - 0.5);
}

bench("generateLayout bench (concurrency=1,x20)", async () => {
  for (let i = 0; i < 20; i++) {
    await generateLayout({ imgs: getFixtures(), pixelRatio: 1, format: false });
  }
});

bench("generateLayout bench (concurrency=4,x20)", async () => {
  for (let i = 0; i < 20; i += 4) {
    await Promise.all([
      generateLayout({ imgs: getFixtures(), pixelRatio: 1, format: false }),
      generateLayout({ imgs: getFixtures(), pixelRatio: 1, format: false }),  
      generateLayout({ imgs: getFixtures(), pixelRatio: 1, format: false }),
      generateLayout({ imgs: getFixtures(), pixelRatio: 1, format: false }),
    ]);
  }
});
