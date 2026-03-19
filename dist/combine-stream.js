function createPublisher(name, bufferSize) {
    const buf = [];
    let isCompleted = false;
    const subscribers = new Set();
    return {
        get name() { return name; },
        get bufferSize() { return bufferSize; },
        get length() { return buf.length; },
        get completed() { return isCompleted; },
        get subscriberCount() { return subscribers.size; },
        send(value) {
            if (isCompleted)
                throw new Error(`Publisher "${name}" is completed`);
            if (buf.length >= bufferSize)
                return false;
            buf.push(value);
            for (const cb of subscribers)
                cb(value);
            return true;
        },
        receive() {
            return buf.shift();
        },
        subscribe(callback) {
            subscribers.add(callback);
            return () => { subscribers.delete(callback); };
        },
        complete() {
            isCompleted = true;
        },
    };
}
export function createCombineStreamManager(config) {
    const publishers = new Map();
    const defaultBufferSize = config.bufferSize;
    return {
        create(name, bufferSize) {
            const pub = createPublisher(name, bufferSize ?? defaultBufferSize);
            publishers.set(name, pub);
            return pub;
        },
        get(name) {
            return publishers.get(name);
        },
        delete(name) {
            publishers.get(name)?.complete();
            publishers.delete(name);
        },
        listNames() {
            return Array.from(publishers.keys());
        },
        destroy() {
            for (const pub of publishers.values())
                pub.complete();
            publishers.clear();
        },
    };
}
//# sourceMappingURL=combine-stream.js.map