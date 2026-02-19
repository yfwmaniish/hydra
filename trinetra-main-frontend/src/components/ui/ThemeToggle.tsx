import React from 'react';
import { Moon, Sun, Terminal } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    const getPosition = () => {
        if (theme === 'light') return 0;
        if (theme === 'dark') return 32;
        return 64;
    };

    const getIcon = () => {
        if (theme === 'light') return <Sun size={14} />;
        if (theme === 'dark') return <Moon size={14} />;
        return <Terminal size={14} />;
    };

    const getColor = () => {
        if (theme === 'light') return 'bg-amber-100 text-amber-500';
        if (theme === 'dark') return 'bg-slate-700 text-slate-200';
        return 'bg-black text-[#00ff41] border border-[#00ff41]';
    };

    return (
        <button
            onClick={toggleTheme}
            className="relative w-24 h-8 rounded-full bg-background shadow-neumorphic-inset flex items-center p-1 transition-all duration-300"
            aria-label="Toggle Theme"
        >
            <motion.div
                layout
                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                className={`w-6 h-6 rounded-full shadow-md transform flex items-center justify-center ${getColor()}`}
                animate={{
                    translateX: getPosition()
                }}
            >
                {getIcon()}
            </motion.div>
        </button>
    );
};

export default ThemeToggle;
