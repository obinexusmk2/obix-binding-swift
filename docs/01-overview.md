# Swift Binding Overview

`@obinexusltd/obix-binding-swift` is a TypeScript binding that connects the **libpolycall FFI /
polyglot ABI bridge** to a Swift runtime, for iOS / macOS native rendering bridges.

## What it does

The binding is a thin, typed control plane over one native entry point. It:

- Builds a structured **invocation envelope** for every call.
- Dispatches envelopes across the ABI boundary via `globalThis.__obixAbiInvoker`.
- Returns **typed error objects** instead of throwing at the FFI edge.
- Resolves interop capabilities from a **schema mode** (`monoglot` /
  `polyglot` / `hybrid`).
- Tracks Swift-runtime state (memory / concurrency) through dedicated helpers.

It does **not** embed a Swift runtime itself — it marshals calls to whatever
native library `ffiPath` points at and records what that library reports back.

## Capabilities

1. Lifecycle: `initialize` / `invoke` / `destroy` / `isInitialized`
2. FFI transport — envelope build + dispatch
3. Schema-mode resolution and validation
4. Typed error model at the ABI boundary
5. Dispatch Queue, ARC, and Combine

## Module map

| Accessor | Type | Responsibility |
|----------|------|----------------|
| `ffiTransport` | `FFITransportAPI` | Envelope builder and ABI dispatcher |
| `arcTracker` | `ARCTrackerAPI` | ARC retain/release counters |
| `dispatchQueue` | `DispatchQueueAPI` | GCD-style task queue (`submit`, `getStats`) |
| `combineStreamManager` | `CombineStreamManagerAPI` | Combine-style publisher registry |
| `schemaResolver` | `SwiftSchemaResolverAPI` | Schema-mode resolver and validator |

See [03-binding-lifecycle.md](03-binding-lifecycle.md) for the full bridge API.
