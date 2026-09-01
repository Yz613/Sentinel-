import React, { useState, useEffect } from 'react';
import { useFleet } from '../../context/FleetContext';
import { 
  Database, 
  Radio, 
  Upload, 
  Download, 
  Terminal, 
  Copy, 
  Check, 
  Play, 
  Plus, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Clock,
  Layers,
  Zap,
  ArrowRight
} from 'lucide-react';
import { PollingConnectorConfig, IngestionActivityLog } from '../../types';

export const DataSourcesView: React.FC = () => {
  const { 
    mode, 
    setMode, 
    assets, 
    summary,
    ingestPayload, 
    importCsvData, 
    refreshFleet, 
    clearLiveData, 
    loadSampleLiveData,
    setActiveNavTab 
  } = useFleet();

  const [activeSubTab, setActiveSubTab] = useState<'webhooks' | 'csv' | 'connectors' | 'activity'>('webhooks');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // --- Interactive Sandbox State ---
  const [testAction, setTestAction] = useState<'telemetry' | 'new_asset' | 'fault' | 'custom'>('telemetry');
  const [customJson, setCustomJson] = useState<string>(`{
  "assetId": "ROV-888",
  "name": "Titan Vanguard Sentry",
  "batteryHealth": 98,
  "powertrainHealth": 95,
  "avionicsHealth": 99,
  "operatingHours": 120,
  "communicationsStatus": "Nominal",
  "status": "MISSION READY",
  "location": "Bravo Proving Grounds"
}`);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  // --- CSV Import State ---
  const [csvType, setCsvType] = useState<'assets' | 'telemetry' | 'faults' | 'workOrders' | 'spareParts'>('assets');
  const [csvContent, setCsvContent] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [parsedPreviewRows, setParsedPreviewRows] = useState<Record<string, string>[]>([]);

  // --- External Connectors State ---
  const [connectors, setConnectors] = useState<PollingConnectorConfig[]>([]);
  const [newConnName, setNewConnName] = useState('');
  const [newConnUrl, setNewConnUrl] = useState('');
  const [newConnInterval, setNewConnInterval] = useState('30');
  const [newConnAuth, setNewConnAuth] = useState('');
  const [isAddingConnector, setIsAddingConnector] = useState(false);

  // --- Activity Stream State ---
  const [activityLogs, setActivityLogs] = useState<IngestionActivityLog[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Fetch activity logs
  const fetchActivity = async () => {
    try {
      setIsLoadingActivity(true);
      const res = await fetch('/api/v1/activity');
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data.activity || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  // Fetch connectors
  const fetchConnectors = async () => {
    try {
      const res = await fetch('/api/v1/connectors');
      if (res.ok) {
        const data = await res.json();
        setConnectors(data.connectors || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchActivity();
    fetchConnectors();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Handle Interactive Test Console submission
  const handleSendTest = async () => {
    setIsSendingTest(true);
    setTestResult(null);

    try {
      let payload: any;
      if (testAction === 'telemetry') {
        const targetAssetId = assets[0]?.id || 'ROV-101';
        payload = {
          telemetry: [
            {
              assetId: targetAssetId,
              batteryHealth: Math.floor(88 + Math.random() * 10),
              operatingHours: (assets[0]?.operatingHours || 140) + 1,
              communicationsStatus: 'Nominal',
              status: 'MISSION READY',
              message: `Live telemetry ping received at ${new Date().toLocaleTimeString()}. Subsystems nominal.`,
            },
          ],
        };
      } else if (testAction === 'new_asset') {
        const randId = `AST-${Math.floor(100 + Math.random() * 900)}`;
        payload = {
          assets: [
            {
              id: randId,
              name: `Autonomous Recon ${randId}`,
              location: 'Forward Operating Base Alpha',
              assignedTeam: 'Team Orion',
              hardwareVersion: 'Gen 3',
              softwareVersion: '4.8.2',
              operatingHours: 85,
              batteryHealth: 97,
              powertrainHealth: 94,
              avionicsHealth: 99,
              communicationsStatus: 'Nominal',
              status: 'MISSION READY',
            },
          ],
        };
      } else if (testAction === 'fault') {
        const targetAssetId = assets[0]?.id || 'ROV-101';
        payload = {
          faults: [
            {
              assetId: targetAssetId,
              severity: 'Moderate',
              system: 'Drive & Powertrain',
              description: 'Left drive wheel encoder pulse jitter detected during high-speed traverse',
              operationalImpact: 'Traverse speed limited for diagnostic calibration',
              status: 'Active',
              owner: 'Automated Diagnostic Ingestion',
            },
          ],
        };
      } else {
        payload = JSON.parse(customJson);
      }

      const res = await ingestPayload(payload, 'Interactive Test Console');
      setTestResult(res);
      await fetchActivity();
    } catch (err: any) {
      setTestResult({ success: false, message: `Error: ${err.message}` });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      previewCsvRows(text);
    };
    reader.readAsText(file);
  };

  const previewCsvRows = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length <= 1) {
      setParsedPreviewRows([]);
      return;
    }
    const headers = lines[0].split(',').map(h => h.trim());
    const preview = lines.slice(1, 6).map(line => {
      const vals = line.split(',');
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = vals[i] ? vals[i].trim() : '';
      });
      return row;
    });
    setParsedPreviewRows(preview);
  };

  const handleImportCsv = async () => {
    if (!csvContent.trim()) return;
    setIsImporting(true);
    setImportStatus(null);

    const result = await importCsvData(csvType, csvContent);
    setImportStatus(result);
    setIsImporting(false);
    await fetchActivity();
  };

  // Handle adding connector
  const handleAddConnector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConnName || !newConnUrl) return;

    try {
      const headers: Record<string, string> = {};
      if (newConnAuth.trim()) {
        headers['Authorization'] = newConnAuth.trim();
      }

      const res = await fetch('/api/v1/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newConnName,
          url: newConnUrl,
          intervalSeconds: Number(newConnInterval) || 30,
          headers,
          enabled: true,
        }),
      });

      if (res.ok) {
        setNewConnName('');
        setNewConnUrl('');
        setNewConnAuth('');
        setIsAddingConnector(false);
        await fetchConnectors();
        await fetchActivity();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConnector = async (id: string) => {
    try {
      await fetch(`/api/v1/connectors/${id}`, { method: 'DELETE' });
      await fetchConnectors();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerConnector = async (id: string) => {
    try {
      await fetch(`/api/v1/connectors/${id}/trigger`, { method: 'POST' });
      await fetchConnectors();
      await refreshFleet();
      await fetchActivity();
    } catch (err) {
      console.error(err);
    }
  };

  // Example cURLs
  const curlBatchExample = `curl -X POST http://localhost:3000/api/v1/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "telemetry": [
      {
        "assetId": "ROV-101",
        "batteryHealth": 94,
        "operatingHours": 150,
        "communicationsStatus": "Nominal",
        "status": "MISSION READY",
        "message": "Routine sweep waypoint completed."
      }
    ]
  }'`;

  const curlTelemetryPing = `curl -X POST http://localhost:3000/api/v1/telemetry \\
  -H "Content-Type: application/json" \\
  -d '{
    "assetId": "ROV-102",
    "batteryHealth": 89,
    "operatingHours": 215,
    "communicationsStatus": "Nominal",
    "status": "MISSION READY"
  }'`;

  const pythonSnippet = `import requests

url = "http://localhost:3000/api/v1/telemetry"
payload = {
    "assetId": "ROV-101",
    "batteryHealth": 92,
    "powertrainHealth": 94,
    "operatingHours": 160,
    "communicationsStatus": "Nominal",
    "status": "MISSION READY"
}

response = requests.post(url, json=payload)
print(response.json())`;

  return (
    <div className="space-y-6">
      {/* Top Banner: Real Data Command Hub Header */}
      <div className="bg-[#0D0D0F] border border-[#1F1F23] rounded-xl p-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <h1 className="text-lg font-bold font-mono text-white tracking-wide uppercase">
                Data Sources & Ingestion Hub
              </h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                mode === 'live' 
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                  : 'bg-[#F27D26]/15 text-[#F27D26] border-[#F27D26]/30'
              }`}>
                {mode === 'live' ? 'Live Mode Active' : 'Demo Sandbox Active'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              SENTINEL features a zero-friction ingestion layer with smart schema normalization. 
              Plug in real telemetry via REST webhooks, drop CSV inventory spreadsheets, or connect scheduled external APIs.
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#141417] border border-[#1F1F23] rounded-lg px-3.5 py-2 text-xs font-mono">
              <div className="text-[10px] text-neutral-500 uppercase">Live Fleet Assets</div>
              <div className="text-base font-bold text-emerald-400">{assets.length} Active</div>
            </div>

            <div className="bg-[#141417] border border-[#1F1F23] rounded-lg px-3.5 py-2 text-xs font-mono">
              <div className="text-[10px] text-neutral-500 uppercase">Readiness</div>
              <div className="text-base font-bold text-[#F27D26]">{summary.fleetReadiness}%</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={async () => {
                  setMode('live');
                  await loadSampleLiveData();
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors"
                title="Populate 5 real-world style sample vehicles"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Load Sample Pack</span>
              </button>

              <button
                onClick={async () => {
                  if (window.confirm('Clear all live data? This cannot be undone.')) {
                    await clearLiveData();
                  }
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono font-medium text-neutral-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 rounded-lg transition-colors"
                title="Clear all live records"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Live</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/5 overflow-x-auto scrollbar-none font-mono text-xs">
          <button
            onClick={() => setActiveSubTab('webhooks')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md border transition-all ${
              activeSubTab === 'webhooks'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-bold'
                : 'text-neutral-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>REST API & Webhooks</span>
          </button>

          <button
            onClick={() => setActiveSubTab('csv')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md border transition-all ${
              activeSubTab === 'csv'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-bold'
                : 'text-neutral-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>CSV / File Importer</span>
          </button>

          <button
            onClick={() => setActiveSubTab('connectors')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md border transition-all ${
              activeSubTab === 'connectors'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-bold'
                : 'text-neutral-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Scheduled Polling Connectors</span>
            {connectors.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                {connectors.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('activity')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md border transition-all ${
              activeSubTab === 'activity'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-bold'
                : 'text-neutral-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Activity Stream</span>
          </button>
        </div>
      </div>

      {/* --- SUBTAB 1: REST API & WEBHOOKS --- */}
      {activeSubTab === 'webhooks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: API Documentation & cURL snippets */}
          <div className="lg:col-span-7 space-y-5">
            {/* Endpoints Table Card */}
            <div className="bg-[#0D0D0F] border border-[#1F1F23] rounded-xl p-5 font-mono">
              <h2 className="text-xs uppercase text-neutral-400 font-bold tracking-wider mb-4 flex items-center justify-between">
                <span>Available Ingestion Endpoints</span>
                <span className="text-[10px] text-emerald-400 font-normal">HTTP / JSON</span>
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-[#141417] border border-[#1F1F23] rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">POST</span>
                      <span className="text-white font-mono">/api/v1/telemetry</span>
                    </div>
                    <span className="text-[11px] text-neutral-500">Real-time Telemetry Stream</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-sans mt-1.5">
                    High-frequency IoT pings. Updates battery health, hours, communications status, and odometry.
                  </p>
                </div>

                <div className="p-3 bg-[#141417] border border-[#1F1F23] rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">POST</span>
                      <span className="text-white font-mono">/api/v1/assets</span>
                    </div>
                    <span className="text-[11px] text-neutral-500">Asset Master Records</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-sans mt-1.5">
                    Register or update autonomous vehicles, hardware specs, teams, and locations.
                  </p>
                </div>

                <div className="p-3 bg-[#141417] border border-[#1F1F23] rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">POST</span>
                      <span className="text-white font-mono">/api/v1/ingest</span>
                    </div>
                    <span className="text-[11px] text-neutral-500">Universal Batch Ingestion</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-sans mt-1.5">
                    Accepts a multi-entity bundle containing assets, telemetry, faults, and work orders in a single payload.
                  </p>
                </div>
              </div>
            </div>

            {/* Code Snippets Card */}
            <div className="bg-[#0D0D0F] border border-[#1F1F23] rounded-xl p-5 font-mono">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase text-neutral-400 font-bold tracking-wider">
                  Quick Integration Snippets
                </span>
                <button
                  onClick={() => copyToClipboard(curlTelemetryPing, 'curl')}
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white px-2 py-1 bg-white/5 rounded border border-white/10"
                >
                  {copiedKey === 'curl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'curl' ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>

              <pre className="p-3.5 bg-[#09090B] border border-white/5 rounded-lg text-neutral-300 text-xs overflow-x-auto">
                <code>{curlTelemetryPing}</code>
              </pre>

              <div className="mt-4 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-neutral-400">Python Telemetry Sender</span>
                  <button
                    onClick={() => copyToClipboard(pythonSnippet, 'python')}
                    className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white px-2 py-0.5 bg-white/5 rounded border border-white/10"
                  >
                    {copiedKey === 'python' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'python' ? 'Copied' : 'Copy Python'}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-[#09090B] border border-white/5 rounded-lg text-neutral-300 text-xs overflow-x-auto">
                  <code>{pythonSnippet}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Sandbox Test Runner */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-[#0D0D0F] border border-emerald-500/30 rounded-xl p-5 font-mono relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-500/15 text-emerald-400 rounded">
                    <Play className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Interactive Ingest Sandbox
                  </h3>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Ready
                </span>
              </div>

              <p className="text-xs text-neutral-400 font-sans mb-4">
                Test real-time ingestion right in your browser. Choose a preset or write custom JSON to immediately see the dashboard update!
              </p>

              {/* Action Preset Select */}
              <div className="space-y-2 mb-4">
                <label className="text-[10px] uppercase text-neutral-400">Select Test Event</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setTestAction('telemetry')}
                    className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                      testAction === 'telemetry'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-bold'
                        : 'bg-[#141417] text-neutral-400 border-[#1F1F23] hover:text-white'
                    }`}
                  >
                    <div>Live Telemetry Ping</div>
                    <div className="text-[10px] text-neutral-500 font-normal">Update health & hours</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestAction('new_asset')}
                    className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                      testAction === 'new_asset'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-bold'
                        : 'bg-[#141417] text-neutral-400 border-[#1F1F23] hover:text-white'
                    }`}
                  >
                    <div>Register New Vehicle</div>
                    <div className="text-[10px] text-neutral-500 font-normal">Add asset to matrix</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestAction('fault')}
                    className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                      testAction === 'fault'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 font-bold'
                        : 'bg-[#141417] text-neutral-400 border-[#1F1F23] hover:text-white'
                    }`}
                  >
                    <div>Trigger Equipment Fault</div>
                    <div className="text-[10px] text-neutral-500 font-normal">Simulate DTC anomaly</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestAction('custom')}
                    className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                      testAction === 'custom'
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/50 font-bold'
                        : 'bg-[#141417] text-neutral-400 border-[#1F1F23] hover:text-white'
                    }`}
                  >
                    <div>Custom JSON Payload</div>
                    <div className="text-[10px] text-neutral-500 font-normal">Raw schema input</div>
                  </button>
                </div>
              </div>

              {testAction === 'custom' && (
                <div className="mb-4">
                  <label className="block text-[10px] uppercase text-neutral-400 mb-1">Payload JSON</label>
                  <textarea
                    value={customJson}
                    onChange={e => setCustomJson(e.target.value)}
                    rows={7}
                    className="w-full bg-[#09090B] border border-[#1F1F23] rounded-lg p-3 text-xs text-neutral-300 font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              )}

              <button
                onClick={handleSendTest}
                disabled={isSendingTest}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
              >
                {isSendingTest ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>Send Test Ingestion Request</span>
              </button>

              {/* Response Display */}
              {testResult && (
                <div className={`mt-4 p-3 rounded-lg border text-xs font-mono ${
                  testResult.success 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    <span>{testResult.success ? 'INGESTION SUCCEEDED' : 'INGESTION ERROR'}</span>
                  </div>
                  <div className="text-[11px] opacity-90">{testResult.message}</div>
                </div>
              )}
            </div>

            {/* Quick Link to Dashboard */}
            <div className="p-4 bg-[#141417] border border-[#1F1F23] rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-white">View Ingested Fleet in Dashboard</div>
                <div className="text-[11px] text-neutral-400">See live readiness scores & breakdown</div>
              </div>
              <button
                onClick={() => {
                  setMode('live');
                  setActiveNavTab('fleet-command');
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 transition-colors"
              >
                <span>Fleet Command</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB 2: CSV / FILE IMPORTER --- */}
      {activeSubTab === 'csv' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Dropzone & Templates */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-[#0D0D0F] border border-[#1F1F23] rounded-xl p-5 font-mono">
              <h2 className="text-xs uppercase text-neutral-400 font-bold tracking-wider mb-3">
                1. Select Entity Type & Download Starter Template
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {[
                  { key: 'assets', label: 'Fleet Assets' },
                  { key: 'telemetry', label: 'Telemetry Pings' },
                  { key: 'faults', label: 'Fault Telemetry' },
                  { key: 'workOrders', label: 'Work Orders' },
                  { key: 'spareParts', label: 'Spare Parts' },
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setCsvType(item.key as any);
                      setParsedPreviewRows([]);
                    }}
                    className={`px-3 py-2 rounded-lg border text-xs font-mono transition-colors text-left ${
                      csvType === item.key
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-bold'
                        : 'bg-[#141417] text-neutral-400 border-[#1F1F23] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#141417] border border-[#1F1F23] rounded-lg">
                <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="flex-1 text-xs">
                  <div className="text-neutral-200 font-bold">Download {csvType.toUpperCase()} Template</div>
                  <div className="text-[11px] text-neutral-400 font-sans">
                    Includes formatted headers and sample records ready to edit.
                  </div>
                </div>
                <a
                  href={`/api/v1/templates/${csvType}`}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .CSV</span>
                </a>
              </div>
            </div>

            {/* Dropzone Card */}
            <div className="bg-[#0D0D0F] border border-[#1F1F23] rounded-xl p-5 font-mono">
              <h2 className="text-xs uppercase text-neutral-400 font-bold tracking-wider mb-3">
                2. Upload or Paste CSV
              </h2>

              <div className="border-2 border-dashed border-[#1F1F23] hover:border-emerald-500/40 rounded-xl p-6 text-center transition-colors bg-[#09090B]">
                <Upload className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
                <div className="text-xs text-neutral-300 mb-1">
                  Drag and drop your <span className="text-emerald-400 font-bold">.csv</span> file here, or click to browse
                </div>
                <div className="text-[11px] text-neutral-500 mb-3">
                  Automatic column matching handles custom headers
                </div>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-file-input"
                />
                <label
                  htmlFor="csv-file-input"
                  className="inline-block px-4 py-1.5 bg-[#141417] hover:bg-[#1C1C20] text-neutral-300 hover:text-white rounded-md border border-[#1F1F23] text-xs cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>

              <div className="mt-4">
                <label className="block text-[10px] uppercase text-neutral-500 mb-1">
                  Or Paste Raw CSV Directly:
                </label>
                <textarea
                  value={csvContent}
                  onChange={e => {
                    setCsvContent(e.target.value);
                    previewCsvRows(e.target.value);
                  }}
                  rows={4}
                  placeholder="id,name,location,operatingHours,batteryHealth..."
                  className="w-full bg-[#141417] border border-[#1F1F23] rounded-lg p-3 text-xs text-neutral-300 font-mono focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {csvContent && (
                <button
                  onClick={handleImportCsv}
                  disabled={isImporting}
                  className="w-full mt-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
                >
                  {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>Execute CSV Import ({csvType})</span>
                </button>
              )}

              {importStatus && (
                <div className={`mt-3 p-3 rounded-lg border text-xs font-mono ${
                  importStatus.success 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  {importStatus.message}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Parsed Preview */}
          <div className="lg:col-span-5">
            <div className="bg-[#0D0D0F] border border-[#1F1F23] rounded-xl p-5 font-mono">
              <h3 className="text-xs uppercase text-neutral-400 font-bold tracking-wider mb-3 flex items-center justify-between">
                <span>CSV Parsed Preview</span>
                <span className="text-[10px] text-neutral-500">First 5 Rows</span>
              </h3>

              {parsedPreviewRows.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 border border-white/5 rounded-lg bg-[#09090B]">
                  No CSV loaded yet. Download a template or upload a file to preview parsed columns and values.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-neutral-400">
                        {Object.keys(parsedPreviewRows[0]).slice(0, 4).map(key => (
                          <th key={key} className="py-2 px-2.5 font-medium">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {parsedPreviewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          {Object.values(row).slice(0, 4).map((val, i) => (
                            <td key={i} className="py-2 px-2.5 text-neutral-300 max-w-[120px] truncate">
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB 3: SCHEDULED POLLING CONNECTORS --- */}
      {activeSubTab === 'connectors' && (
        <div className="space-y-6">
          <div className="bg-[#0D0D0F] border border-[#1F1F23] rounded-xl p-5 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xs uppercase text-neutral-400 font-bold tracking-wider">
                  Automated REST Polling Connectors
                </h2>
                <p className="text-xs text-neutral-400 font-sans mt-0.5">
                  Configure external telematics endpoints (Samsara, AWS IoT Fleet, ROS Bridge, or custom HTTP APIs). 
                  Sentinel polls them in the background and continuously normalizes incoming telemetry.
                </p>
              </div>

              <button
                onClick={() => setIsAddingConnector(!isAddingConnector)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-black font-bold rounded-lg text-xs transition-colors self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Connector</span>
              </button>
            </div>

            {/* Add Connector Form */}
            {isAddingConnector && (
              <form onSubmit={handleAddConnector} className="bg-[#141417] border border-emerald-500/30 rounded-xl p-4 mb-6 space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                  New Scheduled API Connector
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-400 mb-1">Connector Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Field Rover Telemetry Stream"
                      value={newConnName}
                      onChange={e => setNewConnName(e.target.value)}
                      className="w-full bg-[#09090B] border border-[#1F1F23] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-neutral-400 mb-1">Poll Frequency (Seconds)</label>
                    <select
                      value={newConnInterval}
                      onChange={e => setNewConnInterval(e.target.value)}
                      className="w-full bg-[#09090B] border border-[#1F1F23] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="10">Every 10 seconds</option>
                      <option value="30">Every 30 seconds</option>
                      <option value="60">Every 1 minute</option>
                      <option value="300">Every 5 minutes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-neutral-400 mb-1">Target Endpoint URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://api.my-telematics-fleet.com/v1/vehicles"
                    value={newConnUrl}
                    onChange={e => setNewConnUrl(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#1F1F23] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-neutral-400 mb-1">Authorization Header (Optional)</label>
                  <input
                    type="text"
                    placeholder="Bearer eyJhbGciOi..."
                    value={newConnAuth}
                    onChange={e => setNewConnAuth(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#1F1F23] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingConnector(false)}
                    className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white rounded bg-white/5 border border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded transition-colors"
                  >
                    Save & Start Polling
                  </button>
                </div>
              </form>
            )}

            {/* Active Connectors Table */}
            {connectors.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500 border border-white/5 rounded-xl bg-[#09090B]">
                No polling connectors configured yet. Add one above to pull live vehicle data on a schedule.
              </div>
            ) : (
              <div className="space-y-3">
                {connectors.map(conn => (
                  <div
                    key={conn.id}
                    className="p-4 bg-[#141417] border border-[#1F1F23] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{conn.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          conn.lastStatus === 'success' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : conn.lastStatus === 'error'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {conn.lastStatus === 'success' ? 'Active' : (conn.lastStatus === 'error' ? 'Error' : 'Idle')}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono truncate max-w-md">
                        {conn.url}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        Interval: Every {conn.intervalSeconds}s • Ingested: {conn.recordsIngestedTotal} records • Last poll: {conn.lastPolledAt ? new Date(conn.lastPolledAt).toLocaleTimeString() : 'Pending'}
                      </div>
                      {conn.lastError && (
                        <div className="text-[10px] text-rose-400">
                          Failure: {conn.lastError}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleTriggerConnector(conn.id)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white rounded border border-white/10 text-xs flex items-center gap-1 transition-colors"
                        title="Trigger immediate poll"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Poll Now</span>
                      </button>

                      <button
                        onClick={() => handleDeleteConnector(conn.id)}
                        className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                        title="Remove connector"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- SUBTAB 4: LIVE INGESTION ACTIVITY STREAM --- */}
      {activeSubTab === 'activity' && (
        <div className="bg-[#0D0D0F] border border-[#1F1F23] rounded-xl p-5 font-mono">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs uppercase text-neutral-400 font-bold tracking-wider">
                Ingestion Audit & Telemetry Activity Stream
              </h2>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Real-time log of incoming telemetry pings, CSV batches, and external connector polls.
              </p>
            </div>
            <button
              onClick={fetchActivity}
              disabled={isLoadingActivity}
              className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white rounded border border-white/10 text-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingActivity ? 'animate-spin' : ''}`} />
              <span>Refresh Log</span>
            </button>
          </div>

          {activityLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 border border-white/5 rounded-xl bg-[#09090B]">
              No ingestion events recorded in this session. Send a test ping or upload CSV to see events.
            </div>
          ) : (
            <div className="space-y-2">
              {activityLogs.map(log => (
                <div
                  key={log.id}
                  className="p-3 bg-[#141417] border border-[#1F1F23] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      log.status === 'success' ? 'bg-emerald-400' : (log.status === 'warning' ? 'bg-[#F27D26]' : 'bg-rose-400')
                    }`}></span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{log.action}</span>
                        <span className="text-[10px] text-neutral-400 bg-white/5 px-1.5 py-0.2 rounded border border-white/10">
                          {log.source}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 font-sans mt-0.5">{log.details}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 text-[10px] text-neutral-500">
                    <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                    <div>{new Date(log.timestamp).toISOString().split('T')[0]}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
