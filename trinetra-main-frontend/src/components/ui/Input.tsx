import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
    return (
        <div className="flex flex-col gap-2">
            {label && <label className="text-sm font-medium text-muted ml-1">{label}</label>}
            <input
                className={`bg-background shadow-neumorphic-inset rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-200/50 transition-all text-text placeholder-gray-400 ${className}`}
                {...props}
            />
        </div>
    );
};

export default Input;
