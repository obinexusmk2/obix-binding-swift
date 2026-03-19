/**
 * OBIX Swift Binding
 * iOS/macOS native rendering bridge
 * Connects libpolycall FFI/polyglot bridge to Swift runtime
 */
export type { SchemaMode, InvocationEnvelope, BindingInvokeError, BindingAbiInvoker, SwiftFFIDescriptor, SwiftBindingConfig, SwiftBindingBridge, ARCMemoryStats, ARCTrackerConfig, ARCTrackerAPI, DispatchQoS, DispatchQueueMode, DispatchQueueConfig, DispatchTask, DispatchQueueStats, DispatchQueueAPI, CombinePublisher, CombineStreamConfig, CombineStreamManagerAPI, SwiftSchemaResolverConfig, SwiftResolvedSchema, SwiftSchemaResolverAPI, FFITransportConfig, FFITransportAPI, } from './types.js';
export { createFFITransport, normalizeFunctionIdentifier } from './ffi-transport.js';
export { createARCTracker } from './arc-tracker.js';
export { createDispatchQueue } from './dispatch-queue.js';
export { createCombineStreamManager } from './combine-stream.js';
export { createSchemaResolver } from './schema-resolver.js';
import type { SwiftBindingBridge, SwiftBindingConfig } from './types.js';
/**
 * Create a Swift binding to libpolycall
 * @param config Configuration for the binding
 * @returns Bridge for invoking polyglot functions and managing Swift runtime state
 */
export declare function createSwiftBinding(config: SwiftBindingConfig): SwiftBindingBridge;
//# sourceMappingURL=index.d.ts.map