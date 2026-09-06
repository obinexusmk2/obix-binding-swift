# Dispatch Queue, ARC, and Combine

## Dispatch queue

`submitTask` queues an invocation onto a concurrent dispatch queue of
`dispatchQueueSize` workers, with an optional `DispatchQoS` priority
(`'userInteractive' | 'userInitiated' | 'default' | 'utility' | 'background'`):

```ts
await binding.submitTask('layout', 'computeLayout', [tree], 'userInitiated');
binding.getQueueStats();   // { depth, active, completed }
```

## ARC tracker

`getMemoryUsage()` returns `ARCMemoryStats` — retain / release counts and live
object estimate, as reported by the native side. `binding.arcTracker` exposes the
raw counters.

## Combine streams

`binding.combineStreamManager` registers publisher-style streams (buffer
`publisherBufferSize`) for pushing values from native callbacks into JS
consumers. `renderView` / `handleUIEvent` are stubs pending the native UI bridge.
