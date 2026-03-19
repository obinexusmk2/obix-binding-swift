import type {
  DispatchQoS,
  DispatchQueueAPI,
  DispatchQueueConfig,
  DispatchQueueStats,
  DispatchTask,
  FFITransportAPI,
} from './types.js';

import { normalizeFunctionIdentifier } from './ffi-transport.js';

const PRIORITY_WEIGHT: Record<DispatchQoS, number> = {
  userInteractive: 0,
  userInitiated: 1,
  default: 2,
  utility: 3,
  background: 4,
};

export function createDispatchQueue(
  transport: FFITransportAPI,
  config: DispatchQueueConfig,
): DispatchQueueAPI {
  const effectiveSize = config.mode === 'serial' ? 1 : Math.max(1, config.queueSize);
  const queue: DispatchTask[] = [];
  let activeTasks = 0;
  let completedTasks = 0;
  let destroyed = false;

  function drainQueue(): void {
    while (queue.length > 0 && activeTasks < effectiveSize) {
      const task = queue.shift()!;
      activeTasks++;

      const fnId = normalizeFunctionIdentifier(task.fn) ?? '<unknown>';
      const envelope = transport.buildEnvelope(fnId, task.args);

      transport.dispatch(envelope).then(
        (result) => {
          activeTasks--;
          completedTasks++;
          task.resolve(result);
          drainQueue();
        },
        (err) => {
          activeTasks--;
          completedTasks++;
          task.reject(err);
          drainQueue();
        },
      );
    }
  }

  const api: DispatchQueueAPI = {
    submit(
      taskId: string,
      fn: string | object,
      args: unknown[],
      priority: DispatchQoS = 'default',
    ): Promise<unknown> {
      if (destroyed) {
        return Promise.reject(new Error('DispatchQueue is destroyed'));
      }
      return new Promise<unknown>((resolve, reject) => {
        queue.push({ taskId, fn, args, priority, resolve, reject });
        // Stable sort by priority weight (lower = higher priority)
        queue.sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]);
        drainQueue();
      });
    },

    getStats(): DispatchQueueStats {
      return {
        activeTasks,
        queuedTasks: queue.length,
        completedTasks,
      };
    },

    async drain(): Promise<void> {
      while (queue.length > 0 || activeTasks > 0) {
        await new Promise<void>((r) => setTimeout(r, 0));
      }
    },

    destroy(): void {
      destroyed = true;
      const err = new Error('DispatchQueue destroyed');
      for (const task of queue) task.reject(err);
      queue.length = 0;
      activeTasks = 0;
    },
  };

  return api;
}
