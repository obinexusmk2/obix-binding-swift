import type {
  SchemaMode,
  SwiftResolvedSchema,
  SwiftSchemaResolverAPI,
  SwiftSchemaResolverConfig,
} from './types.js';

const VALID_MODES: readonly SchemaMode[] = ['monoglot', 'polyglot', 'hybrid'];

export function createSchemaResolver(config: SwiftSchemaResolverConfig): SwiftSchemaResolverAPI {
  const mode = config.schemaMode;

  return {
    resolve(): SwiftResolvedSchema {
      return {
        mode,
        version: config.swiftVersion ?? 'unknown',
        supportsMultiLanguage: mode === 'polyglot' || mode === 'hybrid',
        swiftConcurrency: mode === 'polyglot' || mode === 'hybrid',
        objcInterop: mode === 'polyglot',
      };
    },

    validate(m: SchemaMode): boolean {
      return (VALID_MODES as readonly string[]).includes(m);
    },

    getMode(): SchemaMode {
      return mode;
    },

    destroy(): void {
      // Stateless
    },
  };
}
