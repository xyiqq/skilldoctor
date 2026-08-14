import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
export function loadFileConfig(startPath) {
    const config = { ignore: [] };
    let dir = resolve(startPath);
    try {
        if (existsSync(dir) && statSync(dir).isFile())
            dir = dirname(dir);
    }
    catch {
        dir = resolve(startPath);
    }
    for (let i = 0; i < 10; i += 1) {
        const jsonPath = join(dir, ".skilldoctor.json");
        if (existsSync(jsonPath)) {
            Object.assign(config, parseJsonConfig(jsonPath));
        }
        const ignorePath = join(dir, ".skilldoctorignore");
        if (existsSync(ignorePath)) {
            config.ignore = [...parseIgnoreFile(ignorePath), ...config.ignore];
        }
        if (existsSync(jsonPath) || existsSync(ignorePath))
            break;
        const parent = dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    return config;
}
function parseJsonConfig(file) {
    try {
        const raw = JSON.parse(readFileSync(file, "utf8"));
        const result = {};
        if (Array.isArray(raw.ignore)) {
            result.ignore = raw.ignore.filter((item) => typeof item === "string");
        }
        if (raw.failOn === "error" || raw.failOn === "warning" || raw.failOn === "never") {
            result.failOn = raw.failOn;
        }
        if (raw.format === "human" || raw.format === "json" || raw.format === "sarif") {
            result.format = raw.format;
        }
        return result;
    }
    catch {
        return {};
    }
}
function parseIgnoreFile(file) {
    return readFileSync(file, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));
}
export function mergeIgnore(fileIgnore, cliIgnore) {
    return [...new Set([...fileIgnore, ...cliIgnore])];
}
//# sourceMappingURL=config.js.map