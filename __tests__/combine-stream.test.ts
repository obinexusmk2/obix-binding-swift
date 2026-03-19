import { describe, expect, it } from 'vitest';
import { createCombineStreamManager } from '../src/combine-stream';

describe('createCombineStreamManager', () => {
  it('create returns a publisher with the correct name and bufferSize', () => {
    const manager = createCombineStreamManager({ bufferSize: 8 });
    const pub = manager.create('events', 4);
    expect(pub.name).toBe('events');
    expect(pub.bufferSize).toBe(4);
  });

  it('create uses the default bufferSize when none is supplied', () => {
    const manager = createCombineStreamManager({ bufferSize: 16 });
    const pub = manager.create('data');
    expect(pub.bufferSize).toBe(16);
  });

  it('get retrieves a previously created publisher', () => {
    const manager = createCombineStreamManager({ bufferSize: 4 });
    manager.create('jobs');
    expect(manager.get('jobs')).toBeDefined();
  });

  it('get returns undefined for an unknown publisher', () => {
    const manager = createCombineStreamManager({ bufferSize: 4 });
    expect(manager.get('nonexistent')).toBeUndefined();
  });

  it('listNames returns all publisher names', () => {
    const manager = createCombineStreamManager({ bufferSize: 4 });
    manager.create('a');
    manager.create('b');
    manager.create('c');
    expect(manager.listNames().sort()).toEqual(['a', 'b', 'c']);
  });

  it('delete completes and removes the publisher', () => {
    const manager = createCombineStreamManager({ bufferSize: 4 });
    const pub = manager.create('temp');
    manager.delete('temp');
    expect(manager.get('temp')).toBeUndefined();
    expect(manager.listNames()).not.toContain('temp');
    expect(pub.completed).toBe(true);
  });

  it('destroy completes all publishers and empties the registry', () => {
    const manager = createCombineStreamManager({ bufferSize: 4 });
    const pub1 = manager.create('x');
    const pub2 = manager.create('y');
    manager.destroy();
    expect(pub1.completed).toBe(true);
    expect(pub2.completed).toBe(true);
    expect(manager.listNames()).toHaveLength(0);
  });
});

describe('CombinePublisher', () => {
  it('send adds items FIFO; receive removes them in order', () => {
    const manager = createCombineStreamManager({ bufferSize: 8 });
    const pub = manager.create<number>('fifo', 3);
    expect(pub.send(1)).toBe(true);
    expect(pub.send(2)).toBe(true);
    expect(pub.send(3)).toBe(true);
    expect(pub.receive()).toBe(1);
    expect(pub.receive()).toBe(2);
    expect(pub.receive()).toBe(3);
    expect(pub.receive()).toBeUndefined();
  });

  it('send returns false when buffer is full', () => {
    const manager = createCombineStreamManager({ bufferSize: 2 });
    const pub = manager.create<number>('bounded', 2);
    expect(pub.send(1)).toBe(true);
    expect(pub.send(2)).toBe(true);
    expect(pub.send(3)).toBe(false);
    expect(pub.length).toBe(2);
  });

  it('send throws when publisher is completed', () => {
    const manager = createCombineStreamManager({ bufferSize: 4 });
    const pub = manager.create('done-pub');
    pub.complete();
    expect(() => pub.send('x')).toThrow(/completed/);
  });

  it('completed flag becomes true after complete()', () => {
    const manager = createCombineStreamManager({ bufferSize: 4 });
    const pub = manager.create('flag-pub');
    expect(pub.completed).toBe(false);
    pub.complete();
    expect(pub.completed).toBe(true);
  });

  it('length reflects the current number of buffered items', () => {
    const manager = createCombineStreamManager({ bufferSize: 4 });
    const pub = manager.create<string>('len-pub', 4);
    expect(pub.length).toBe(0);
    pub.send('a');
    pub.send('b');
    expect(pub.length).toBe(2);
    pub.receive();
    expect(pub.length).toBe(1);
  });

  it('subscribe receives values on send', () => {
    const manager = createCombineStreamManager({ bufferSize: 4 });
    const pub = manager.create<number>('sub-pub', 4);
    const received: number[] = [];
    pub.subscribe((v) => received.push(v));
    pub.send(10);
    pub.send(20);
    expect(received).toEqual([10, 20]);
  });

  it('unsubscribe stops notifications', () => {
    const manager = createCombineStreamManager({ bufferSize: 4 });
    const pub = manager.create<number>('unsub-pub', 4);
    const received: number[] = [];
    const unsub = pub.subscribe((v) => received.push(v));
    pub.send(1);
    unsub();
    pub.send(2);
    expect(received).toEqual([1]);
  });

  it('subscriberCount tracks active subscribers', () => {
    const manager = createCombineStreamManager({ bufferSize: 4 });
    const pub = manager.create('count-pub', 4);
    expect(pub.subscriberCount).toBe(0);
    const unsub1 = pub.subscribe(() => {});
    const unsub2 = pub.subscribe(() => {});
    expect(pub.subscriberCount).toBe(2);
    unsub1();
    expect(pub.subscriberCount).toBe(1);
    unsub2();
    expect(pub.subscriberCount).toBe(0);
  });
});
