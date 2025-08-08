import { globSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { bench } from "vitest";

console.log(resolve(join(import.meta.dirname, "../../../sprites-generate/src/__tests__/fixture/svg/*.svg")));

const fixtures = globSync(resolve(join(import.meta.dirname, "../../../sprites-generate/src/__tests__/fixture/svg/*.svg"))).map((im) => ({
  svg: readFileSync(im),
  id: basename(im).replace(".svg", ""),
}));

console.log(fixtures);
bench("generateLayout bench (concurrency=1,x20)", async () => {

});

bench("generateLayout bench (concurrency=4,x20)", async () => {

});
