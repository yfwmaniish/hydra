import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Landmark, Wifi, Database, Activity, Loader2, HeartPulse, Radio, Train, Shield, ShieldAlert } from 'lucide-react';
import Card from './Card';
import { threatService } from '../../services/threatService';
import type { Sector } from '../../data/mockData';

const iconMap: Record<string, React.ReactNode> = {
    'zap': <Zap size={18} />,
    'landmark': <Landmark size={18} />,
    'wifi': <Wifi size={18} />,
    'database': <Database size={18} />,
    'activity': <Activity size={18} />,
    'heart-pulse': <HeartPulse size={18} />,
    'radio': <Radio size={18} />,
    'train': <Train size={18} />,
    'shield': <Shield size={18} />,
    'shield-alert': <ShieldAlert size={18} />,
};

const SectorHealth: React.FC = () => {
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await threatService.getSectors();
                setSectors(data);
            } catch (error) {
                console.error("Failed to fetch sector data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    return (
        <Card className="flex flex-col gap-6 h-full">
            <h2 className="text-xl font-bold text-text flex items-center gap-2">
                <Activity className="text-muted" size={20} />
                Sector Impact
            </h2>

            {loading ? (
                <div className="flex-1 flex items-center justify-center min-h-[200px]">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {sectors.map((sector) => (
                        <div key={sector.id} className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-sm font-medium">
                                <div className="flex items-center gap-2 text-text">
                                    <div className={`p-1.5 rounded-lg ${sector.status === 'Critical' ? 'bg-red-100 text-crimson' :
                                        sector.status === 'Warning' ? 'bg-amber-100 text-amber-600' :
                                            'bg-green-100 text-green-600'
                                        }`}>
                                        {iconMap[sector.icon] || <Activity size={18} />}
                                    </div>
                                    <span>{sector.name}</span>
                                </div>
                                <span className={`${sector.status === 'Critical' ? 'text-crimson' :
                                    sector.status === 'Warning' ? 'text-amber-600' :
                                        'text-green-600'
                                    }`}>
                                    {sector.health}%
                                </span>
                            </div>

                            {/* Health Bar Container */}
                            <div className="h-3 w-full bg-background shadow-neumorphic-inset rounded-full overflow-hidden relative">
                                {/* Animated Fill */}
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${sector.health}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className={`h-full rounded-full ${sector.status === 'Critical' ? 'bg-crimson shadow-[0_0_10px_rgba(211,47,47,0.5)]' :
                                        sector.status === 'Warning' ? 'bg-amber-500 shadow-[0_0_10px_rgba(255,160,0,0.5)]' :
                                            'bg-green-500 shadow-[0_0_10px_rgba(76,175,80,0.5)]'
                                        }`}
                                />

                                {/* Scanline Effect (Optional 'Cyber' touch) */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -translate-x-full animate-shimmer" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

export default SectorHealth;
