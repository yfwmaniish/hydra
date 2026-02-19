import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Card from './Card';
import { Clock, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { threatService } from '../../services/threatService';
import type { TimelineData } from '../../data/mockData';

const ThreatTimeline: React.FC = () => {
    const { theme } = useTheme();
    const isMatrix = theme === 'matrix';
    const [data, setData] = useState<TimelineData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const fetchedData = await threatService.getThreatTimeline();
                setData(fetchedData);
            } catch (error) {
                console.error("Failed to fetch timeline data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // SVG Dimensions
    // SVG Dimensions
    const width = 100;
    const height = 25; // Flatter aspect ratio (was 40)
    const padding = 5;

    // Normalize data to fit SVG
    const maxValue = Math.max(...data.map(d => d.value));
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
        const y = height - (d.value / maxValue) * (height - padding * 2) - padding;
        return `${x},${y}`;
    }).join(' ');

    // Area path (closed loop for fill)
    const areaPath = `M ${padding},${height - padding} ${points} L ${width - padding},${height - padding} Z`;

    const lineColor = isMatrix ? '#00ff41' : '#d946ef'; // Matrix Green or Fuchsia

    // Removed unused fillColor variable to fix lint error
    // const fillColor = isMatrix ? 'rgba(0, 255, 65, 0.2)' : 'rgba(217, 70, 239, 0.2)';

    return (
        <Card className="flex flex-col min-h-[160px]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-text flex items-center gap-2">
                    <Clock className="text-muted" size={20} />
                    Threat Velocity (24h)
                </h2>
                <div className="text-sm font-mono text-muted">
                    Peak: <span className={isMatrix ? 'text-[#00ff41]' : 'text-fuchsia-500'}>
                        {loading ? '...' : Math.max(...data.map(d => d.value), 0)} events/hr
                    </span>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative w-full overflow-hidden">
                {loading ? (
                    <Loader2 className="animate-spin text-primary" size={32} />
                ) : (
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        {/* Grid Lines */}
                        {[1, 2, 3].map(i => (
                            <line
                                key={i}
                                x1={padding}
                                y1={height - (i * height / 4)}
                                x2={width - padding}
                                y2={height - (i * height / 4)}
                                stroke="currentColor"
                                strokeOpacity={0.1}
                                strokeWidth="0.2"
                            />
                        ))}

                        {/* Gradient Defs */}
                        <defs>
                            <linearGradient id="gradientDetails" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor={lineColor} stopOpacity="0.5" />
                                <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Filled Area */}
                        <motion.path
                            d={areaPath}
                            fill="url(#gradientDetails)"
                            initial={{ opacity: 0, pathLength: 0 }}
                            animate={{ opacity: 1, pathLength: 1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />

                        {/* Line Path */}
                        <motion.polyline
                            fill="none"
                            stroke={lineColor}
                            strokeWidth="1.5"
                            points={points}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        />

                        {/* Data Points */}
                        {data.map((d, i) => {
                            const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
                            const y = height - (d.value / maxValue) * (height - padding * 2) - padding;
                            return (
                                <motion.circle
                                    key={i}
                                    cx={x}
                                    cy={y}
                                    r="1.5"
                                    fill={lineColor}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 1 + (i * 0.1), duration: 0.3 }}
                                />
                            );
                        })}
                    </svg>
                )}
            </div>

            <div className="flex justify-between text-xs text-muted mt-2 font-mono">
                <span>00:00</span>
                <span>08:00</span>
                <span>16:00</span>
                <span>23:59</span>
            </div>
        </Card>
    );
};

export default ThreatTimeline;
