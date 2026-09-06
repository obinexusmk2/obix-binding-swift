# Binding Lifecycle and Configuration

## Factory

```ts
const binding = createSwiftBinding(config);
```

## `SwiftBindingConfig`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `ffiPath` | `string` | **required** | Path to the libpolycall shared library |
| `schemaMode` | `'monoglot' \| 'polyglot' \| 'hybrid'` | **required** | Polyglot interop mode |
| `dispatchQueueSize` | `number` | `4` | Worker count for the dispatch queue |
| `publisherBufferSize` | `number` | `16` | Default Combine publisher buffer |
| `swiftVersion` | `string` | — | Swift version for the schema resolver |
| `ffiDescriptor` | `SwiftFFIDescriptor` | — | Optional structured FFI descriptor (`swiftVersion`, …) |

## Lifecycle methods

| Method | Description |
|--------|-------------|
| `initialize(): Promise<void>` | Validates `ffiPath` (non-empty string) and `schemaMode` (valid enum). **Throws** on invalid input. Marks the binding ready. |
| `invoke(fn, args): Promise<unknown>` | Build an envelope for `fn` and dispatch it. Returns the native result, or a `BindingInvokeError` object — **never throws**. |
| `destroy(): Promise<void>` | Tear down every sub-module and mark the binding uninitialised. Not reusable afterwards. |
| `isInitialized(): boolean` | Ready state. |
| `getSchemaMode(): SchemaMode` | The resolved schema mode. |
| `getMemoryUsage()` | Swift memory snapshot (`ARCMemoryStats`). |

`fn` may be a string, or an object with `functionId` / `id` / `name` — see
[04-ffi-transport-and-abi.md](04-ffi-transport-and-abi.md).

## Swift-specific bridge methods

| Method | Description |
|--------|-------------|
| `submitTask(taskId, fn, args, priority?: DispatchQoS): Promise<unknown>` | Queue an invocation at an optional QoS; `NOT_INITIALIZED` before `initialize()` |
| `getQueueStats(): DispatchQueueStats` | Queue depth, active tasks, completed count |
| `renderView(viewDescriptor): Promise<void>` | Stub — reserved for native view bridging |
| `handleUIEvent(eventType, eventData): Promise<unknown>` | Stub — reserved for native event bridging |

## Sub-module accessors

```ts
binding.ffiTransport        // FFITransportAPI
binding.arcTracker          // ARCTrackerAPI
binding.dispatchQueue       // DispatchQueueAPI
binding.combineStreamManager// CombineStreamManagerAPI
binding.schemaResolver      // SwiftSchemaResolverAPI
```

## Example

```ts
const binding = createSwiftBinding({
  ffiPath: '/opt/lib/libpolycall.so',
  schemaMode: 'polyglot',
  memoryModel: 'hybrid',
});

await binding.initialize();
const result = await binding.invoke('renderFrame', [1920, 1080]);
console.log(binding.getMemoryUsage());
await binding.destroy();
```
