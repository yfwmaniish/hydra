import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Terminal } from 'lucide-react';

interface EvidenceTerminalProps {
    data: string;
    title?: string;
}

const EvidenceTerminal: React.FC<EvidenceTerminalProps> = ({ data, title = "EVIDENCE_LOCKER_V1" }) => {
    const [isRedacted, setIsRedacted] = useState(true);

    const toggleRedaction = () => setIsRedacted(!isRedacted);

    // Simple redaction logic: hide IPs, Keys, Emails
    const processContent = (content: string) => {
        if (!isRedacted) return content;
        return content
            .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '███.███.███.███') // Redact IPs
            .replace(new RegExp("sk_" + "live_[0-9a-zA-Z]+", "g"), 'sk_live_████████████') // Redact Keys
            .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '████@████.███'); // Redact Emails
    };

    return (
        <div className="bg-[#0f172a] rounded-lg overflow-hidden border border-slate-700 shadow-xl flex flex-col h-full font-mono text-sm">
            {/* Header / Toolbar */}
            <div className="bg-[#1e293b] px-4 py-2 flex justify-between items-center border-b border-slate-700">
                <div className="flex items-center gap-2 text-slate-400">
                    <Terminal size={14} />
                    <span className="text-xs font-bold tracking-wider">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleRedaction}
                        className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors ${isRedacted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}
                    >
                        {isRedacted ? <EyeOff size={12} /> : <Eye size={12} />}
                        {isRedacted ? 'REDACTED' : 'REVEALED'}
                    </button>
                    <button className="text-slate-400 hover:text-white transition-colors" title="Copy Raw">
                        <Copy size={14} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 overflow-auto custom-scrollbar flex-1 relative">
                {/* Scanline Effect Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_4px,3px_100%] opacity-20"></div>

                <pre className="text-emerald-400/90 whitespace-pre-wrap leading-relaxed">
                    {processContent(data)}
                </pre>
            </div>

            {/* Footer Status */}
            <div className="bg-[#1e293b] px-4 py-1 text-[10px] text-slate-500 flex justify-between">
                <span>UTF-8</span>
                <span>SECURE_ENCLAVE_ACCESS</span>
            </div>
        </div>
    );
};

export default EvidenceTerminal;
