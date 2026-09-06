export type SchemaMode = 'monoglot' | 'polyglot' | 'hybrid';
export interface InvocationEnvelope {
    functionId: string;
    args: unknown[];
    metadata: {
        schemaMode: SchemaMode;
        binding: string;
        timestampMs: number;
        ffiPath: string;
    };
}
export interface BindingInvokeError {
    code: 'NOT_INITIALIZED' | 'MISSING_SYMBOL' | 'INVOCATION_FAILED';
    message: string;
    envelope: InvocationEnvelope;
    cause?: unknown;
}
export interface BindingAbiInvoker {
    invoke(envelopeJson: string): unknown | Promise<unknown>;
}
export interface SwiftFFIDescriptor {
    ffiPath: string;
    swiftVersion: string;
    objcBridgingHeader?: string;
    swiftBridgeModuleName?: string;
    iosDeploymentTarget?: string;
    macosDeploymentTarget?: string;
}
export interface SwiftBindingConfig {
    ffiPath: string;
    swiftVersion?: string;
    schemaMode: SchemaMode;
    memoryModel: 'gc' | 'manual' | 'hybrid';
    objcBridging?: boolean;
    swiftConcurrencyEnabled?: boolean;
    asyncAwaitSupport?: boolean;
    iosDeploymentTarget?: string;
    macosDeploymentTarget?: string;
    tvosDeploymentTarget?: string;
    watchosDeploymentTarget?: string;
    dispatchQueueSize?: number;
    publisherBufferSize?: number;
    ffiDescriptor?: SwiftFFIDescriptor;
}
export interface FFITransportConfig {
    ffiPath: string;
    schemaMode: SchemaMode;
    bindingName: string;
}
export interface FFITransportAPI {
    buildEnvelope(functionId: string, args: unknown[]): InvocationEnvelope;
    dispatch(envelope: InvocationEnvelope): Promise<unknown>;
    destroy(): void;
}
export interface ARCMemoryStats {
    retainCount: number;
    releaseCount: number;
    autoreleasePoolDepth: number;
    liveObjectCount: number;
    peakMemoryBytes: number;
}
export interface ARCTrackerConfig {
    sampleIntervalMs?: number;
}
export interface ARCTrackerAPI {
    snapshot(): ARCMemoryStats;
    recordRetain(): void;
    recordRelease(): void;
    pushAutoreleasePool(): void;
    popAutoreleasePool(): void;
    reset(): void;
    destroy(): void;
}
export type DispatchQoS = 'userInteractive' | 'userInitiated' | 'default' | 'utility' | 'background';
export type DispatchQueueMode = 'serial' | 'concurrent';
export interface DispatchQueueConfig {
    queueSize: number;
    mode: DispatchQueueMode;
}
export interface DispatchTask {
    taskId: string;
    fn: string | object;
    args: unknown[];
    priority: DispatchQoS;
    resolve(result: unknown): void;
    reject(error: unknown): void;
}
export interface DispatchQueueStats {
    activeTasks: number;
    queuedTasks: number;
    completedTasks: number;
}
export interface DispatchQueueAPI {
    submit(taskId: string, fn: string | object, args: unknown[], priority?: DispatchQoS): Promise<unknown>;
    getStats(): DispatchQueueStats;
    drain(): Promise<void>;
    destroy(): void;
}
export interface CombinePublisher<T = unknown> {
    readonly name: string;
    readonly bufferSize: number;
    readonly length: number;
    readonly completed: boolean;
    readonly subscriberCount: number;
    send(value: T): boolean;
    receive(): T | undefined;
    subscribe(callback: (value: T) => void): () => void;
    complete(): void;
}
export interface CombineStreamConfig {
    bufferSize: number;
}
export interface CombineStreamManagerAPI {
    create<T = unknown>(name: string, bufferSize?: number): CombinePublisher<T>;
    get<T = unknown>(name: string): CombinePublisher<T> | undefined;
    delete(name: string): void;
    listNames(): string[];
    destroy(): void;
}
export interface SwiftSchemaResolverConfig {
    schemaMode: SchemaMode;
    swiftVersion?: string;
}
export interface SwiftResolvedSchema {
    mode: SchemaMode;
    version: string;
    supportsMultiLanguage: boolean;
    swiftConcurrency: boolean;
    objcInterop: boolean;
}
export interface SwiftSchemaResolverAPI {
    resolve(): SwiftResolvedSchema;
    validate(mode: SchemaMode): boolean;
    getMode(): SchemaMode;
    destroy(): void;
}
export interface SwiftBindingBridge {
    initialize(): Promise<void>;
    invoke(fn: string | object, args: unknown[]): Promise<unknown>;
    destroy(): Promise<void>;
    getMemoryUsage(): ARCMemoryStats;
    getSchemaMode(): SchemaMode;
    isInitialized(): boolean;
    submitTask(taskId: string, fn: string | object, args: unknown[], priority?: DispatchQoS): Promise<unknown>;
    getQueueStats(): DispatchQueueStats;
    renderView(viewDescriptor: object): Promise<void>;
    handleUIEvent(eventType: string, eventData: object): Promise<unknown>;
    readonly ffiTransport: FFITransportAPI;
    readonly dispatchQueue: DispatchQueueAPI;
    readonly combineStreamManager: CombineStreamManagerAPI;
    readonly arcTracker: ARCTrackerAPI;
    readonly schemaResolver: SwiftSchemaResolverAPI;
}
//# sourceMappingURL=types.d.ts.map