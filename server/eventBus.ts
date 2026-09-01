import { EventEmitter } from "events";

export type SentinelEventType = 
  | "fleet:snapshot"
  | "asset:upserted"
  | "telemetry:ping"
  | "fault:logged"
  | "work_order:updated"
  | "parts:updated"
  | "system:alert";

export interface SentinelEvent<T = any> {
  type: SentinelEventType;
  payload: T;
  timestamp: string;
  source: string;
}

class SentinelEventBus extends EventEmitter {
  constructor() {
    super();
    // Allow up to 100 concurrent SSE listeners without warning
    this.setMaxListeners(100);
  }

  public publish<T = any>(type: SentinelEventType, payload: T, source: string = "system"): void {
    const event: SentinelEvent<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      source,
    };
    this.emit("event", event);
    this.emit(type, event);
  }
}

export const eventBus = new SentinelEventBus();
