import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { 
  Sparkles, 
  Send, 
  RefreshCw, 
  Copy, 
  Check, 
  Terminal, 
  HelpCircle,
  FileText,
  Clock
} from 'lucide-react';
import Markdown from 'react-markdown';

export const ReadinessIntelligenceView: React.FC = () => {
  const { assets, workOrders, faults, spareParts, summary, mode } = useFleet();

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseMarkdown, setResponseMarkdown] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [briefType, setBriefType] = useState<'morning_brief' | 'custom_query'>('morning_brief');
  const [lastGeneratedTime, setLastGeneratedTime] = useState<string | null>(null);

  // Preset operational questions requested in prompt
  const presetQuestions = [
    { title: 'Why did readiness fall?', query: 'Why did fleet readiness fall below target, and what are the main drivers?' },
    { title: 'Which assets should operations prioritize?', query: 'Which specific autonomous assets should maintenance operations prioritize first today?' },
    { title: 'What are the biggest recurring failure patterns?', query: 'What are the biggest recurring failure patterns across all 50 assets?' },
    { title: 'What spare parts are constraining readiness?', query: 'What spare parts are currently constraining fleet readiness and what is the remediation path?' },
    { title: 'Which software release has the most faults?', query: 'Which software version has the highest fault frequency and how is it impacting readiness?' },
    { title: 'Which assets could become unavailable soon?', query: 'Which assets are approaching critical inspection thresholds or showing telemetry drift that could make them unavailable soon?' },
  ];

  const handleQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    setIsLoading(true);
    setBriefType('custom_query');
    setResponseMarkdown(null);

    try {
      const res = await fetch('/api/intelligence/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: queryText,
          query: queryText,
          mode,
          fleetContext: {
            summary,
            sampleAssets: assets.slice(0, 15),
            activeFaults: faults.filter(f => f.status !== 'Cleared'),
            openWorkOrders: workOrders.filter(w => w.status !== 'Completed'),
            limitingSpareParts: spareParts.filter(p => p.isLimitingReadiness || p.onHand <= 0),
          },
        }),
      });

      const data = await res.json();
      setResponseMarkdown(data.markdown || data.answer || 'Operational analysis generation failed.');
      setLastGeneratedTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
      setResponseMarkdown('Error connecting to SENTINEL Readiness Intelligence engine.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMorningBrief = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setBriefType('morning_brief');
    setResponseMarkdown(null);

    try {
      const res = await fetch('/api/intelligence/morning-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          fleetContext: {
            summary,
            sampleAssets: assets.slice(0, 20),
            activeFaults: faults.filter(f => f.status !== 'Cleared'),
            openWorkOrders: workOrders.filter(w => w.status !== 'Completed'),
            limitingSpareParts: spareParts.filter(p => p.isLimitingReadiness || p.onHand <= 0),
          },
        }),
      });

      const data = await res.json();
      setResponseMarkdown(data.briefMarkdown || data.brief || 'Operational Morning Brief generation failed.');
      setLastGeneratedTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
      setResponseMarkdown('Error generating morning readiness brief.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!responseMarkdown) return;
    navigator.clipboard.writeText(responseMarkdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#EF4444] text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-[#EF4444]" />
            <span>AI-POWERED READINESS INTELLIGENCE</span>
          </div>
          <h1 className="text-xs uppercase tracking-widest font-semibold font-mono text-white">
            SENTINEL READINESS INTELLIGENCE OFFICER
          </h1>
          <p className="text-xs text-neutral-400 mt-1 font-sans">
            Operational analytics, root-cause synthesis, and prioritized remediation planning powered by Gemini.
          </p>
        </div>

        <button
          onClick={handleMorningBrief}
          disabled={isLoading}
          className="px-4 py-2.5 bg-[#EF4444] hover:bg-orange-500 text-black font-mono font-bold text-xs rounded-md transition-all shadow-md shadow-[#EF4444]/20 flex items-center gap-2 w-fit"
        >
          <FileText className="w-4 h-4" />
          <span>GENERATE 0600Z MORNING BRIEF</span>
        </button>
      </div>

      {/* Quick Operational Inquiry Questions */}
      <div className="glass-panel rounded-xl p-5 shadow-sm space-y-3 border border-white/[0.08]">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 text-[#EF4444]" />
          <span>ONE-CLICK OPERATIONAL QUERIES</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {presetQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputQuery(q.query);
                handleQuery(q.query);
              }}
              className="p-3 bg-white/[0.02] hover:bg-[#EF4444]/[0.05] border border-white/5 hover:border-[#EF4444]/30 rounded-lg text-left transition-colors font-mono text-xs text-neutral-300 hover:text-[#EF4444] flex items-start gap-2.5 group"
            >
              <Terminal className="w-4 h-4 text-neutral-500 group-hover:text-[#EF4444] mt-0.5 shrink-0" />
              <span>{q.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Freeform Query Bar */}
      <div className="glass-panel rounded-xl p-4 shadow-sm border border-white/[0.08]">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleQuery(inputQuery);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            placeholder="Ask SENTINEL (e.g. Which team has the highest readiness drag? Should we delay the Bravo field exercise?)..."
            className="flex-1 bg-[#141417] border border-[#1F1F23] rounded-md px-4 py-2.5 text-xs text-[#E0E0E0] placeholder-neutral-500 focus:outline-none focus:border-[#EF4444]/50 font-sans"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className={`px-5 py-2.5 rounded-md text-xs font-mono font-bold transition-colors flex items-center gap-2 ${
              inputQuery.trim() && !isLoading
                ? 'bg-[#EF4444] hover:bg-orange-500 text-black shadow-md shadow-[#EF4444]/20'
                : 'bg-white/5 text-neutral-600 cursor-not-allowed border border-white/5'
            }`}
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Query</span>
          </button>
        </form>
      </div>

      {/* Intelligence Output Display */}
      {isLoading && (
        <div className="glass-panel rounded-xl p-12 text-center space-y-4 animate-pulse border border-white/[0.08]">
          <div className="w-10 h-10 bg-[#EF4444]/10 text-[#EF4444] rounded-xl mx-auto flex items-center justify-center border border-[#EF4444]/30">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div className="font-mono text-sm font-bold text-white">
            SENTINEL INTELLIGENCE ENGINE SYNTHESIZING FLEET TELEMETRY...
          </div>
          <p className="text-xs text-neutral-400 max-w-md mx-auto font-mono">
            Evaluating 50 autonomous platforms, active work orders, LRU supply constraints, and software telemetry logs.
          </p>
        </div>
      )}

      {!isLoading && responseMarkdown && (
        <div className="glass-panel rounded-xl p-6 shadow-xl space-y-4 border border-white/[0.08]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg text-[#EF4444]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                  {briefType === 'morning_brief' ? '0600Z OPERATIONAL READINESS BRIEF' : 'INTELLIGENCE ADVISORY RESPONSE'}
                </h3>
                <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Generated: {lastGeneratedTime || 'Just now'}</span>
                  <span>• Grounded in 50 Deployed Assets</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-neutral-200 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 self-end sm:self-auto border border-white/10"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied Brief' : 'Copy Report'}</span>
            </button>
          </div>

          <div className="text-neutral-200 text-sm leading-relaxed space-y-3 font-sans max-w-none">
            <div className="markdown-body">
              <Markdown>{responseMarkdown}</Markdown>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !responseMarkdown && (
        <div className="glass-panel rounded-xl p-10 text-center space-y-3 border border-white/[0.08]">
          <Sparkles className="w-8 h-8 text-[#EF4444] mx-auto opacity-70" />
          <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-white">READINESS INTELLIGENCE READY</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto font-sans">
            Click &ldquo;Generate 0600Z Morning Brief&rdquo; or select a one-click operational query above to synthesize the current health of the 50-asset autonomous fleet.
          </p>
        </div>
      )}
    </div>
  );
};
