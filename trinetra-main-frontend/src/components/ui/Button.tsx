import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'crimson' | 'amber';
    children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', ...props }) => {
    const baseStyles = "px-6 py-3 rounded-xl font-semibold transition-all duration-200 outline-none flex items-center justify-center gap-2 select-none active:shadow-neumorphic-pressed";

    const variants = {
        primary: "bg-background text-text shadow-neumorphic hover:text-muted",
        crimson: "bg-background text-crimson shadow-neumorphic hover:bg-red-50",
        amber: "bg-background text-amber-600 shadow-neumorphic hover:bg-amber-50",
    };

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </motion.button>
    );
};

export default Button;
