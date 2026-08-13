const enabled = process.env.NO_COLOR !== "1" &&
    process.env.FORCE_COLOR !== "0" &&
    Boolean(process.stdout.isTTY);
function wrap(code, text) {
    if (!enabled)
        return text;
    return `\u001B[${code}m${text}\u001B[0m`;
}
export const color = {
    red: (text) => wrap(31, text),
    green: (text) => wrap(32, text),
    yellow: (text) => wrap(33, text),
    cyan: (text) => wrap(36, text),
    dim: (text) => wrap(2, text),
    bold: (text) => wrap(1, text),
};
//# sourceMappingURL=color.js.map