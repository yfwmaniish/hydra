import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    inset?: boolean;
}

const Card: React.FC<CardProps> = ({ children, inset = false, className = '', ...props }) => {
    return (
        <motion.div
            className={`bg-background rounded-2xl p-6 ${inset ? 'shadow-neumorphic-inset' : 'shadow-neumorphic'} ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default Card;
