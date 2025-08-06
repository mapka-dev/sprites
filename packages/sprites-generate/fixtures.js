import {generateLayout, generateImage} from "./lib/index.js";
import {readdirSync, readFile, writeFile} from "fs";
import {resolve, join, basename} from "path";
import queue from "queue-async";

function filepaths(dir) {
  return readdirSync(dir)
    .filter((d) => !d.match(/^\./))
    .map((d) => join(dir, d));
}

function loadFile(file, callback) {
  readFile(file, (err, res) =>
    callback(err, {
      svg: res,
      id: basename(file).replace(".svg", ""),
    }),
  );
}

var q = queue(16);

filepaths(resolve(import.meta.dirname, "src/__tests__/fixture", "svg")).forEach((file) => {
  q.defer(loadFile, file);
});

q.awaitAll((err, buffers) => {
  [1, 2, 4].forEach((ratio) => {
    generateLayout(
      { imgs: buffers, pixelRatio: ratio, unique: true },
      (err, formattedLayout) => {
        if (err) throw err;
        writeFile(
          resolve(import.meta.dirname, "src/__tests__/fixture", "sprite@" + ratio + ".json"),
          JSON.stringify(formattedLayout, null, 2),
          "utf8",
          (err) => {
            if (err) throw err;
          },
        );
      },
    );
    generateLayout(
      { imgs: buffers, pixelRatio: ratio, unique: false },
      (err, layout) => {
        if (err) throw err;
        generateImage(layout, (err, image) => {
          if (err) throw err;
          writeFile(
            resolve(import.meta.dirname, "src/__tests__/fixture", "sprite@" + ratio + ".png"),
            image,
            (err) => {
              if (err) throw err;
            },
          );
        });
      },
    );
  });
});
