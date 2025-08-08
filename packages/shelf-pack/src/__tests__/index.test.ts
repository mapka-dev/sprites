import { describe, expect, test } from "vitest";
import ShelfPack from "../index.js";

describe("ShelfPack", () => {
  describe("batch pack()", () => {
    test("batch pack() allocates same height bins on existing shelf", () => {
      const sprite = new ShelfPack(64, 64),
        bins = [
          { id: 'a', width: 10, height: 10 },
          { id: 'b', width: 10, height: 10 },
          { id: 'c', width: 10, height: 10 }
        ],
        expectedResults = [
          { id: "a", x: 0, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
          { id: "b", x: 10, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
          { id: "c", x: 20, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
        ];

      var results = sprite.pack(bins);
      expect(results).toEqual(expectedResults);
    });

    test("batch pack() allocates larger bins on new shelf", () => {
      var sprite = new ShelfPack(64, 64),
        bins = [
          { id: "a", w: 10, h: 10 },
          { id: "b", w: 10, h: 15 },
          { id: "c", w: 10, h: 20 },
        ],
        expectedResults = [
          { id: "a", x: 0, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
          { id: "b", x: 0, y: 10, w: 10, h: 15, maxw: 10, maxh: 15, refcount: 1 },
          { id: "c", x: 0, y: 25, w: 10, h: 20, maxw: 10, maxh: 20, refcount: 1 },
        ];

      var results = sprite.pack(bins);
      expect(results).toEqual(expectedResults);
    });

    test("batch pack() allocates shorter bins on existing shelf, minimizing waste", () => {
      var sprite = new ShelfPack(64, 64),
        bins = [
          { id: 'a', width: 10, height: 10 },
          { id: 'b', width: 10, height: 15 },
          { id: 'c', width: 10, height: 20 },
          { id: 'd', width: 10, height: 9 }
        ],
        expectedResults = [
          { id: 'a', x: 0, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
          { id: 'b', x: 0, y: 10, w: 10, h: 15, maxw: 10, maxh: 15, refcount: 1 },
          { id: 'c', x: 0, y: 25, w: 10, h: 20, maxw: 10, maxh: 20, refcount: 1 },
          { id: 'd', x: 10, y: 0, w: 10, h: 9, maxw: 10, maxh: 10, refcount: 1 }
        ];

      var results = sprite.pack(bins);
      expect(results).toEqual(expectedResults);
    });

    test("batch pack() accepts `w`, `h` for `width`, `height`", () => {
      var sprite = new ShelfPack(64, 64),
        bins = [
          { id: "a", w: 10, h: 10 },
          { id: "b", w: 10, h: 10 },
          { id: "c", w: 10, h: 10 },
        ],
        expectedResults = [
          { id: "a", x: 0, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
          { id: "b", x: 10, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
          { id: "c", x: 20, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
        ];

      var results = sprite.pack(bins);
      expect(results).toEqual(expectedResults);
    });

    test("batch pack() adds `x`, `y` properties to bins with `inPlace` option", () => {
      var sprite = new ShelfPack(64, 64),
        bins = [
          { id: "a", w: 10, h: 10 },
          { id: "b", w: 10, h: 10 },
          { id: "c", w: 10, h: 10 },
        ],
        expectedResults = [
          { id: "a", x: 0, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
          { id: "b", x: 10, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
          { id: "c", x: 20, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
        ],
        expectedBins = [
          { id: "a", w: 10, h: 10, x: 0, y: 0 },
          { id: "b", w: 10, h: 10, x: 10, y: 0 },
          { id: "c", w: 10, h: 10, x: 20, y: 0 },
        ];

      var results = sprite.pack(bins, { inPlace: true });
      expect(results).toEqual(expectedResults);
      expect(bins).toEqual(expectedBins);
    });

    test("batch pack() skips bins if not enough room", () => {
      var sprite = new ShelfPack(20, 20),
        bins = [
          { id: "a", w: 10, h: 10 },
          { id: "b", w: 10, h: 10 },
          { id: "c", w: 10, h: 30 }, // should skip
          { id: "d", w: 10, h: 10 },
        ],
        expectedResults = [
          { id: "a", x: 0, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
          { id: "b", x: 10, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
          { id: "d", x: 0, y: 10, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
        ],
        expectedBins = [
          { id: "a", w: 10, h: 10, x: 0, y: 0 },
          { id: "b", w: 10, h: 10, x: 10, y: 0 },
          { id: "c", w: 10, h: 30 },
          { id: "d", w: 10, h: 10, x: 0, y: 10 },
        ];

      var results = sprite.pack(bins, { inPlace: true });
      expect(results).toEqual(expectedResults);
      expect(bins).toEqual(expectedBins);
    });

    test("batch pack() results in minimal sprite width and height", () => {
      var bins = [
        { id: "a", w: 10, h: 10 },
        { id: "b", w: 5, h: 15 },
        { id: "c", w: 25, h: 15 },
        { id: "d", w: 10, h: 20 },
      ];

      var sprite = new ShelfPack(10, 10, { autoResize: true });
      sprite.pack(bins);

      // Since shelf-pack doubles width/height when packing bins one by one
      // (first width, then height) this would result in a 50x60 sprite here.
      // But this can be shrunk to a 30x45 sprite.
      expect([sprite.w, sprite.h]).toEqual([30, 45]);
    });
  });

  describe("packOne()", () => {
    test("packOne() allocates bins with numeric id", () => {
      var sprite = new ShelfPack(64, 64);
      var bin = sprite.packOne(10, 10, 1000);
      // packed bin 1000 
      expect(bin).toEqual(
        { id: 1000, x: 0, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
      );
      //Got bin 1000
      expect(bin).toEqual(sprite.getBin(1000));
    });

    test("packOne() allocates bins with string id", () => {
      var sprite = new ShelfPack(64, 64);
      var bin = sprite.packOne(10, 10, "foo");

      //Packed bin "foo"
      expect(bin).toEqual({ id: "foo", x: 0, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 });
      //Got bin "foo"
      expect(bin).toEqual(sprite.getBin("foo"));
    });

    test("packOne() generates incremental numeric ids, if id not provided", () => {
      var sprite = new ShelfPack(64, 64);
      var bin1 = sprite.packOne(10, 10);
      var bin2 = sprite.packOne(10, 10);

      //Bin 1 packed bin 1
      expect(bin1.id).toEqual(1);
      //Bin 2 packed bin 2
      expect(bin2.id).toEqual(2);
    });

    test("packOne() does not generate an id that collides with an existing id", () => {
      var sprite = new ShelfPack(64, 64);
      var bin1 = sprite.packOne(10, 10, 1);
      var bin2 = sprite.packOne(10, 10);

      //Bin 1 packed bin 1
      expect(bin1.id).toEqual(1);
      //Bin 2 packed bin 2
      expect(bin2.id).toEqual(2);
    });

    test("packOne() does not reallocate a bin with existing id", () => {
      var sprite = new ShelfPack(64, 64);
      var bin1 = sprite.packOne(10, 10, 1000);

      //Bin 1000 refcount 1
      expect(bin1).toEqual({ id: 1000, x: 0, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 });
      //Bin 1000 refcount 2
      expect(bin1).toEqual(sprite.getBin(1000));

      const bin2 = sprite.packOne(10, 10, 1000);

      //Bin 1000 refcount 2
      expect(bin2).toEqual({ id: 1000, x: 0, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 2 });
      //Bin1 and bin2 are the same bin
      expect(bin1).toEqual(bin2);
    });

    test("packOne() allocates same height bins on existing shelf", () => {
      var sprite = new ShelfPack(64, 64);

      //First 10x10 bin
      expect(sprite.packOne(10, 10)).toEqual({ id: 1, x: 0,  y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 });
      //Second 10x10 bin
      expect(sprite.packOne(10, 10)).toEqual({ id: 2, x: 10, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 });
      //Third 10x10 bin
      expect(sprite.packOne(10, 10)).toEqual({ id: 3, x: 20, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 });
    });
    
    test("packOne() allocates larger bins on new shelf", () => {
      var sprite = new ShelfPack(64, 64);

      //Shelf 1, 10x10 bin
      expect(sprite.packOne(10, 10)).toEqual({
        id: 1,
        x: 0,
        y: 0,
        w: 10,
        h: 10,
        maxw: 10,
        maxh: 10,
        refcount: 1,
      });
      //Shelf 2, 10x15 bin
      expect(sprite.packOne(10, 15)).toEqual({
        id: 2,
        x: 0,
        y: 10,
        w: 10,
        h: 15,
        maxw: 10,
        maxh: 15,
        refcount: 1,
      });
      //Shelf 3, 10x20 bin
      expect(sprite.packOne(10, 20)).toEqual({
        id: 3,
        x: 0,
        y: 25,
        w: 10,
        h: 20,
        maxw: 10,
        maxh: 20,
        refcount: 1,
      });
    });

    test("packOne() allocates shorter bins on existing shelf, minimizing waste", () => {
      var sprite = new ShelfPack(64, 64);

      //Shelf 1, 10x10 bin
      expect(sprite.packOne(10, 10)).toEqual({
        id: 1,
        x: 0,
        y: 0,
        w: 10,
        h: 10,
        maxw: 10,
        maxh: 10,
        refcount: 1,
      });
      //Shelf 2, 10x15 bin
      expect(sprite.packOne(10, 15)).toEqual({
        id: 2,
        x: 0,
        y: 10,
        w: 10,
        h: 15,
        maxw: 10,
        maxh: 15,
        refcount: 1,
      });
      //Shelf 3, 10x20 bin
      expect(sprite.packOne(10, 20)).toEqual({
        id: 3,
        x: 0,
        y: 25,
        w: 10,
        h: 20,
        maxw: 10,
        maxh: 20,
        refcount: 1,
      });
      //Shelf 1, 10x9 bin
      expect(sprite.packOne(10, 9)).toEqual({
        id: 4,
        x: 10,
        y: 0,
        w: 10,
        h: 9,
        maxw: 10,
        maxh: 10,
        refcount: 1,
      });
    });

    test("packOne() returns nothing if not enough room", () => {
      var sprite = new ShelfPack(10, 10);

      //First 10x10 bin
      expect(sprite.packOne(10, 10, 1)).toEqual({
        id: 1,
        x: 0,
        y: 0,
        w: 10,
        h: 10,
        maxw: 10,
        maxh: 10,
        refcount: 1,
      });
      //Not enough room
      expect(sprite.packOne(10, 10, 2)).toBeFalsy();
      //Not enough room on shelf
      expect(sprite.shelves[0].alloc(10, 10, 2)).toBeFalsy();
    });

    test("packOne() allocates in free bin if possible", () => {
      const sprite = new ShelfPack(64, 64);
      sprite.packOne(10, 10, 1);
      sprite.packOne(10, 10, 2);
      sprite.packOne(10, 10, 3);

      const bin2 = sprite.getBin(2);
      sprite.unref(bin2);

      //Freebins length 1
      expect(sprite.freebins.length).toEqual(1);
      //Bin2 moved to freebins
      expect(sprite.freebins[0]).toEqual(bin2);

      //Reused 10x10 free bin for bin4
      expect(sprite.packOne(10, 10, 4)).toEqual({
        id: 4,
        x: 10,
        y: 0,
        w: 10,
        h: 10,
        maxw: 10,
        maxh: 10,
        refcount: 1,
      });
      //Freebins length 0
      expect(sprite.freebins.length).toEqual(0);
    });

    test("packOne() allocates new bin in least wasteful free bin", () => {
      var sprite = new ShelfPack(64, 64);
      sprite.packOne(10, 10, 1);
      sprite.packOne(10, 15, 2);
      sprite.packOne(10, 20, 3);

      sprite.unref(sprite.getBin(1));
      sprite.unref(sprite.getBin(2));
      sprite.unref(sprite.getBin(3));

      //Freebins length 3
      expect(sprite.freebins.length).toEqual(3);
      //Reused free bin for 10x13 bin4
      expect(sprite.packOne(10, 13, 4)).toEqual({
        id: 4,
        x: 0,
        y: 10,
        w: 10,
        h: 13,
        maxw: 10,
        maxh: 15,
        refcount: 1,
      });
      //Freebins length 2
      expect(sprite.freebins.length).toEqual(2);
    });

    test("packOne() avoids free bin if all are more wasteful than packing on a shelf", () => {
      var sprite = new ShelfPack(64, 64);
      sprite.packOne(10, 10, 1);
      sprite.packOne(10, 15, 2);

      sprite.unref(sprite.getBin(2));

      //Freebins length 1
      expect(sprite.freebins.length).toEqual(1);
      //Bin3 packs on shelf instead of 10x15 free bin
      expect(sprite.packOne(10, 10, 3)).toEqual({
        id: 3,
        x: 10,
        y: 0,
        w: 10,
        h: 10,
        maxw: 10,
        maxh: 10,
        refcount: 1,
      });
      //Freebins still length 1
      expect(sprite.freebins.length).toEqual(1);
    });

    test("packOne() considers max bin dimensions when reusing a free bin", () => {
      var sprite = new ShelfPack(64, 64);
      sprite.packOne(10, 10, 1);
      sprite.packOne(10, 15, 2);
      sprite.unref(sprite.getBin(2));
      //Freebins length 1
      expect(sprite.freebins.length).toEqual(1);

      // Reused free bin for 10x13 bin3
      expect(sprite.packOne(10, 13, 3)).toEqual({
        id: 3,
        x: 0,
        y: 10,
        w: 10,
        h: 13,
        maxw: 10,
        maxh: 15,
        refcount: 1,
      });
      // Freebins length 0
      expect(sprite.freebins.length).toEqual(0);
      sprite.unref(sprite.getBin(3));
      // Freebins length back to 1
      expect(sprite.freebins.length).toEqual(1);

      // Reused free bin for 10x14 bin4
      expect(sprite.packOne(10, 14, 4)).toEqual({
        id: 4,
        x: 0,
        y: 10,
        w: 10,
        h: 14,
        maxw: 10,
        maxh: 15,
        refcount: 1,
      });
      // Freebins length back to 0
      expect(sprite.freebins.length).toEqual(0);
    });
  });

  describe("getBin()", () => {
    test("getBin() returns undefined if Bin not found", () => {
      var sprite = new ShelfPack(64, 64);
      expect(sprite.getBin(1)).toBeUndefined();
    });

    test("getBin() gets a Bin by numeric id", () => {
      var sprite = new ShelfPack(64, 64);
      var bin = sprite.packOne(10, 10, 1);

      //Bin 1
      expect(sprite.getBin(1)).toEqual(bin);
    });

    test("getBin() gets a Bin by string id", () => {
      var sprite = new ShelfPack(64, 64);
      var bin = sprite.packOne(10, 10, "foo");

      //Bin "foo"
      expect(sprite.getBin("foo")).toEqual(bin);
    });
  });

  describe("ref()", () => {
    test("ref() increments the Bin refcount and updates stats", () => {
      var sprite = new ShelfPack(64, 64);
      var bin1 = sprite.packOne(10, 10, 1);

      // Bin1 refcount is 1
      expect(bin1.refcount).toEqual(1);
      // One bin of height 10
      expect(sprite.stats).toEqual({ 10: 1 });
      // Bin1 refcount is 2
      expect(sprite.ref(bin1)).toEqual(2);
      // Still one bin of height 10
      expect(sprite.stats).toEqual({ 10: 1 });

      var bin2 = sprite.packOne(10, 10, 2);
      // Bin2 refcount is 1
      expect(bin2.refcount).toEqual(1);
      // Two bins of height 10
      expect(sprite.stats).toEqual({ 10: 2 });
      // Bin2 refcount is 2
      expect(sprite.ref(bin2)).toEqual(2);
      // Still two bins of height 10
      expect(sprite.stats).toEqual({ 10: 2 });

      var bin3 = sprite.packOne(10, 15, 3);

      // Bin3 refcount is 1
      expect(bin3.refcount).toEqual(1);
      // Two bins of height 10, one bin of height 15
      expect(sprite.stats).toEqual({ 10: 2, 15: 1 });
      // Bin3 refcount is 2
      expect(sprite.ref(bin3)).toEqual(2);
      // Still two bins of height 10, one bin of height 15
      expect(sprite.stats).toEqual({ 10: 2, 15: 1 });
    });
  });

  describe("unref()", () => {
    test("unref() decrements the Bin refcount and updates stats", () => {
      var sprite = new ShelfPack(64, 64);

      // setup..
      var bin1 = sprite.packOne(10, 10, 1);
      sprite.ref(bin1);
      var bin2 = sprite.packOne(10, 10, 2);
      sprite.ref(bin2);
      var bin3 = sprite.packOne(10, 15, 3);
      sprite.ref(bin3);

      //Bin3 refcount is 1
      expect(sprite.unref(bin3)).toEqual(1);
      //Two bins of height 10, one bin of height 15
      expect(sprite.stats).toEqual({ 10: 2, 15: 1 });
      //Freebins empty
      expect(sprite.freebins.length).toEqual(0);

      //Bin3 refcount is 0
      expect(sprite.unref(bin3)).toEqual(0);
      //Two bins of height 10, no bins of height 15
      expect(sprite.stats).toEqual({ 10: 2, 15: 0 });
      //Freebins length 1
      expect(sprite.freebins.length).toEqual(1);
      //Bin3 moved to freebins
      expect(sprite.freebins[0]).toEqual(bin3);
      //getBin for Bin3 returns undefined
      expect(sprite.getBin(3)).toBeUndefined();

      //Bin2 refcount is 1
      expect(sprite.unref(bin2)).toEqual(1);
      //Two bins of height 10, no bins of height 15
      expect(sprite.stats).toEqual({ 10: 2, 15: 0 });

      //Bin2 refcount is 0
      expect(sprite.unref(bin2)).toEqual(0);
      //One bin of height 10, no bins of height 15
      expect(sprite.stats).toEqual({ 10: 1, 15: 0 });
      //Free bins length 2
      expect(sprite.freebins.length).toEqual(2);
      //Bin2 moved to freebins
      expect(sprite.freebins[1]).toEqual(bin2);
      //getBin for Bin2 returns undefined
      expect(sprite.getBin(2)).toBeUndefined();
    });

    test("unref() does nothing if refcount is already 0", () => {
      var sprite = new ShelfPack(64, 64);
      var bin = sprite.packOne(10, 10, 1);

      //Bin3 refcount is 0
      expect(sprite.unref(bin)).toEqual(0);
      //No bins of height 10
      expect(sprite.stats).toEqual({ 10: 0 });

      //Bin3 refcount is still 0
      expect(sprite.unref(bin)).toEqual(0);
      //Still no bins of height 10
      expect(sprite.stats).toEqual({ 10: 0 });
    });
  });

  describe("clear()", () => {
    test("clear() succeeds", () => {
      var sprite = new ShelfPack(10, 10);

      //First 10x10 bin
      expect(sprite.packOne(10, 10)).toEqual({
        id: 1,
        x: 0,
        y: 0,
        w: 10,
        h: 10,
        maxw: 10,
        maxh: 10,
        refcount: 1,
      });
      // Not enough room
      expect(sprite.packOne(10, 10)).toBeFalsy();

      sprite.clear();
      // First 10x10 bin
      expect(sprite.packOne(10, 10)).toEqual({
        id: 1,
        x: 0,
        y: 0,
        w: 10,
        h: 10,
        maxw: 10,
        maxh: 10,
        refcount: 1,
      });
    });
  });

  describe("shrink()", () => {
    test("shrink() succeeds", () => {
      var sprite = new ShelfPack(20, 20);
      sprite.packOne(10, 5);
      expect([sprite.w, sprite.h]).toEqual([20, 20]);

      sprite.shrink();
      expect([sprite.w, sprite.h]).toEqual([10, 5]);
    });
  });

  describe("resize()", () => {
    test("resize larger succeeds", () => {
      var sprite = new ShelfPack(10, 10);

      // first 10x10 bin
      expect(sprite.packOne(10, 10)).toEqual(
        { id: 1, x: 0, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },

      );
      expect(sprite.resize(20, 10)).toBeTruthy();
      // second 10x10 bin
      expect(sprite.packOne(10, 10)).toEqual(
        { id: 2, x: 10, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
      );
      expect(sprite.resize(20, 20)).toBeTruthy();
      //"third 10x10 bin",
      expect(sprite.packOne(10, 10)).toEqual(
        { id: 3, x: 0, y: 10, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 }
      );
    });

    test("autoResize grows sprite dimensions by width then height", () => {
      var sprite = new ShelfPack(10, 10, { autoResize: true });

      // first 10x10 bin
      expect(sprite.packOne(10, 10)).toEqual(
        { id: 1, x: 0, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
      );
      expect([sprite.w, sprite.h]).toEqual([10, 10]);
      //"second 10x10 bin"
      expect(sprite.packOne(10, 10)).toEqual(
        { id: 2, x: 10, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
      );
      expect([sprite.w, sprite.h]).toEqual([20, 10]);
      //third 10x10 bin
      expect(sprite.packOne(10, 10)).toEqual(
        { id: 3, x: 0, y: 10, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
      );
      expect([sprite.w, sprite.h]).toEqual([20, 20]);
      // fourth 10x10 bin
      expect(sprite.packOne(10, 10)).toEqual(
        { id: 4, x: 10, y: 10, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
      );
      expect([sprite.w, sprite.h]).toEqual([20, 20]);
      // fifth 10x10 bin"
      expect(sprite.packOne(10, 10)).toEqual(
        { id: 5, x: 20, y: 0, w: 10, h: 10, maxw: 10, maxh: 10, refcount: 1 },
      );
      expect([sprite.w, sprite.h]).toEqual([40, 20]);
    });

    test("autoResize accommodates big bin requests", () => {
      var sprite = new ShelfPack(10, 10, { autoResize: true });

      // 20x10 bin
      expect(sprite.packOne(20, 10)).toEqual(
        { id: 1, x: 0, y: 0, w: 20, h: 10, maxw: 20, maxh: 10, refcount: 1 },
      );
      expect([sprite.w, sprite.h]).toEqual([40, 10]);
      //40x10 bin
      expect(sprite.packOne(10, 40)).toEqual(
        { id: 2, x: 0, y: 10, w: 10, h: 40, maxw: 10, maxh: 40, refcount: 1 },
      );
      expect([sprite.w, sprite.h]).toEqual([40, 80]);
    });
  });
});
