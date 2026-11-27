/** The current Studio window, or undefined while there is none (macOS keeps the app running without windows). */
export class WindowSlot<Window> {
  #current: Window | undefined;

  hold(window: Window): void {
    this.#current = window;
  }

  release(window: Window): void {
    if (this.#current === window) this.#current = undefined;
  }

  current(): Window | undefined {
    return this.#current;
  }
}
