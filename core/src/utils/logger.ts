export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LoggerOptions {
  level?: LogLevel;
}

export interface LoggerTransport {
  log: (level: LogLevel, message: string, meta?: any) => void;
}

export class Logger {
  private levelOrder: LogLevel[] = ["DEBUG", "INFO", "WARN", "ERROR"];
  private level: LogLevel;
  private transports: LoggerTransport[] = [];

  constructor(options?: LoggerOptions) {
    this.level = options?.level || "DEBUG";

    this.transports.push({
      log: (level, message, meta) => {
        const color = this.getColor(level);
        const timestamp = new Date().toISOString();
        const metaStr = meta ? JSON.stringify(meta) : "";
        console.log(
          `${color}[${timestamp}] [${level}] ${message} ${metaStr}\x1b[0m`
        );
      },
    });
  }

  private getColor(level: LogLevel): string {
    switch (level) {
      case "DEBUG":
        return "\x1b[36m"; // Cyan
      case "INFO":
        return "\x1b[32m"; // Green
      case "WARN":
        return "\x1b[33m"; // Yellow
      case "ERROR":
        return "\x1b[31m"; // Red
      default:
        return "\x1b[0m"; // Default
    }
  }

  addTransport(transport: LoggerTransport) {
    this.transports.push(transport);
  }

  private shouldLog(level: LogLevel): boolean {
    return (
      this.levelOrder.indexOf(level) >= this.levelOrder.indexOf(this.level)
    );
  }

  log(level: LogLevel, message: string, meta?: any) {
    if (!this.shouldLog(level)) return;

    for (const transport of this.transports) {
      transport.log(level, message, meta);
    }
  }

  debug(message: string, meta?: any) {
    this.log("DEBUG", message, meta);
  }

  info(message: string, meta?: any) {
    this.log("INFO", message, meta);
  }

  warn(message: string, meta?: any) {
    this.log("WARN", message, meta);
  }

  error(message: string, meta?: any) {
    this.log("ERROR", message, meta);
  }
}

export const logger: Logger = new Logger();
