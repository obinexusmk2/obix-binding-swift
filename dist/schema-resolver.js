const VALID_MODES = ['monoglot', 'polyglot', 'hybrid'];
export function createSchemaResolver(config) {
    const mode = config.schemaMode;
    return {
        resolve() {
            return {
                mode,
                version: config.swiftVersion ?? 'unknown',
                supportsMultiLanguage: mode === 'polyglot' || mode === 'hybrid',
                swiftConcurrency: mode === 'polyglot' || mode === 'hybrid',
                objcInterop: mode === 'polyglot',
            };
        },
        validate(m) {
            return VALID_MODES.includes(m);
        },
        getMode() {
            return mode;
        },
        destroy() {
        },
    };
}
//# sourceMappingURL=schema-resolver.js.map