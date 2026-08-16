import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
let cached;
export function packageVersion() {
    if (cached)
        return cached;
    const here = dirname(fileURLToPath(import.meta.url));
    const candidates = [join(here, "../package.json"), join(here, "../../package.json")];
    for (const file of candidates) {
        if (!existsSync(file))
            continue;
        try {
            const pkg = JSON.parse(readFileSync(file, "utf8"));
            if (typeof pkg.version === "string" && pkg.version) {
                cached = pkg.version;
                return cached;
            }
        }
        catch {
            // try next
        }
    }
    cached = "0.0.0";
    return cached;
}
//# sourceMappingURL=package.js.map