import type { CombinePublisher, CombineStreamConfig, CombineStreamManagerAPI } from './types.js';

function createPublisher<T = unknown>(name: string, bufferSize: number): CombinePublisher<T> {
  const buf: T[] = [];
  let isCompleted = false;
  const subscribers = new Set<(value: T) => void>();

  return {
    get name() { return name; },
    get bufferSize() { return bufferSize; },
    get length() { return buf.length; },
    get completed() { return isCompleted; },
    get subscriberCount() { return subscribers.size; },

    send(value: T): boolean {
      if (isCompleted) throw new Error(`Publisher "${name}" is completed`);
      if (buf.length >= bufferSize) return false;
      buf.push(value);
      for (const cb of subscribers) cb(value);
      return true;
    },

    receive(): T | undefined {
      return buf.shift();
    },

    subscribe(callback: (value: T) => void): () => void {
      subscribers.add(callback);
      return () => { subscribers.delete(callback); };
    },

    complete(): void {
      isCompleted = true;
    },
  };
}

export function createCombineStreamManager(config: CombineStreamConfig): CombineStreamManagerAPI {
  const publishers = new Map<string, CombinePublisher<unknown>>();
  const defaultBufferSize = config.bufferSize;

  return {
    create<T = unknown>(name: string, bufferSize?: number): CombinePublisher<T> {
      const pub = createPublisher<T>(name, bufferSize ?? defaultBufferSize);
      publishers.set(name, pub as CombinePublisher<unknown>);
      return pub;
    },

    get<T = unknown>(name: string): CombinePublisher<T> | undefined {
      return publishers.get(name) as CombinePublisher<T> | undefined;
    },

    delete(name: string): void {
      publishers.get(name)?.complete();
      publishers.delete(name);
    },

    listNames(): string[] {
      return Array.from(publishers.keys());
    },

    destroy(): void {
      for (const pub of publishers.values()) pub.complete();
      publishers.clear();
    },
  };
}
