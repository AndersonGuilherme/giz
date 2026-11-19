// O exemplo clássico, em uma tela: o quadrado "é um" retângulo, mas não cumpre a promessa dele.
export class Rectangle {
  width = 0;
  height = 0;
  // Promessa: mudar a largura não mexe na altura (e vice-versa).
  setWidth(w: number) { this.width = w; }
  setHeight(h: number) { this.height = h; }
  area() { return this.width * this.height; }
}

export class Square extends Rectangle {
  // Para continuar quadrado, cada setter muda os dois lados.
  setWidth(w: number) { this.width = w; this.height = w; }
  setHeight(h: number) { this.width = h; this.height = h; }
}

// Código escrito pensando no Retângulo.
export function stretch(r: Rectangle) {
  r.setWidth(5);
  r.setHeight(4);
  return r.area(); // esperado: 5 × 4 = 20
}
