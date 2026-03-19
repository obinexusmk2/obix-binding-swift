import { describe, expect, it } from 'vitest';
import { createSchemaResolver } from '../src/schema-resolver';

describe('createSchemaResolver', () => {
  it('getMode returns the configured schema mode', () => {
    const resolver = createSchemaResolver({ schemaMode: 'polyglot' });
    expect(resolver.getMode()).toBe('polyglot');
  });

  it('resolve — monoglot: supportsMultiLanguage=false, swiftConcurrency=false, objcInterop=false', () => {
    const schema = createSchemaResolver({ schemaMode: 'monoglot' }).resolve();
    expect(schema.supportsMultiLanguage).toBe(false);
    expect(schema.swiftConcurrency).toBe(false);
    expect(schema.objcInterop).toBe(false);
    expect(schema.mode).toBe('monoglot');
  });

  it('resolve — polyglot: supportsMultiLanguage=true, swiftConcurrency=true, objcInterop=true', () => {
    const schema = createSchemaResolver({ schemaMode: 'polyglot' }).resolve();
    expect(schema.supportsMultiLanguage).toBe(true);
    expect(schema.swiftConcurrency).toBe(true);
    expect(schema.objcInterop).toBe(true);
  });

  it('resolve — hybrid: supportsMultiLanguage=true, swiftConcurrency=true, objcInterop=false', () => {
    const schema = createSchemaResolver({ schemaMode: 'hybrid' }).resolve();
    expect(schema.supportsMultiLanguage).toBe(true);
    expect(schema.swiftConcurrency).toBe(true);
    expect(schema.objcInterop).toBe(false);
  });

  it('resolve includes swiftVersion when provided', () => {
    const resolver = createSchemaResolver({ schemaMode: 'hybrid', swiftVersion: '5.10' });
    expect(resolver.resolve().version).toBe('5.10');
  });

  it('resolve uses "unknown" when swiftVersion is absent', () => {
    const resolver = createSchemaResolver({ schemaMode: 'monoglot' });
    expect(resolver.resolve().version).toBe('unknown');
  });

  it('validate returns true for all valid modes', () => {
    const resolver = createSchemaResolver({ schemaMode: 'monoglot' });
    expect(resolver.validate('monoglot')).toBe(true);
    expect(resolver.validate('polyglot')).toBe(true);
    expect(resolver.validate('hybrid')).toBe(true);
  });

  it('validate returns false for an unrecognized mode string', () => {
    const resolver = createSchemaResolver({ schemaMode: 'monoglot' });
    expect(resolver.validate('wasm' as any)).toBe(false);
  });

  it('destroy does not throw', () => {
    const resolver = createSchemaResolver({ schemaMode: 'hybrid' });
    expect(() => resolver.destroy()).not.toThrow();
  });
});
