import React from 'react';

interface GaugeProps {
    value: number; // 0-100
    label: string;
    color?: string;
}

const Gauge: React.FC<GaugeProps> = ({ value, label, color = '#d32f2f' }) => {
    // Calculate rotation: -90deg to 90deg maps to 0-100
    const rotation = (value / 100) * 180 - 90;

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="relative w-40 h-20 overflow-hidden mb-2">
                {/* Background Arc */}
                <div className="absolute top-0 left-0 w-40 h-40 rounded-full border-8 border-gray-200 box-border shadow-neumorphic-inset clip-half" style={{ clipPath: 'inset(0 0 50% 0)' }}></div>

                {/* Needle */}
                <div
                    className="absolute bottom-0 left-1/2 w-1 h-36 bg-gray-400 origin-bottom transition-transform duration-1000 ease-out z-10"
                    style={{
                        transform: `translateX(-50%) rotate(${rotation}deg)`,
                        boxShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                    }}
                >
                    <div className="w-3 h-3 bg-text rounded-full absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ backgroundColor: color }}></div>
                </div>

                {/* Center Pivot */}
                <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-background rounded-full shadow-neumorphic transform -translate-x-1/2 translate-y-1/2 z-20"></div>
            </div>
            <div className="text-xl font-bold mt-2" style={{ color }}>{value}%</div>
            <div className="text-sm text-muted uppercase tracking-wider">{label}</div>
        </div>
    );
};

export default Gauge;
