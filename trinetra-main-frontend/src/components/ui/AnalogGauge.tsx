import React from 'react';
import { motion } from 'framer-motion';

interface AnalogGaugeProps {
    value: number; // 0 to 100
    label?: string;
    size?: number;
}

const AnalogGauge: React.FC<AnalogGaugeProps> = ({ value, label = "SCORE", size = 200 }) => {
    // Clamp value between 0 and 100
    const score = Math.min(Math.max(value, 0), 100);
    // Convert score to angle: 0 = -90deg, 100 = 90deg
    const angle = (score / 100) * 180 - 90;

    const radius = size / 2;
    const center = size / 2;
    const needleLength = radius * 0.7;

    return (
        <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size / 1.5 }}>
            <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
                {/* Gauge Background (Semi-circle) */}
                <path
                    d={`M 10,${center} A ${radius - 10} ${radius - 10} 0 0 1 ${size - 10},${center}`}
                    fill="none"
                    stroke="#334155"
                    strokeWidth="10"
                    strokeLinecap="round"
                    className="opacity-20"
                />

                {/* Ticks */}
                {Array.from({ length: 11 }).map((_, i) => {
                    const tickAngle = (i * 18) - 180; // Spread over 180 degrees
                    const isMajor = i % 5 === 0;
                    const length = isMajor ? 10 : 5;
                    const tickRad = (tickAngle * Math.PI) / 180;
                    const x1 = center + (radius - 25) * Math.cos(tickRad);
                    const y1 = center + (radius - 25) * Math.sin(tickRad);
                    const x2 = center + (radius - 25 - length) * Math.cos(tickRad);
                    const y2 = center + (radius - 25 - length) * Math.sin(tickRad);

                    return (
                        <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={isMajor ? "#94a3b8" : "#475569"}
                            strokeWidth={isMajor ? 2 : 1}
                        />
                    );
                })}

                {/* Colored Zones (Simplified) */}
                <path
                    d={`M ${center - (radius - 10)},${center} A ${radius - 10} ${radius - 10} 0 0 1 ${center + (radius - 10)},${center}`}
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                />

                <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                </defs>

                {/* Needle */}
                <motion.g
                    initial={{ rotate: -90 }}
                    animate={{ rotate: angle }}
                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                    style={{ originX: "50%", originY: "100%", x: center, y: center }}
                >
                    <line x1="0" y1="0" x2="0" y2={-needleLength} stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="0" cy="0" r="6" fill="#e2e8f0" />
                </motion.g>
            </svg>

            {/* Digital Score Display */}
            <div className="absolute bottom-0 flex flex-col items-center">
                <div className="text-3xl font-bold text-text font-mono tracking-tighter">
                    {score.toFixed(1)}
                </div>
                <div className="text-xs font-bold text-muted uppercase tracking-widest mt-1">
                    {label}
                </div>
            </div>
        </div>
    );
};

export default AnalogGauge;
