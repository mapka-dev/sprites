# @mapka/sprites-generate

This is fork of [spritezero](https://github.com/mapbox/spritezero) library. This is JS based solution using [mapnik](https://github.com/mapnik/node-mapnik) library for image generation.

Alternatively you can use [spreet](https://github.com/flother/spreet) library which is written in Rust.

## Usage

```ts
import { readFileSync, writeFileSync } from 'node:fs';
import { generateLayout } from '@mapka/sprites-generate';

const layout = await generateLayout({
  imgs: [
    { svg: readFileSync('aerialway-24.svg'), id: 'aerialway-24' },
    { svg: readFileSync('aerialway-24-copy.svg'), id: 'aerialway-24-copy' },
    { svg: readFileSync('aerialway-24-alternate.svg'), id: 'aerialway-24-alternate' },
  ],
  pixelRatio: 2,
  format: false,
});

const spriteImage = await generateImage(layout);
writeFileSync('sprite.png', spriteImage);
```
