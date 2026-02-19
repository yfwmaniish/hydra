import React from 'react';
import { motion } from 'framer-motion';

interface StatsCardProps {
    title: string;
    value: string | number;
    trend?: string;
    trendUp?: boolean;
    icon?: React.ReactNode;
    delay?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, trend, trendUp, icon, delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay }}
            className="bg-background rounded-2xl p-5 shadow-neumorphic border border-white/50 flex flex-col justify-between"
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-muted text-sm font-medium">{title}</span>
                {icon && <div className="text-muted">{icon}</div>}
            </div>
            <div className="flex items-end gap-3">
                <h3 className="text-3xl font-bold text-text leading-none">{value}</h3>
                {trend && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trendUp ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {trend}
                    </span>
                )}
            </div>
        </motion.div>
    );
};

export default StatsCard;
