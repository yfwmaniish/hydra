import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface UrgencyTimerProps {
    deadline?: Date; // If not provided, simulates a countdown
    urgencyLevel?: 'Critical' | 'High' | 'Medium';
}

const UrgencyTimer: React.FC<UrgencyTimerProps> = ({ deadline, urgencyLevel = 'Critical' }) => {
    // Default to 4 hours from now if no deadline
    const [target] = useState(deadline || new Date(Date.now() + 4 * 60 * 60 * 1000));
    const [timeLeft, setTimeLeft] = useState<{ h: string, m: string, s: string }>({ h: '00', m: '00', s: '00' });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const difference = target.getTime() - now;

            if (difference <= 0) {
                clearInterval(timer);
                setTimeLeft({ h: '00', m: '00', s: '00' });
            } else {
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeLeft({
                    h: hours.toString().padStart(2, '0'),
                    m: minutes.toString().padStart(2, '0'),
                    s: seconds.toString().padStart(2, '0')
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [target]);

    const getColor = () => {
        if (urgencyLevel === 'Critical') return 'text-red-500 bg-red-950/30 border-red-500/30';
        if (urgencyLevel === 'High') return 'text-orange-500 bg-orange-950/30 border-orange-500/30';
        return 'text-yellow-500 bg-yellow-950/30 border-yellow-500/30';
    };

    return (
        <div className={`border rounded-xl p-4 flex flex-col items-center justify-center ${getColor()} shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]`}>
            <div className="flex items-center gap-2 mb-2 opacity-80">
                <Clock size={14} className="animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest">Time to Impact</span>
            </div>

            <div className="flex items-end gap-1 font-mono leading-none">
                <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-current to-transparent bg-opacity-50" style={{ WebkitTextFillColor: 'currentColor' }}>
                        {timeLeft.h}
                    </span>
                    <span className="text-[10px] opacity-60">HRS</span>
                </div>
                <span className="text-xl mb-3 animate-pulse">:</span>
                <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold">
                        {timeLeft.m}
                    </span>
                    <span className="text-[10px] opacity-60">MIN</span>
                </div>
                <span className="text-xl mb-3 animate-pulse">:</span>
                <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold">
                        {timeLeft.s}
                    </span>
                    <span className="text-[10px] opacity-60">SEC</span>
                </div>
            </div>
        </div>
    );
};

export default UrgencyTimer;
