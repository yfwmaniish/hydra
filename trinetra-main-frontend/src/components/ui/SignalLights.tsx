import React from 'react';

interface SignalLightsProps {
    level: 'Low' | 'Medium' | 'High';
    label?: string;
}

const SignalLights: React.FC<SignalLightsProps> = ({ level, label = "CREDIBILITY" }) => {
    const isGreen = level === 'Low';
    const isYellow = level === 'Medium';
    const isRed = level === 'High';

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex gap-3 p-3 bg-background rounded-xl shadow-neumorphic border border-slate-700/10 dark:border-slate-700/50">
                {/* Green Light */}
                <div className={`w-4 h-4 rounded-full transition-all duration-300 ${isGreen ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-green-900/20 shadow-inner'}`} />

                {/* Yellow Light */}
                <div className={`w-4 h-4 rounded-full transition-all duration-300 ${isYellow ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-amber-900/20 shadow-inner'}`} />

                {/* Red Light */}
                <div className={`w-4 h-4 rounded-full transition-all duration-300 ${isRed ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-red-900/20 shadow-inner'}`} />
            </div>
            {label && <span className="text-[10px] font-bold text-muted tracking-widest uppercase">{label}</span>}
        </div>
    );
};

export default SignalLights;
