import type { Image } from "@mapnik/mapnik";
import type { Metadata } from "./validate.js";

export interface SvgImage {
  svg: Buffer;
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  buffer: Image;
}

export interface DataSvgImage extends Metadata {
  svg: Buffer;
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  buffer: Image;
}

export interface DataLayout {
  [key: string]: {
    width: number;
    height: number;
    x: number;
    y: number;
    pixelRatio: number;
    content?: [number, number, number, number];
    stretchX?: [number, number][];
    stretchY?: [number, number][];
    placeholder?: [number, number, number, number];
  };
}

export interface ImgLayout {
  width: number;
  height: number;
  items: SvgImage[];
}
