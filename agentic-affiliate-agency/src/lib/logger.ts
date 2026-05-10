type LogLevel = "debug" | "info" | "warn" | "error";

const COLORS = {
  debug: "\x1b[36m",
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

function timestamp(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, agent: string, message: string, data?: unknown): void {
  const color = COLORS[level];
  const prefix = `${COLORS.dim}[${timestamp()}]${COLORS.reset} ${color}${COLORS.bold}[${level.toUpperCase()}]${COLORS.reset} ${COLORS.bold}[${agent}]${COLORS.reset}`;
  console.log(`${prefix} ${message}`);
  if (data !== undefined) {
    console.log(`${COLORS.dim}${JSON.stringify(data, null, 2)}${COLORS.reset}`);
  }
}

export function createLogger(agentName: string) {
  return {
    debug: (msg: string, data?: unknown) => log("debug", agentName, msg, data),
    info: (msg: string, data?: unknown) => log("info", agentName, msg, data),
    warn: (msg: string, data?: unknown) => log("warn", agentName, msg, data),
    error: (msg: string, data?: unknown) => log("error", agentName, msg, data),
  };
}
