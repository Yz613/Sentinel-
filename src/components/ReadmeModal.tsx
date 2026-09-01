import React from 'react';
import { X, Shield, Cpu, Activity, Wrench, Layers, Database, Sparkles, AlertCircle } from 'lucide-react';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel border border-white/[0.08] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl text-neutral-200 relative bg-[#0D0D0F]">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#F27D26]/10 border border-[#F27D26]/30 rounded-xl text-[#F27D26]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono tracking-wide text-white uppercase">
                SENTINEL — Autonomous Fleet Readiness
              </h2>
              <p className="text-xs text-[#F27D26] font-mono">OPERATIONS, SUSTAINMENT & READINESS INTELLIGENCE</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 rounded-md hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 text-xs text-neutral-300 leading-relaxed font-sans">
          {/* Problem Section */}
          <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
            <h3 className="text-xs font-bold font-mono text-[#F27D26] uppercase tracking-wider mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#F27D26]" />
              The Problem
            </h3>
            <p>
              Operating complex autonomous hardware fleets in high-tempo defense environments requires 
              unifying maintenance work orders, hardware generations, firmware release matrixes, field diagnostics, 
              supply-chain logistics, spare parts inventory, and fault telemetry into a single cohesive operational picture. 
              When telemetry is siloed, command teams cannot readily answer the critical question:
            </p>
            <blockquote className="mt-3 pl-3 border-l-2 border-[#F27D26] text-white font-medium italic">
              “How much of the fleet is available right now, what is reducing readiness, and what should operations fix first?”
            </blockquote>
          </div>

          {/* Solution Section */}
          <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
            <h3 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              The SENTINEL Solution
            </h3>
            <p>
              SENTINEL establishes a single, real-time command dashboard connecting all 50 autonomous ground assets (MRD-001 through MRD-050). 
              It continuously synthesizes operational readiness, root-cause readiness drivers, technician work orders, equipment fault lifecycles, 
              hardware/software configuration correlations, and spare parts supply chain constraints.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="p-3 bg-[#141417] rounded-lg border border-[#1F1F23]">
                <div className="font-semibold text-white text-xs flex items-center gap-1.5 mb-1 font-mono">
                  <Activity className="w-3.5 h-3.5 text-[#F27D26]" /> Real-time Fleet Command
                </div>
                <div className="text-xs text-neutral-400">82% Fleet readiness KPI, availability spectrums, and top driver drill-downs.</div>
              </div>
              <div className="p-3 bg-[#141417] rounded-lg border border-[#1F1F23]">
                <div className="font-semibold text-white text-xs flex items-center gap-1.5 mb-1 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Gemini Readiness Intelligence
                </div>
                <div className="text-xs text-neutral-400">Automated 0600Z morning briefs and conversational telemetry root-cause diagnosis.</div>
              </div>
              <div className="p-3 bg-[#141417] rounded-lg border border-[#1F1F23]">
                <div className="font-semibold text-white text-xs flex items-center gap-1.5 mb-1 font-mono">
                  <Layers className="w-3.5 h-3.5 text-purple-400" /> Configuration Correlations
                </div>
                <div className="text-xs text-neutral-400">Identifies failure trends across Gen 2/2.5/3 hardware and software builds 4.6.1 through 4.9 Beta.</div>
              </div>
              <div className="p-3 bg-[#141417] rounded-lg border border-[#1F1F23]">
                <div className="font-semibold text-white text-xs flex items-center gap-1.5 mb-1 font-mono">
                  <Wrench className="w-3.5 h-3.5 text-emerald-400" /> Supply Chain Bottleneck Isolation
                </div>
                <div className="text-xs text-neutral-400">Highlights zero-stock parts (e.g. COMM-MOD-V3) currently blocking vehicle readiness return.</div>
              </div>
            </div>
          </div>

          {/* Skills Demonstrated */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2.5">
              Core Skills Demonstrated
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { name: 'Fleet Operations', icon: Activity },
                { name: 'Sustainment & Logistics', icon: Database },
                { name: 'Fleet Management', icon: Shield },
                { name: 'Maintenance Planning', icon: Wrench },
                { name: 'Configuration Management', icon: Layers },
                { name: 'Operational Data Analytics', icon: Cpu },
              ].map(item => (
                <div key={item.name} className="flex items-center gap-2 p-2.5 bg-[#141417] rounded-lg border border-[#1F1F23] text-xs text-neutral-200">
                  <item.icon className="w-4 h-4 text-[#F27D26] shrink-0" />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mandatory Disclosure */}
          <div className="p-4 bg-amber-500/[0.05] border border-amber-500/30 rounded-xl text-xs text-amber-200/90 leading-relaxed font-mono">
            <div className="font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 text-amber-400">
              <Shield className="w-4 h-4" />
              Compliance & Synthetic Data Disclosure
            </div>
            This project uses completely fictional assets, systems, personnel, telemetry, and operational data. 
            It contains no classified, proprietary, or defense-restricted technical data, and does not implement weapons control, targeting, kinetic firing, or offensive guidance capabilities. 
            It was developed using AI-assisted coding in Google AI Studio to demonstrate operational sustainment architectures.
          </div>
        </div>

        <div className="flex justify-end pt-5 mt-6 border-t border-white/5 font-mono">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-md transition-colors border border-white/10"
          >
            Close Operational Brief
          </button>
        </div>
      </div>
    </div>
  );
};
