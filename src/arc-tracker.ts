import type { ARCMemoryStats, ARCTrackerAPI, ARCTrackerConfig } from './types.js';

const BYTES_PER_OBJECT = 64;

export function createARCTracker(config: ARCTrackerConfig = {}): ARCTrackerAPI {
  void config;

  let retainCount = 0;
  let releaseCount = 0;
  let autoreleasePoolDepth = 0;
  let peakMemoryBytes = 0;

  function liveObjectCount(): number {
    return Math.max(0, retainCount - releaseCount);
  }

  function currentMemoryBytes(): number {
    return liveObjectCount() * BYTES_PER_OBJECT;
  }

  const tracker: ARCTrackerAPI = {
    snapshot(): ARCMemoryStats {
      return {
        retainCount,
        releaseCount,
        autoreleasePoolDepth,
        liveObjectCount: liveObjectCount(),
        peakMemoryBytes,
      };
    },

    recordRetain(): void {
      retainCount++;
      const mem = currentMemoryBytes();
      if (mem > peakMemoryBytes) {
        peakMemoryBytes = mem;
      }
    },

    recordRelease(): void {
      releaseCount++;
    },

    pushAutoreleasePool(): void {
      autoreleasePoolDepth++;
    },

    popAutoreleasePool(): void {
      if (autoreleasePoolDepth > 0) {
        autoreleasePoolDepth--;
        // Simulate draining: release ~20% of live objects
        const drainCount = Math.floor(liveObjectCount() * 0.2);
        releaseCount += drainCount;
      }
    },

    reset(): void {
      retainCount = 0;
      releaseCount = 0;
      autoreleasePoolDepth = 0;
      peakMemoryBytes = 0;
    },

    destroy(): void {
      tracker.reset();
    },
  };

  return tracker;
}
