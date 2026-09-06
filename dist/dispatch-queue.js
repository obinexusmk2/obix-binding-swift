import { normalizeFunctionIdentifier } from './ffi-transport.js';
const PRIORITY_WEIGHT = {
    userInteractive: 0,
    userInitiated: 1,
    default: 2,
    utility: 3,
    background: 4,
};
export function createDispatchQueue(transport, config) {
    const effectiveSize = config.mode === 'serial' ? 1 : Math.max(1, config.queueSize);
    const queue = [];
    let activeTasks = 0;
    let completedTasks = 0;
    let destroyed = false;
    function drainQueue() {
        while (queue.length > 0 && activeTasks < effectiveSize) {
            const task = queue.shift();
            activeTasks++;
            const fnId = normalizeFunctionIdentifier(task.fn) ?? '<unknown>';
            const envelope = transport.buildEnvelope(fnId, task.args);
            transport.dispatch(envelope).then((result) => {
                activeTasks--;
                completedTasks++;
                task.resolve(result);
                drainQueue();
            }, (err) => {
                activeTasks--;
                completedTasks++;
                task.reject(err);
                drainQueue();
            });
        }
    }
    const api = {
        submit(taskId, fn, args, priority = 'default') {
            if (destroyed) {
                return Promise.reject(new Error('DispatchQueue is destroyed'));
            }
            return new Promise((resolve, reject) => {
                queue.push({ taskId, fn, args, priority, resolve, reject });
                queue.sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]);
                drainQueue();
            });
        },
        getStats() {
            return {
                activeTasks,
                queuedTasks: queue.length,
                completedTasks,
            };
        },
        async drain() {
            while (queue.length > 0 || activeTasks > 0) {
                await new Promise((r) => setTimeout(r, 0));
            }
        },
        destroy() {
            destroyed = true;
            const err = new Error('DispatchQueue destroyed');
            for (const task of queue)
                task.reject(err);
            queue.length = 0;
            activeTasks = 0;
        },
    };
    return api;
}
//# sourceMappingURL=dispatch-queue.js.map