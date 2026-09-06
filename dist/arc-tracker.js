const BYTES_PER_OBJECT = 64;
export function createARCTracker(config = {}) {
    void config;
    let retainCount = 0;
    let releaseCount = 0;
    let autoreleasePoolDepth = 0;
    let peakMemoryBytes = 0;
    function liveObjectCount() {
        return Math.max(0, retainCount - releaseCount);
    }
    function currentMemoryBytes() {
        return liveObjectCount() * BYTES_PER_OBJECT;
    }
    const tracker = {
        snapshot() {
            return {
                retainCount,
                releaseCount,
                autoreleasePoolDepth,
                liveObjectCount: liveObjectCount(),
                peakMemoryBytes,
            };
        },
        recordRetain() {
            retainCount++;
            const mem = currentMemoryBytes();
            if (mem > peakMemoryBytes) {
                peakMemoryBytes = mem;
            }
        },
        recordRelease() {
            releaseCount++;
        },
        pushAutoreleasePool() {
            autoreleasePoolDepth++;
        },
        popAutoreleasePool() {
            if (autoreleasePoolDepth > 0) {
                autoreleasePoolDepth--;
                const drainCount = Math.floor(liveObjectCount() * 0.2);
                releaseCount += drainCount;
            }
        },
        reset() {
            retainCount = 0;
            releaseCount = 0;
            autoreleasePoolDepth = 0;
            peakMemoryBytes = 0;
        },
        destroy() {
            tracker.reset();
        },
    };
    return tracker;
}
//# sourceMappingURL=arc-tracker.js.map