

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
  items: Buffer[]
}


