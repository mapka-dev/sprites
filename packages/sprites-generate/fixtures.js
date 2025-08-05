var spritezero = require("./lib");
var fs = require("fs");
var path = require("path");
var queue = require("queue-async");

function filepaths(dir) {
  return fs
    .readdirSync(dir)
    .filter((d) => !d.match(/^\./))
    .map((d) => path.join(dir, d));
}

function loadFile(file, callback) {
  fs.readFile(file, (err, res) =>
    callback(err, {
      svg: res,
      id: path.basename(file).replace(".svg", ""),
    }),
  );
}

var q = queue(16);

filepaths(path.resolve(__dirname, "src/__tests__/fixture", "svg")).forEach((file) => {
  q.defer(loadFile, file);
});

q.awaitAll((err, buffers) => {
  [1, 2, 4].forEach((ratio) => {
    spritezero.generateLayout(
      { imgs: buffers, pixelRatio: ratio, unique: true },
      (err, formattedLayout) => {
        if (err) throw err;
        fs.writeFile(
          path.resolve(__dirname, "src/__tests__/fixture", "sprite@" + ratio + ".json"),
          JSON.stringify(formattedLayout, null, 2),
          "utf8",
          (err) => {
            if (err) throw err;
          },
        );
      },
    );
    spritezero.generateLayout(
      { imgs: buffers, pixelRatio: ratio, unique: false },
      (err, layout) => {
        if (err) throw err;
        spritezero.generateImage(layout, (err, image) => {
          if (err) throw err;
          fs.writeFile(
            path.resolve(__dirname, "src/__tests__/fixture", "sprite@" + ratio + ".png"),
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
