/**
 * External Polling Connector Runner for Sentinel.
 * Periodically pulls telematics and fleet data from remote REST endpoints.
 */

export interface PollingConnector {
  id: string;
  name: string;
  url: string;
  intervalSeconds: number;
  headers?: Record<string, string>;
  enabled: boolean;
  lastPolledAt?: string;
  lastStatus?: 'success' | 'error' | 'idle';
  lastError?: string;
  recordsIngestedTotal: number;
}

type IngestCallback = (payload: any, source: string) => Promise<any>;

class ConnectorManager {
  private connectors: Map<string, PollingConnector> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private ingestCallback: IngestCallback | null = null;

  public init(callback: IngestCallback) {
    this.ingestCallback = callback;
  }

  public list(): PollingConnector[] {
    return Array.from(this.connectors.values());
  }

  public get(id: string): PollingConnector | undefined {
    return this.connectors.get(id);
  }

  public add(config: Omit<PollingConnector, 'id' | 'recordsIngestedTotal'>): PollingConnector {
    const id = `conn-${Date.now().toString(36)}`;
    const connector: PollingConnector = {
      ...config,
      id,
      recordsIngestedTotal: 0,
      lastStatus: 'idle',
    };
    this.connectors.set(id, connector);
    if (connector.enabled) {
      this.startTimer(id);
    }
    return connector;
  }

  public update(id: string, updates: Partial<PollingConnector>): PollingConnector | null {
    const existing = this.connectors.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    this.connectors.set(id, updated);

    this.stopTimer(id);
    if (updated.enabled) {
      this.startTimer(id);
    }
    return updated;
  }

  public remove(id: string): boolean {
    this.stopTimer(id);
    return this.connectors.delete(id);
  }

  public async pollNow(id: string): Promise<{ success: boolean; message: string; count?: number }> {
    const connector = this.connectors.get(id);
    if (!connector) {
      return { success: false, message: 'Connector not found' };
    }

    try {
      connector.lastPolledAt = new Date().toISOString();
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'Sentinel-Fleet-Connector/1.0',
        ...(connector.headers || {}),
      };

      const res = await fetch(connector.url, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      let ingestedCount = 0;

      if (this.ingestCallback) {
        const result = await this.ingestCallback(data, `Connector: ${connector.name}`);
        ingestedCount = result?.totalIngested || (Array.isArray(data) ? data.length : 1);
      }

      connector.lastStatus = 'success';
      connector.lastError = undefined;
      connector.recordsIngestedTotal += ingestedCount;

      return {
        success: true,
        message: `Successfully polled ${connector.url}. Ingested ${ingestedCount} record(s).`,
        count: ingestedCount,
      };
    } catch (err: any) {
      connector.lastStatus = 'error';
      connector.lastError = err.message || 'Unknown network error';
      return {
        success: false,
        message: `Poll failed: ${connector.lastError}`,
      };
    }
  }

  private startTimer(id: string) {
    this.stopTimer(id);
    const connector = this.connectors.get(id);
    if (!connector || !connector.enabled) return;

    const intervalMs = Math.max(5000, connector.intervalSeconds * 1000);
    const timer = setInterval(() => {
      this.pollNow(id).catch(console.error);
    }, intervalMs);

    this.timers.set(id, timer);
  }

  private stopTimer(id: string) {
    const existing = this.timers.get(id);
    if (existing) {
      clearInterval(existing);
      this.timers.delete(id);
    }
  }
}

export const connectorManager = new ConnectorManager();
