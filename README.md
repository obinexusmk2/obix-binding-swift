# @obinexusltd/obix-binding-swift

TypeScript bindings for an OBIX Swift bridge that connects a libpolycall-style FFI layer to Swift runtimes on iOS and macOS.

## Features

- Creates a Swift binding with lifecycle management.
- Builds invocation envelopes for FFI dispatch.
- Exposes dispatch queue, ARC tracking, schema resolution, and Combine stream helpers.
- Supports `monoglot`, `polyglot`, and `hybrid` schema modes.

## Installation

```bash
npm install @obinexusltd/obix-binding-swift
```

## Usage

```ts
import { createSwiftBinding } from '@obinexusltd/obix-binding-swift';

const binding = createSwiftBinding({
  ffiPath: '/path/to/libpolycall',
  schemaMode: 'hybrid',
  memoryModel: 'hybrid',
  objcBridging: true,
  swiftConcurrencyEnabled: true,
  asyncAwaitSupport: true,
  swiftVersion: '5.10',
});

await binding.initialize();

const result = await binding.invoke('render_view', [{ screen: 'home' }]);
console.log(result);

await binding.destroy();
```

## API overview

### `createSwiftBinding(config)`

Creates a `SwiftBindingBridge` with the following core capabilities:

- `initialize()` to validate configuration and mark the bridge ready.
- `invoke(fn, args)` to dispatch FFI calls.
- `submitTask(taskId, fn, args, priority?)` to queue work.
- `getMemoryUsage()` to inspect ARC statistics.
- `getQueueStats()` to inspect dispatch queue activity.
- `getSchemaMode()` and `schemaResolver` helpers for schema behavior.
- `combineStreamManager` for lightweight publisher/subscriber streams.

## Development

```bash
npm test
npm run build
```

## Documentation

In-depth guides live in [`docs/`](docs/):

| # | Guide |
|---|-------|
| 01 | [Overview](docs/01-overview.md) |
| 02 | [Installation and Setup](docs/02-installation-and-setup.md) |
| 03 | [Binding Lifecycle and Configuration](docs/03-binding-lifecycle.md) |
| 04 | [FFI Transport and the ABI Boundary](docs/04-ffi-transport-and-abi.md) |
| 05 | [Schema Modes](docs/05-schema-modes.md) |
| 06 | [Runtime Features](docs/06-runtime-features.md) |
| 07 | [Best Practices](docs/07-best-practices.md) |

---

## License

MIT.
