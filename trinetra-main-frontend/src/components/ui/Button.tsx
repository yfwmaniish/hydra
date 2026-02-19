import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'crimson' | 'amber';
    children: React.ReactNode;
    isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', isLoading = false, disabled, ...props }) => {
    const baseStyles = "px-6 py-3 rounded-xl font-semibold transition-all duration-200 outline-none flex items-center justify-center gap-2 select-none active:shadow-neumorphic-pressed disabled:opacity-70 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-background text-text shadow-neumorphic hover:text-muted",
        crimson: "bg-background text-crimson shadow-neumorphic hover:bg-red-50",
        amber: "bg-background text-amber-600 shadow-neumorphic hover:bg-amber-50",
    };

    // Simple spinner SVG for loading state
    const Spinner = () => (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );

    return (
        <motion.button
            whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            disabled={disabled || isLoading}
            {...props as any}
        >
            {isLoading && <Spinner />}
            {children}
        </motion.button>
    );
};

export default Button;
