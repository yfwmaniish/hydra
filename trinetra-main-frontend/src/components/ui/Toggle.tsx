import React from 'react';
import { motion } from 'framer-motion';

interface ToggleProps {
    label: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    size?: 'sm' | 'md';
}

const Toggle: React.FC<ToggleProps> = ({ label, enabled, onChange, size = 'md' }) => {
    const isSmall = size === 'sm';
    const width = isSmall ? 'w-10' : 'w-14';
    const height = isSmall ? 'h-6' : 'h-8';
    const knobSize = isSmall ? 'w-4 h-4' : 'w-6 h-6';
    const translate = isSmall ? '1rem' : '1.5rem';

    return (
        <div className="flex items-center justify-between cursor-pointer group gap-3" onClick={() => onChange(!enabled)}>
            {label && <span className="font-medium text-text group-hover:text-text transition-colors text-sm">{label}</span>}
            <div
                className={`${width} ${height} rounded-full flex items-center p-1 transition-all duration-300 ${enabled ? 'bg-background shadow-neumorphic-inset' : 'bg-background shadow-neumorphic'
                    }`}
            >
                {/* The Knob */}
                <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`${knobSize} rounded-full shadow-md ${enabled ? 'bg-green-500 shadow-inner' : 'bg-gray-300'
                        }`}
                    style={{
                        marginLeft: enabled ? translate : '0rem',
                        boxShadow: enabled
                            ? 'inset 2px 2px 5px rgba(0,0,0,0.2), inset -2px -2px 5px rgba(255,255,255,0.2)'
                            : '2px 2px 5px rgba(0,0,0,0.1), -2px -2px 5px rgba(255,255,255,0.4)'
                    }}
                />
            </div>
        </div>
    );
};

export default Toggle;
