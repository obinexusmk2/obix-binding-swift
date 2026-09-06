export { createFFITransport, normalizeFunctionIdentifier } from './ffi-transport.js';
export { createARCTracker } from './arc-tracker.js';
export { createDispatchQueue } from './dispatch-queue.js';
export { createCombineStreamManager } from './combine-stream.js';
export { createSchemaResolver } from './schema-resolver.js';
import { createFFITransport, normalizeFunctionIdentifier } from './ffi-transport.js';
import { createARCTracker } from './arc-tracker.js';
import { createDispatchQueue } from './dispatch-queue.js';
import { createCombineStreamManager } from './combine-stream.js';
import { createSchemaResolver } from './schema-resolver.js';
export function createSwiftBinding(config) {
    let initialized = false;
    const ABI_BINDING_NAME = 'swift';
    const ffiTransport = createFFITransport({
        ffiPath: config.ffiPath,
        schemaMode: config.schemaMode,
        bindingName: ABI_BINDING_NAME,
    });
    const dispatchQueue = createDispatchQueue(ffiTransport, {
        queueSize: config.dispatchQueueSize ?? 4,
        mode: 'concurrent',
    });
    const combineStreamManager = createCombineStreamManager({
        bufferSize: config.publisherBufferSize ?? 16,
    });
    const arcTracker = createARCTracker({});
    const schemaResolver = createSchemaResolver({
        schemaMode: config.schemaMode,
        swiftVersion: config.swiftVersion ?? config.ffiDescriptor?.swiftVersion,
    });
    const bridge = {
        async initialize() {
            if (typeof config.ffiPath !== 'string' || config.ffiPath.trim().length === 0) {
                throw new Error(`Invalid ffiPath: ${config.ffiPath}`);
            }
            if (!schemaResolver.validate(config.schemaMode)) {
                throw new Error(`Invalid schemaMode: ${config.schemaMode}`);
            }
            initialized = true;
        },
        async invoke(fn, args) {
            const functionId = normalizeFunctionIdentifier(fn);
            const envelope = ffiTransport.buildEnvelope(functionId ?? '<unknown>', args);
            if (!initialized) {
                return { code: 'NOT_INITIALIZED', message: 'Binding is not initialized', envelope };
            }
            if (!functionId) {
                return { code: 'MISSING_SYMBOL', message: 'Function identifier was not provided', envelope };
            }
            return ffiTransport.dispatch(envelope);
        },
        async destroy() {
            dispatchQueue.destroy();
            combineStreamManager.destroy();
            arcTracker.destroy();
            ffiTransport.destroy();
            schemaResolver.destroy();
            initialized = false;
        },
        getMemoryUsage() {
            return arcTracker.snapshot();
        },
        getSchemaMode() {
            return schemaResolver.getMode();
        },
        isInitialized() {
            return initialized;
        },
        async submitTask(taskId, fn, args, priority) {
            if (!initialized) {
                return { code: 'NOT_INITIALIZED', message: 'Binding is not initialized' };
            }
            return dispatchQueue.submit(taskId, fn, args, priority);
        },
        getQueueStats() {
            return dispatchQueue.getStats();
        },
        async renderView(_viewDescriptor) {
        },
        async handleUIEvent(_eventType, _eventData) {
            return undefined;
        },
        get ffiTransport() { return ffiTransport; },
        get dispatchQueue() { return dispatchQueue; },
        get combineStreamManager() { return combineStreamManager; },
        get arcTracker() { return arcTracker; },
        get schemaResolver() { return schemaResolver; },
    };
    return bridge;
}
//# sourceMappingURL=index.js.map