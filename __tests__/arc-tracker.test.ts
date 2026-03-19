import { describe, expect, it } from 'vitest';
import { createARCTracker } from '../src/arc-tracker';

describe('createARCTracker', () => {
  it('snapshot returns zero stats initially', () => {
    const tracker = createARCTracker();
    expect(tracker.snapshot()).toEqual({
      retainCount: 0,
      releaseCount: 0,
      autoreleasePoolDepth: 0,
      liveObjectCount: 0,
      peakMemoryBytes: 0,
    });
  });

  it('recordRetain increments retainCount and liveObjectCount', () => {
    const tracker = createARCTracker();
    tracker.recordRetain();
    tracker.recordRetain();
    const snap = tracker.snapshot();
    expect(snap.retainCount).toBe(2);
    expect(snap.liveObjectCount).toBe(2);
  });

  it('recordRelease increments releaseCount and decrements liveObjectCount', () => {
    const tracker = createARCTracker();
    tracker.recordRetain();
    tracker.recordRetain();
    tracker.recordRelease();
    const snap = tracker.snapshot();
    expect(snap.releaseCount).toBe(1);
    expect(snap.liveObjectCount).toBe(1);
  });

  it('liveObjectCount never goes below zero', () => {
    const tracker = createARCTracker();
    tracker.recordRetain();
    tracker.recordRelease();
    tracker.recordRelease();
    tracker.recordRelease();
    expect(tracker.snapshot().liveObjectCount).toBe(0);
  });

  it('peakMemoryBytes tracks high-water mark', () => {
    const tracker = createARCTracker();
    tracker.recordRetain(); // 1 obj = 64 bytes
    tracker.recordRetain(); // 2 obj = 128 bytes
    tracker.recordRelease(); // 1 obj = 64 bytes (peak stays 128)
    expect(tracker.snapshot().peakMemoryBytes).toBe(128);
  });

  it('pushAutoreleasePool increments depth', () => {
    const tracker = createARCTracker();
    tracker.pushAutoreleasePool();
    tracker.pushAutoreleasePool();
    expect(tracker.snapshot().autoreleasePoolDepth).toBe(2);
  });

  it('popAutoreleasePool decrements depth and simulates drain', () => {
    const tracker = createARCTracker();
    // Create some objects
    for (let i = 0; i < 10; i++) tracker.recordRetain();
    tracker.pushAutoreleasePool();
    tracker.popAutoreleasePool();
    expect(tracker.snapshot().autoreleasePoolDepth).toBe(0);
    // liveObjectCount should decrease due to drain (~20% released)
    expect(tracker.snapshot().liveObjectCount).toBeLessThan(10);
  });

  it('popAutoreleasePool clamps depth at zero', () => {
    const tracker = createARCTracker();
    tracker.popAutoreleasePool();
    tracker.popAutoreleasePool();
    expect(tracker.snapshot().autoreleasePoolDepth).toBe(0);
  });

  it('reset zeroes all fields', () => {
    const tracker = createARCTracker();
    tracker.recordRetain();
    tracker.recordRetain();
    tracker.recordRelease();
    tracker.pushAutoreleasePool();
    tracker.reset();
    expect(tracker.snapshot()).toEqual({
      retainCount: 0,
      releaseCount: 0,
      autoreleasePoolDepth: 0,
      liveObjectCount: 0,
      peakMemoryBytes: 0,
    });
  });

  it('destroy calls reset', () => {
    const tracker = createARCTracker();
    tracker.recordRetain();
    tracker.destroy();
    expect(tracker.snapshot()).toEqual({
      retainCount: 0,
      releaseCount: 0,
      autoreleasePoolDepth: 0,
      liveObjectCount: 0,
      peakMemoryBytes: 0,
    });
  });
});
