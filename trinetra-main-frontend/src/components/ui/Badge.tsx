import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'critical' | 'high' | 'medium' | 'low' | 'neutral';
    className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
    const variants = {
        default: 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200',
        critical: 'bg-red-100 text-crimson',
        high: 'bg-amber-100 text-amber-700',
        medium: 'bg-blue-100 text-blue-700',
        low: 'bg-green-100 text-green-700',
        neutral: 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300',
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold leading-none ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
