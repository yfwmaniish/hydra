import React from 'react';
import { Zap, Server, Activity, Wifi } from 'lucide-react';

interface ImpactBadgeProps {
    sector: string;
    level?: 'Critical' | 'High' | 'Medium' | 'Low';
}

const ImpactBadge: React.FC<ImpactBadgeProps> = ({ sector, level = 'High' }) => {
    const getIcon = () => {
        switch (sector.toLowerCase()) {
            case 'power': return <Zap size={14} />;
            case 'telecom': return <Wifi size={14} />;
            case 'finance': return <Activity size={14} />;
            default: return <Server size={14} />;
        }
    };

    const getColors = () => {
        switch (level) {
            case 'Critical': return 'bg-red-500 text-white shadow-red-900/50';
            case 'High': return 'bg-orange-500 text-white shadow-orange-900/50';
            case 'Medium': return 'bg-yellow-500 text-white shadow-yellow-900/50';
            default: return 'bg-slate-500 text-white shadow-slate-900/50';
        }
    };

    return (
        <div className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded disabled-cursor-not-allowed
            ${getColors()}
            font-bold text-xs uppercase tracking-wide
            shadow-[2px_2px_4px_rgba(0,0,0,0.4),inset_1px_1px_1px_rgba(255,255,255,0.3)]
            active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]
            active:translate-y-[1px]
            cursor-default transition-all
            transform hover:-translate-y-0.5
        `}>
            {getIcon()}
            <span>{sector}</span>
        </div>
    );
};

export default ImpactBadge;
