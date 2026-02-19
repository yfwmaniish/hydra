import React from 'react';

interface StatusChipProps {
    intent: string;
    className?: string;
}

const StatusChip: React.FC<StatusChipProps> = ({ intent, className = '' }) => {
    return (
        <div className={`
            relative px-4 py-2 rounded-lg bg-background shadow-neumorphic-inset 
            flex items-center justify-center overflow-hidden uppercase font-bold text-xs tracking-widest text-muted
            group hover:text-text transition-colors duration-300 ${className}
        `}>
            {/* "Engraved" Text Effect */}
            <span className="relative z-10 drop-shadow-[1px_1px_1px_rgba(255,255,255,0.1)] dark:drop-shadow-[1px_1px_1px_rgba(0,0,0,0.5)]">
                {intent}
            </span>

            {/* Inner Glow on Hover */}
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
    );
};

export default StatusChip;
