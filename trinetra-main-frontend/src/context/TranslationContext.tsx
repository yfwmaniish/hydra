import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'hi';

interface TranslationContextType {
    language: Language;
    toggleLanguage: () => void;
    t: (key: string, defaultText?: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const dictionary: Record<string, string> = {
    'Threat Dashboard': 'खतरा डैशबोर्ड',
    'Real-time security monitoring': 'वास्तविक समय सुरक्षा निगरानी',
    'Active Threats': 'सक्रिय खतरे',
    'Critical Incidents': 'महत्वपूर्ण घटनाएं',
    'Monitored Sources': 'निगरानी किए गए स्रोत',
    'System Configuration': 'सिस्टम कॉन्फ़िगरेशन',
    'Investigation Board': 'जांच बोर्ड',
    'Target Keywords': 'लक्ष्य कीवर्ड',
    'Data Sources': 'डेटा स्रोत',
    'Sector Impact': 'सेक्टर प्रभाव',
    'Threat Velocity': 'खतरा गति',
};

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'hi' : 'en');
    };

    const t = (text: string, defaultText: string = text) => {
        if (language === 'en') return defaultText;
        return dictionary[text] || defaultText;
    };

    return (
        <TranslationContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </TranslationContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(TranslationContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
};
