const enabled =
  process.env.NO_COLOR !== "1" &&
  process.env.FORCE_COLOR !== "0" &&
  Boolean(process.stdout.isTTY);

function wrap(code: number, text: string): string {
  if (!enabled) return text;
  return `\u001B[${code}m${text}\u001B[0m`;
}

export const color = {
  red: (text: string) => wrap(31, text),
  green: (text: string) => wrap(32, text),
  yellow: (text: string) => wrap(33, text),
  cyan: (text: string) => wrap(36, text),
  dim: (text: string) => wrap(2, text),
  bold: (text: string) => wrap(1, text),
};
