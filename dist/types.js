export const SPEC_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_NAME_LENGTH = 64;
export const MAX_DESCRIPTION_LENGTH = 1024;
export const MAX_COMPATIBILITY_LENGTH = 500;
export const RECOMMENDED_BODY_LINES = 500;
export const IGNORE_DIR_NAMES = new Set([
    "node_modules",
    ".git",
    "dist",
    "coverage",
    ".next",
    ".turbo",
    ".cache",
    "__pycache__",
    "vendor",
]);
//# sourceMappingURL=types.js.map