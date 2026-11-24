import type { Framing as FramingJson } from '../script/SceneElements.ts';

export type FramingData = Readonly<{ zoom: number; x: number; y: number; rotation: number }>;

const HUNDRED = 100;

function clamp(value: number, slack: number): number {
  return Math.max(-slack, Math.min(slack, value));
}

/** Zoom never below 1 (the background edge never shows); x and y stay within the slack the zoom gives. */
export class Framing {
  readonly zoom: number;
  readonly x: number;
  readonly y: number;
  readonly rotation: number;

  private constructor(data: FramingData) {
    this.zoom = Math.max(1, data.zoom);
    const slack = (this.zoom - 1) / 2;
    this.x = clamp(data.x, slack);
    this.y = clamp(data.y, slack);
    this.rotation = data.rotation;
  }

  static of(data: FramingData): Framing {
    return new Framing(data);
  }

  static fromJson(json: FramingJson): Framing {
    return new Framing({ ...json, rotation: 0 });
  }

  static neutral(): Framing {
    return new Framing({ zoom: 1, x: 0, y: 0, rotation: 0 });
  }

  /** `fraction` from 0 (this framing) to 1 (the other). */
  towards(other: Framing, fraction: number): Framing {
    const mix = (start: number, end: number): number => start + (end - start) * fraction;
    return new Framing({
      zoom: mix(this.zoom, other.zoom),
      x: mix(this.x, other.x),
      y: mix(this.y, other.y),
      rotation: mix(this.rotation, other.rotation),
    });
  }

  cssTransform(): string {
    const offset = `translate(${this.x * HUNDRED}%, ${this.y * HUNDRED}%)`;
    return `${offset} scale(${this.zoom}) rotate(${this.rotation}deg)`;
  }
}
