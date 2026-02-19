import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SectorHealth from '../components/ui/SectorHealth';
import ThreatTimeline from '../components/ui/ThreatTimeline';
import AIInsightCard from '../components/ui/AIInsightCard';
import GlobeVisualization from '../components/ui/GlobeVisualization';
import { useTranslation } from '../context/TranslationContext';
import { threatService } from '../services/threatService';
import { api } from '../services/api';
import type { Threat } from '../data/mockData';
import { MapPin, Clock, ArrowRight, ShieldAlert, Activity, Users, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [threats, setThreats] = useState<Threat[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ active_threats: 0, critical_incidents: 0, monitored_sources: 0, system_status: 'Nominal' });

    const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);

    React.useEffect(() => {
        const loadData = async () => {
            try {
                const [threatData, statsData] = await Promise.allSettled([
                    threatService.getThreats(),
                    api.stats.dashboard(),
                ]);
                if (threatData.status === 'fulfilled') setThreats(threatData.value);
                if (statsData.status === 'fulfilled') setStats(statsData.value);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredThreats = threats.filter(threat => {
        const matchesFilter = filter === 'All' || threat.severity === filter;
        const matchesSearch = threat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            threat.id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const categories = ['All', 'Critical', 'High', 'Medium', 'Low'];

    return (
        <MainLayout>
            <div className="max-w-[1600px] mx-auto h-full flex flex-col gap-8">
                {/* Header Section */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text mb-1">TRINETRA {t('Threat Dashboard')}</h1>
                        <p className="text-muted text-sm">{t('Real-time security monitoring & intelligence')}</p>
                    </div>
                </header>

                {/* Stats Overview Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="flex items-center gap-5 bg-gradient-to-br from-crimson/5 to-transparent border border-crimson/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ShieldAlert size={48} />
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-crimson/10 flex items-center justify-center text-crimson shadow-inner">
                            <ShieldAlert size={28} />
                        </div>
                        <div className="z-10">
                            <p className="text-sm font-medium text-muted mb-1">{t('Active Threats')}</p>
                            <h3 className="text-3xl font-bold text-text">{stats.active_threats}</h3>
                        </div>
                    </Card>

                    <Card className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-amber/10 flex items-center justify-center text-amber shadow-inner">
                            <Activity size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted mb-1">{t('Critical Incidents')}</p>
                            <h3 className="text-3xl font-bold text-text">{stats.critical_incidents}</h3>
                        </div>
                    </Card>

                    <Card className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                            <Users size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted mb-1">{t('Monitored Sources')}</p>
                            <h3 className="text-3xl font-bold text-text">{stats.monitored_sources}</h3>
                        </div>
                    </Card>

                    <Card className="p-0 overflow-hidden relative min-h-[120px] flex flex-col justify-center items-center bg-background">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 animate-pulse" />
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            <div className="flex gap-1">
                                <span className="w-1 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                                <span className="w-1 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                            </div>
                            <span className="font-bold text-primary tracking-[0.2em] text-xs uppercase">System Nominal</span>
                        </div>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-12 gap-8 flex-1 min-h-0">

                    {/* Left Column: Feed (8 cols on large screens) */}
                    <div className="col-span-12 xl:col-span-8 flex flex-col gap-6 h-full min-h-0">
                        <AIInsightCard selectedThreat={selectedThreat} />

                        {/* Search & Filter Bar */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search alerts by ID, title, or keyword..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-background shadow-neumorphic-inset outline-none text-text placeholder-muted transition-all focus:shadow-neumorphic-pressed focus:ring-1 focus:ring-primary/20"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 custom-scrollbar p-1.5">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilter(cat)}
                                        className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap border-2 ${filter === cat
                                            ? 'bg-primary border-primary text-white shadow-lg transform -translate-y-0.5'
                                            : 'bg-background border-transparent text-muted hover:text-text shadow-neumorphic hover:shadow-neumorphic-input active:shadow-neumorphic-inset'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Scrolling Feed */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-[400px] custom-scrollbar pb-4 p-1">
                            {loading ? (
                                <div className="flex items-center justify-center h-40">
                                    <Loader2 className="animate-spin text-primary" size={32} />
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {filteredThreats.map((threat) => (
                                        <motion.div
                                            key={threat.id}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            onClick={() => navigate(`/alert/${threat.id}`)}
                                            className="cursor-pointer"
                                        >
                                            <Card className={`group border-l-4 transition-all duration-300 ${selectedThreat?.id === threat.id
                                                ? 'border-l-primary shadow-neumorphic-pressed bg-primary/5'
                                                : 'border-transparent hover:border-l-primary hover:shadow-neumorphic-hover'
                                                }`}>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <Badge variant={threat.severity as any}>
                                                                {threat.severity}
                                                            </Badge>
                                                            <span className="text-xs text-muted font-mono tracking-wider">{threat.id}</span>
                                                            <span className="flex items-center gap-1 text-xs text-muted">
                                                                <Clock size={12} />
                                                                {new Date(threat.timestamp).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-lg font-bold text-text group-hover:text-primary transition-colors">
                                                            {threat.title}
                                                        </h3>
                                                        <div className="flex items-center gap-3 text-sm text-muted mt-2">
                                                            <span className="flex items-center gap-1">
                                                                <MapPin size={14} className="text-primary" />
                                                                {threat.source}
                                                            </span>
                                                            <span className="text-muted/30">•</span>
                                                            <span className="font-mono text-xs text-slate-400 uppercase tracking-wide">{threat.type}</span>
                                                        </div>
                                                    </div>
                                                    <div className="self-end sm:self-center flex gap-2">
                                                        {/* Analyze Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedThreat(threat);
                                                            }}
                                                            className={`p-2 rounded-full transition-all ${selectedThreat?.id === threat.id
                                                                ? 'bg-primary text-white shadow-lg'
                                                                : 'bg-background text-muted hover:text-primary shadow-neumorphic hover:bg-primary/10'
                                                                }`}
                                                            title="Analyze with AI"
                                                        >
                                                            <Activity size={20} />
                                                        </button>

                                                        <div className="w-10 h-10 rounded-full bg-background shadow-neumorphic flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                                            <ArrowRight size={20} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Widgets (4 cols on large screens) */}
                    <div className="col-span-12 xl:col-span-4 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pb-4">
                        <ThreatTimeline />
                        <GlobeVisualization threats={threats} />
                        <SectorHealth />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};


export default Dashboard;
