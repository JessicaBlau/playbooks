import '@testing-library/jest-dom/vitest';

// On Node versions with the experimental Web Storage global enabled by
// default (e.g. 24+), both `globalThis.localStorage` AND jsdom's own
// `window.localStorage` resolve to the same inert host stub (jsdom defers to
// a host-provided Web Storage implementation when it detects one, and
// Node's is non-functional without a `--localstorage-file` path). Install a
// minimal in-memory Storage polyfill instead of relying on either — this
// works identically on every Node version, with or without the experimental
// feature.
class MemoryStorage implements Storage {
  #store = new Map<string, string>();

  get length(): number {
    return this.#store.size;
  }

  clear(): void {
    this.#store.clear();
  }

  getItem(key: string): string | null {
    return this.#store.has(key) ? this.#store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.#store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.#store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.#store.set(key, String(value));
  }
}

for (const target of [globalThis, window]) {
  Object.defineProperty(target, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
  });
  Object.defineProperty(target, 'sessionStorage', {
    value: new MemoryStorage(),
    configurable: true,
  });
}
