# Installation and Setup

## Install

```bash
npm install @obinexusltd/obix-binding-swift
```

ES modules with `.d.ts` declarations. TypeScript is the only dev dependency.

## Import

```ts
import { createSwiftBinding } from '@obinexusltd/obix-binding-swift';
```

All types and the sub-module factories are re-exported from the package root.

## The ABI invoker contract

Every real invocation goes through one global symbol:

```ts
globalThis.__obixAbiInvoker = {
  invoke(envelopeJson: string): unknown | Promise<unknown> {
    // hand the JSON envelope to the native libpolycall entry point
  },
};
```

- If `__obixAbiInvoker.invoke` is absent, `binding.invoke(...)` returns a
  `MISSING_SYMBOL` error object (it never throws).
- Host runtimes / test harnesses install this symbol; the binding only calls it.

## Environment support

| Environment | Support |
|-------------|---------|
| Node.js 18+ | Full — the intended host |
| Browser / bundler | Imports cleanly; needs a host-provided `__obixAbiInvoker` |
| SSR | Import-safe; no globals touched at load time |

## Build from source

```bash
npm run build   # tsc -> dist/
npm test        # vitest run
```
