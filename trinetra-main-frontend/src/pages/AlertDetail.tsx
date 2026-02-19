import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import AnalogGauge from '../components/ui/AnalogGauge';
import Timeline from '../components/ui/Timeline';
import StatusChip from '../components/ui/StatusChip';
import SignalLights from '../components/ui/SignalLights';
import ImpactBadge from '../components/ui/ImpactBadge';
import EvidenceTerminal from '../components/ui/EvidenceTerminal';
import UrgencyTimer from '../components/ui/UrgencyTimer';
import type { Threat } from '../data/mockData';
import { api } from '../services/api';
import { ArrowLeft, Share2, ShieldAlert, CheckCircle, Activity, MapPin } from 'lucide-react';

const AlertDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [threat, setThreat] = useState<Threat | null>(null);
    const [escalated, setEscalated] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        const fetchThreat = async () => {
            try {
                const data = await api.threats.get(id);
                setThreat(data);
                setEscalated(data.status === 'Escalated');
            } catch (err) {
                console.error('[AlertDetail] Failed to fetch threat:', err);
                setError('Threat not found or API unavailable.');
            }
        };
        fetchThreat();
    }, [id]);

    if (error) return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-muted gap-4">
            <p className="text-red-400">{error}</p>
            <button onClick={() => navigate(-1)} className="px-4 py-2 bg-primary text-white rounded-lg">← Go Back</button>
        </div>
    );

    if (!threat) return <div className="flex items-center justify-center h-screen bg-background text-muted">Loading threat details...</div>;

    return (
        <>
            <div className="flex flex-col h-full gap-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button onClick={() => navigate(-1)} className="px-4">
                        <ArrowLeft size={20} />
                    </Button>
                    <div className="text-center">
                        <div className="text-xs font-bold text-muted uppercase tracking-widest">{threat.id}</div>
                        <h1 className="text-2xl font-bold text-text">{threat.title}</h1>
                    </div>
                    <div className="w-12"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Quick Status & Scores */}
                    <div className="lg:col-span-1 flex flex-col gap-6">

                        {/* Threat Score Dial */}
                        <Card className="flex flex-col items-center pt-8 pb-4 relative overflow-hidden">
                            <div className="absolute top-4 right-4">
                                <StatusChip intent={threat.type} />
                            </div>
                            <AnalogGauge value={threat.credibility} label="THREAT SCORE" />

                            <div className="w-full mt-6 px-4">
                                <div className="flex justify-between items-center py-3 border-t border-slate-700/10 dark:border-slate-700/50">
                                    <span className="text-sm font-bold text-muted">URGENCY</span>
                                    <UrgencyTimer
                                        urgencyLevel={threat.severity as 'Critical' | 'High' | 'Medium'}
                                        deadline={(() => {
                                            const created = new Date(threat.timestamp).getTime();
                                            // Realistic response windows based on severity
                                            const windows: Record<string, number> = {
                                                'Critical': 2 * 60 * 60 * 1000, // 2 hours
                                                'High': 12 * 60 * 60 * 1000,    // 12 hours
                                                'Medium': 48 * 60 * 60 * 1000,  // 2 days
                                                'Low': 72 * 60 * 60 * 1000      // 3 days
                                            };
                                            const duration = windows[threat.severity] || windows['Medium'];
                                            return new Date(created + duration);
                                        })()}
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Metadata Panel */}
                        <div className="bg-background rounded-2xl p-6 shadow-neumorphic border border-slate-700/5 dark:border-slate-700/30">
                            <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity size={14} /> Intel Summary
                            </h2>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted">Target Sector</span>
                                    <ImpactBadge sector={threat.target} level={threat.severity as 'Critical' | 'High' | 'Medium' | 'Low'} />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted">Source Credibility</span>
                                    <SignalLights level={threat.credibility > 80 ? 'High' : threat.credibility > 50 ? 'Medium' : 'Low'} label="" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted">Origin</span>
                                    <div className="flex items-center gap-1 font-mono text-sm">
                                        <MapPin size={14} className="text-primary" />
                                        {threat.location?.name || 'Unknown'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <Card>
                            <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Activity Timeline</h2>
                            <Timeline events={[
                                { id: '3', title: 'Escalation Potential', description: 'Pattern matches known signatures.', timestamp: '17:15', status: 'pending' },
                                { id: '2', title: 'Auto-Analysis', description: 'AI Confidence Score: 95%', timestamp: '17:10', status: 'current' },
                                { id: '1', title: 'Initial Detection', description: `Detected via ${threat.source}`, timestamp: '17:08', status: 'completed' },
                            ]} />
                        </Card>
                    </div>

                    {/* Right Column: Evidence & Analysis */}
                    <div className="lg:col-span-2 flex flex-col gap-6 h-full">
                        <EvidenceTerminal data={threat.rawEvidence} title={`PAYLOAD_INTERCEPT_${threat.id}`} />

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="primary" onClick={() => {
                                if (!threat) return;
                                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(threat, null, 2));
                                const downloadAnchorNode = document.createElement('a');
                                downloadAnchorNode.setAttribute("href", dataStr);
                                downloadAnchorNode.setAttribute("download", `threat-report-${threat.id}.json`);
                                document.body.appendChild(downloadAnchorNode); // required for firefox
                                downloadAnchorNode.click();
                                downloadAnchorNode.remove();
                            }}>
                                <Share2 size={20} />
                                Export JSON
                            </Button>
                            <Button
                                variant="crimson"
                                className="w-full"
                                onClick={async () => {
                                    try {
                                        await api.threats.escalate(threat.id);
                                        setEscalated(true);
                                        alert("Threat has been successfully escalated to CERT-In. Initial response team notified.");
                                    } catch (err) {
                                        console.error('[AlertDetail] Escalation failed:', err);
                                        alert("Failed to escalate threat. Please try again or contact support.");
                                    }
                                }}
                                disabled={escalated}
                            >
                                {escalated ? <CheckCircle size={20} /> : <ShieldAlert size={20} />}
                                {escalated ? 'Escalated to CERT-In' : 'Escalate to CERT-In'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AlertDetail;
