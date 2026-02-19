import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, icon, className = '', ...props }) => {
    return (
        <div className="flex flex-col gap-2">
            {label && <label className="text-sm font-medium text-muted ml-1">{label}</label>}
            <div className="relative">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                        {icon}
                    </div>
                )}
                <input
                    className={`w-full bg-background shadow-neumorphic-inset rounded-xl py-3 outline-none focus:ring-2 focus:ring-gray-200/50 transition-all text-text placeholder-gray-400 ${icon ? 'pl-11 pr-4' : 'px-4'} ${className}`}
                    {...props}
                />
            </div>
        </div>
    );
};

export default Input;
