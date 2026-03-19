/**
 * OBIX Swift Binding
 * iOS/macOS native rendering bridge
 * Connects libpolycall FFI/polyglot bridge to Swift runtime
 */

// ── Type re-exports ────────────────────────────────────────────────────────────
export type {
  SchemaMode,
  InvocationEnvelope,
  BindingInvokeError,
  BindingAbiInvoker,
  SwiftFFIDescriptor,
  SwiftBindingConfig,
  SwiftBindingBridge,
  ARCMemoryStats,
  ARCTrackerConfig,
  ARCTrackerAPI,
  DispatchQoS,
  DispatchQueueMode,
  DispatchQueueConfig,
  DispatchTask,
  DispatchQueueStats,
  DispatchQueueAPI,
  CombinePublisher,
  CombineStreamConfig,
  CombineStreamManagerAPI,
  SwiftSchemaResolverConfig,
  SwiftResolvedSchema,
  SwiftSchemaResolverAPI,
  FFITransportConfig,
  FFITransportAPI,
} from './types.js';

// ── Sub-module factory re-exports ─────────────────────────────────────────────
export { createFFITransport, normalizeFunctionIdentifier } from './ffi-transport.js';
export { createARCTracker } from './arc-tracker.js';
export { createDispatchQueue } from './dispatch-queue.js';
export { createCombineStreamManager } from './combine-stream.js';
export { createSchemaResolver } from './schema-resolver.js';

// ── Imports for the main factory ──────────────────────────────────────────────
import type {
  ARCMemoryStats,
  DispatchQoS,
  DispatchQueueStats,
  SwiftBindingBridge,
  SwiftBindingConfig,
} from './types.js';
import { createFFITransport, normalizeFunctionIdentifier } from './ffi-transport.js';
import { createARCTracker } from './arc-tracker.js';
import { createDispatchQueue } from './dispatch-queue.js';
import { createCombineStreamManager } from './combine-stream.js';
import { createSchemaResolver } from './schema-resolver.js';

// ── Main factory ──────────────────────────────────────────────────────────────

/**
 * Create a Swift binding to libpolycall
 * @param config Configuration for the binding
 * @returns Bridge for invoking polyglot functions and managing Swift runtime state
 */
export function createSwiftBinding(config: SwiftBindingConfig): SwiftBindingBridge {
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

  const bridge: SwiftBindingBridge = {
    async initialize(): Promise<void> {
      if (typeof config.ffiPath !== 'string' || config.ffiPath.trim().length === 0) {
        throw new Error(`Invalid ffiPath: ${config.ffiPath}`);
      }
      if (!schemaResolver.validate(config.schemaMode)) {
        throw new Error(`Invalid schemaMode: ${config.schemaMode}`);
      }
      initialized = true;
    },

    async invoke(fn: string | object, args: unknown[]): Promise<unknown> {
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

    async destroy(): Promise<void> {
      dispatchQueue.destroy();
      combineStreamManager.destroy();
      arcTracker.destroy();
      ffiTransport.destroy();
      schemaResolver.destroy();
      initialized = false;
    },

    getMemoryUsage(): ARCMemoryStats {
      return arcTracker.snapshot();
    },

    getSchemaMode() {
      return schemaResolver.getMode();
    },

    isInitialized(): boolean {
      return initialized;
    },

    async submitTask(
      taskId: string,
      fn: string | object,
      args: unknown[],
      priority?: DispatchQoS,
    ): Promise<unknown> {
      if (!initialized) {
        return { code: 'NOT_INITIALIZED', message: 'Binding is not initialized' };
      }
      return dispatchQueue.submit(taskId, fn, args, priority);
    },

    getQueueStats(): DispatchQueueStats {
      return dispatchQueue.getStats();
    },

    async renderView(_viewDescriptor: object): Promise<void> {
      // Stub — future native bridge integration
    },

    async handleUIEvent(_eventType: string, _eventData: object): Promise<unknown> {
      // Stub — future native bridge integration
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
