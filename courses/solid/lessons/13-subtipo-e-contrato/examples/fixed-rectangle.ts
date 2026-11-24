// E se o retângulo for imutável? Nada muda depois de criado:
// não existe a promessa "mudar a largura não mexe na altura" para quebrar.
export class FixedRectangle {
  readonly width: number;
  readonly height: number;
  constructor(w: number, h: number) { this.width = w; this.height = h; }
  area() { return this.width * this.height; }
}

export class FixedSquare extends FixedRectangle {
  constructor(side: number) { super(side, side); }
}

// Código escrito pensando no retângulo imutável: funciona com os dois.
export const areas = (shapes: FixedRectangle[]) => shapes.map((s) => s.area());
