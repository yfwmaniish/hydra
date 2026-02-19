import React, { useState, useEffect, useCallback } from 'react';
import Card from './Card';
import { Bot, RefreshCw, Zap } from 'lucide-react';
import { api } from '../../services/api';

/**
 * Threat shape returned by the backend API.
 * Keeping it light — only the fields we actually use.
 */
interface ThreatSummary {
    id: string;
    title: string;
    source: string;
    target: string;
    type: string;
    severity: string;
    credibility: number;
    details?: string;
    timestamp: string;
}

/** Map a severity string to a human-friendly risk label. */
function riskLabel(severity: string): string {
    switch (severity) {
        case 'Critical': return 'CRITICAL RISK';
        case 'High': return 'HIGH RISK';
        case 'Medium': return 'MODERATE RISK';
        default: return 'LOW RISK';
    }
}

/** Build a contextual, real analysis blurb from a live threat. */
function buildAnalysis(t: ThreatSummary): string {
    const parts: string[] = [];

    // Opening line with threat classification
    parts.push(
        `Analysis complete. ${riskLabel(t.severity)} threat detected — "${t.title}" classified as ${t.type}.`
    );

    // Source + target context
    parts.push(
        `Origin: ${t.source}. Targeted sector: ${t.target}.`
    );

    // Matched keywords from NLP
    if (t.details) {
        parts.push(t.details + '.');
    }

    // Credibility / confidence
    parts.push(
        `NLP confidence score: ${t.credibility}%. ${t.credibility >= 70
            ? 'Recommend immediate investigation and escalation.'
            : t.credibility >= 40
                ? 'Recommend monitoring and further correlation.'
                : 'Low-confidence match — verify source reliability.'}`
    );

    return parts.join(' ');
}

/** Severity → badge colour map */
const SEVERITY_STYLE: Record<string, { bg: string; text: string; border: string }> = {
    Critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    High: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    Medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    Low: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
};

interface AIInsightCardProps {
    className?: string;
    selectedThreat?: ThreatSummary | null;
}

const AIInsightCard: React.FC<AIInsightCardProps> = ({ className, selectedThreat }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [displayText, setDisplayText] = useState('');
    const [threat, setThreat] = useState<ThreatSummary | null>(null);
    const [error, setError] = useState(false);

    /** Fetch the most critical / recent threat and generate analysis. */
    const runAnalysis = useCallback(async () => {
        setIsAnalyzing(true);
        setDisplayText('');
        setError(false);

        let targetThreat = selectedThreat;

        try {
            // If no threat selected, find the most critical one automatically
            if (!targetThreat) {
                const threats: ThreatSummary[] = await api.threats.list();
                if (!threats.length) {
                    setDisplayText('No threats detected yet. The crawler is actively monitoring configured sources.');
                    setIsAnalyzing(false);
                    return;
                }

                // Pick the most critical recent threat
                const severityOrder = ['Critical', 'High', 'Medium', 'Low'];
                const sorted = [...threats].sort((a, b) => {
                    const diff = severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
                    if (diff !== 0) return diff;
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                });

                targetThreat = sorted[0];
            }

            setThreat(targetThreat);

            // CALL REAL AI BACKEND
            let analysisText = "";
            try {
                const response = await api.threats.analyze(targetThreat.id);
                analysisText = response.analysis;
            } catch (aiError) {
                console.warn("AI Backend unavailable, using local fallback template.", aiError);
                analysisText = buildAnalysis(targetThreat);
            }

            // Typewriter effect with the real analysis text
            let i = 0;
            const interval = setInterval(() => {
                setDisplayText(analysisText.slice(0, i));
                i++;
                if (i > analysisText.length) {
                    clearInterval(interval);
                    setIsAnalyzing(false);
                }
            }, 20);

            return () => clearInterval(interval);
        } catch (err) {
            console.error('[AIInsightCard] Analysis failed:', err);
            setDisplayText('Unable to reach the Trinetra backend. Check API connectivity.');
            setError(true);
            setIsAnalyzing(false);
        }
    }, [selectedThreat]);

    // Run analysis on mount or when selectedThreat changes
    useEffect(() => {
        runAnalysis();
    }, [runAnalysis]);

    const style = threat
        ? SEVERITY_STYLE[threat.severity] ?? SEVERITY_STYLE.Low
        : SEVERITY_STYLE.Low;

    return (
        <Card className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Bot size={64} />
            </div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-2 text-primary font-bold">
                    <Bot size={20} />
                    <h3>Sentinel AI Analysis</h3>
                </div>
                <button
                    onClick={runAnalysis}
                    className={`p-2 rounded-lg hover:bg-white/5 transition-colors text-muted hover:text-primary ${isAnalyzing ? 'animate-spin' : ''}`}
                    disabled={isAnalyzing}
                    title="Re-analyze"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            <div className="relative z-10 min-h-[80px]">
                <p className="text-sm text-text leading-relaxed font-mono">
                    {displayText}
                    {isAnalyzing && <span className="animate-pulse">_</span>}
                </p>
            </div>

            {threat && !error && (
                <div className="mt-4 flex gap-2">
                    <div className={`px-2 py-1 rounded ${style.bg} ${style.text} text-xs border ${style.border} flex items-center gap-1`}>
                        <Zap size={10} /> {threat.severity}
                    </div>
                    <div className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs border border-blue-500/30">
                        Confidence: {threat.credibility}%
                    </div>
                </div>
            )}
        </Card>
    );
};

export default AIInsightCard;
