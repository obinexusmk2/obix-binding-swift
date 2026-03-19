import { afterEach, describe, expect, it } from 'vitest';
import { createSwiftBinding } from '../src/index';

describe('swift binding smoke', () => {
  afterEach(() => {
    delete (globalThis as any).__obixAbiInvoker;
  });

  it('toggles initialize/destroy state and uses shared invocation envelope', async () => {
    const ffiPath = '/tmp/obix-swift-ffi.mock';

    const binding = createSwiftBinding({
      ffiPath,
      schemaMode: 'hybrid',
      memoryModel: 'hybrid',
    });

    expect(binding.isInitialized()).toBe(false);

    const beforeInit = await binding.invoke('ping', [1]);
    expect(beforeInit).toMatchObject({ code: 'NOT_INITIALIZED' });

    await binding.initialize();
    expect(binding.isInitialized()).toBe(true);

    const noSymbol = await binding.invoke('ping', [1]);
    expect(noSymbol).toMatchObject({ code: 'MISSING_SYMBOL' });

    (globalThis as any).__obixAbiInvoker = {
      invoke: (payload: string) => {
        const envelope = JSON.parse(payload);
        return { ok: true, echo: envelope };
      },
    };

    const result = await binding.invoke('ping', [1, 2, 3]);
    expect(result).toMatchObject({
      ok: true,
      echo: {
        functionId: 'ping',
        args: [1, 2, 3],
        metadata: { binding: 'swift', ffiPath },
      },
    });

    await binding.destroy();
    expect(binding.isInitialized()).toBe(false);
  });

  it('getMemoryUsage returns ARCMemoryStats shape', () => {
    const binding = createSwiftBinding({
      ffiPath: '/tmp/test.dylib',
      schemaMode: 'monoglot',
      memoryModel: 'manual',
    });

    const mem = binding.getMemoryUsage();
    expect(mem).toEqual({
      retainCount: 0,
      releaseCount: 0,
      autoreleasePoolDepth: 0,
      liveObjectCount: 0,
      peakMemoryBytes: 0,
    });
  });

  it('getQueueStats returns DispatchQueueStats shape', () => {
    const binding = createSwiftBinding({
      ffiPath: '/tmp/test.dylib',
      schemaMode: 'hybrid',
      memoryModel: 'hybrid',
    });

    expect(binding.getQueueStats()).toEqual({
      activeTasks: 0,
      queuedTasks: 0,
      completedTasks: 0,
    });
  });

  it('getSchemaMode returns configured mode', () => {
    const binding = createSwiftBinding({
      ffiPath: '/tmp/test.dylib',
      schemaMode: 'polyglot',
      memoryModel: 'gc',
    });

    expect(binding.getSchemaMode()).toBe('polyglot');
  });

  it('sub-module accessors are defined', () => {
    const binding = createSwiftBinding({
      ffiPath: '/tmp/test.dylib',
      schemaMode: 'hybrid',
      memoryModel: 'hybrid',
    });

    expect(binding.ffiTransport).toBeDefined();
    expect(binding.dispatchQueue).toBeDefined();
    expect(binding.combineStreamManager).toBeDefined();
    expect(binding.arcTracker).toBeDefined();
    expect(binding.schemaResolver).toBeDefined();
  });

  it('submitTask returns NOT_INITIALIZED before init', async () => {
    const binding = createSwiftBinding({
      ffiPath: '/tmp/test.dylib',
      schemaMode: 'hybrid',
      memoryModel: 'hybrid',
    });

    const result = await binding.submitTask('t1', 'fn', []);
    expect(result).toMatchObject({ code: 'NOT_INITIALIZED' });
  });
});
