import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDispatchQueue } from '../src/dispatch-queue';
import type { FFITransportAPI, InvocationEnvelope } from '../src/types';

function makeMockTransport(resolveWith: unknown = { ok: true }): FFITransportAPI {
  return {
    buildEnvelope: (functionId: string, args: unknown[]): InvocationEnvelope => ({
      functionId,
      args,
      metadata: { schemaMode: 'hybrid', binding: 'swift', timestampMs: 0, ffiPath: '/mock' },
    }),
    dispatch: vi.fn().mockResolvedValue(resolveWith),
    destroy: vi.fn(),
  };
}

describe('createDispatchQueue', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getStats returns zero counts initially', () => {
    const queue = createDispatchQueue(makeMockTransport(), { queueSize: 4, mode: 'concurrent' });
    expect(queue.getStats()).toEqual({ activeTasks: 0, queuedTasks: 0, completedTasks: 0 });
  });

  it('submit dispatches a task through the transport', async () => {
    const transport = makeMockTransport({ ok: true });
    const queue = createDispatchQueue(transport, { queueSize: 4, mode: 'concurrent' });
    const result = await queue.submit('t1', 'doSomething', [1, 2]);
    expect(result).toEqual({ ok: true });
    expect(transport.dispatch).toHaveBeenCalledTimes(1);
  });

  it('completedTasks increments after each resolution', async () => {
    const queue = createDispatchQueue(makeMockTransport(), { queueSize: 4, mode: 'concurrent' });
    await queue.submit('t1', 'fn', []);
    await queue.submit('t2', 'fn', []);
    expect(queue.getStats().completedTasks).toBe(2);
  });

  it('serial mode processes only one task at a time', async () => {
    let releaseFn!: () => void;
    const slowTransport: FFITransportAPI = {
      buildEnvelope: (id, args) => ({
        functionId: id, args,
        metadata: { schemaMode: 'hybrid', binding: 'swift', timestampMs: 0, ffiPath: '/mock' },
      }),
      dispatch: vi.fn().mockImplementation(() => new Promise<unknown>((r) => { releaseFn = () => r({ ok: true }); })),
      destroy: vi.fn(),
    };

    const queue = createDispatchQueue(slowTransport, { queueSize: 4, mode: 'serial' });

    const p1 = queue.submit('t1', 'fn', []);
    const p2 = queue.submit('t2', 'fn', []);

    await Promise.resolve();
    expect(queue.getStats().activeTasks).toBe(1);
    expect(queue.getStats().queuedTasks).toBe(1);

    releaseFn();
    await p1;
    releaseFn();
    await p2;

    expect(queue.getStats().completedTasks).toBe(2);
  });

  it('respects queueSize concurrency bound', async () => {
    let releaseFn!: () => void;
    const slowTransport: FFITransportAPI = {
      buildEnvelope: (id, args) => ({
        functionId: id, args,
        metadata: { schemaMode: 'hybrid', binding: 'swift', timestampMs: 0, ffiPath: '/mock' },
      }),
      dispatch: vi.fn().mockImplementation(() => new Promise<unknown>((r) => { releaseFn = () => r({ ok: true }); })),
      destroy: vi.fn(),
    };

    const queue = createDispatchQueue(slowTransport, { queueSize: 1, mode: 'concurrent' });

    const p1 = queue.submit('t1', 'fn', []);
    const p2 = queue.submit('t2', 'fn', []);
    const p3 = queue.submit('t3', 'fn', []);

    await Promise.resolve();
    expect(queue.getStats().activeTasks).toBe(1);
    expect(queue.getStats().queuedTasks).toBe(2);

    releaseFn();
    await p1;
    releaseFn();
    await p2;
    releaseFn();
    await p3;

    expect(queue.getStats().completedTasks).toBe(3);
    expect(queue.getStats().queuedTasks).toBe(0);
  });

  it('submit rejects after destroy', async () => {
    const queue = createDispatchQueue(makeMockTransport(), { queueSize: 2, mode: 'concurrent' });
    queue.destroy();
    await expect(queue.submit('t', 'fn', [])).rejects.toThrow('destroyed');
  });

  it('destroy rejects all queued tasks', async () => {
    let releaseFn!: () => void;
    const blockingTransport: FFITransportAPI = {
      buildEnvelope: (id, args) => ({
        functionId: id, args,
        metadata: { schemaMode: 'hybrid', binding: 'swift', timestampMs: 0, ffiPath: '/mock' },
      }),
      dispatch: vi.fn().mockImplementation(() => new Promise<unknown>((r) => { releaseFn = () => r({ ok: true }); })),
      destroy: vi.fn(),
    };

    const queue = createDispatchQueue(blockingTransport, { queueSize: 1, mode: 'concurrent' });

    const p1 = queue.submit('t1', 'fn', []);
    const p2 = queue.submit('t2', 'fn', []);

    await Promise.resolve();

    queue.destroy();

    await expect(p2).rejects.toThrow('destroyed');

    releaseFn();
    await p1.catch(() => {});
  });

  it('drain resolves once all tasks complete', async () => {
    const queue = createDispatchQueue(makeMockTransport(), { queueSize: 2, mode: 'concurrent' });
    queue.submit('t1', 'fn', []);
    queue.submit('t2', 'fn', []);
    await queue.drain();
    const stats = queue.getStats();
    expect(stats.queuedTasks).toBe(0);
    expect(stats.activeTasks).toBe(0);
    expect(stats.completedTasks).toBe(2);
  });
});
