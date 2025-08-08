# @mapka/shelf-pack

This is fork of [Shelf pack](https://github.com/mapbox/shelf-pack) library.

## Usage

```ts
import ShelfPack from '@mapka/shelf-pack';

const sprite = new ShelfPack(64, 64, { autoResize: false });
sprite.pack([
  { id: 1, w: 12, h: 12 },
  { id: 2, w: 12, h: 16 },
  { id: 3, w: 12, h: 24 }
]);
```
