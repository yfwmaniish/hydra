import React from 'react';
import { Languages } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext';
import { motion } from 'framer-motion';

const LanguageToggle: React.FC = () => {
    const { language, toggleLanguage } = useTranslation();

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleLanguage}
            className="w-12 h-12 rounded-xl bg-background shadow-neumorphic flex items-center justify-center text-text hover:text-primary transition-colors relative group"
            title="Switch Language"
        >
            <Languages size={20} />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">
                {language.toUpperCase()}
            </span>
        </motion.button>
    );
};

export default LanguageToggle;
