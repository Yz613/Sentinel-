export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  requestId?: string;
  data?: any;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

export interface LogMeta {
  context?: string;
  requestId?: string;
  data?: any;
  error?: Error | any;
}

class Logger {
  private formatLog(level: LogLevel, message: string, meta?: LogMeta): string {
    const payload: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: meta?.context || "SentinelApp",
      requestId: meta?.requestId,
      data: meta?.data,
    };

    if (meta?.error) {
      payload.error = {
        name: meta.error.name || "Error",
        message: meta.error.message || String(meta.error),
        stack: process.env.NODE_ENV !== "production" ? meta.error.stack : undefined,
      };
    }

    return JSON.stringify(payload);
  }

  public debug(message: string, meta?: LogMeta): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.formatLog("debug", message, meta));
    }
  }

  public info(message: string, meta?: LogMeta): void {
    console.log(this.formatLog("info", message, meta));
  }

  public warn(message: string, meta?: LogMeta): void {
    console.warn(this.formatLog("warn", message, meta));
  }

  public error(message: string, meta?: LogMeta): void {
    console.error(this.formatLog("error", message, meta));
  }
}

export const logger = new Logger();
