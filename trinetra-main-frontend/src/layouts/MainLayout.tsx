import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, LayoutDashboard, Settings, Network } from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';
import RockerSwitch from '../components/ui/RockerSwitch';
import { useTranslation } from '../context/TranslationContext';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { language, toggleLanguage } = useTranslation();
    const navItems = [
        { path: '/', icon: <LayoutDashboard size={24} />, label: 'Dashboard' },
        { path: '/investigation', icon: <Network size={24} />, label: 'Investigation' },
        { path: '/admin', icon: <Settings size={24} />, label: 'Data Sources' },
    ];

    return (
        <div className="min-h-screen bg-background text-text p-4 md:p-8 flex flex-col md:flex-row gap-4 md:gap-8">
            {/* Sidebar Navigation */}
            <nav className="w-full md:w-24 flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 md:gap-8 pt-2 pb-2 md:pt-8 md:pb-8 h-16 md:h-auto order-2 md:order-1 bg-background md:bg-transparent rounded-2xl md:rounded-none shadow-neumorphic md:shadow-none z-50">
                <div className="hidden md:flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-background shadow-neumorphic flex items-center justify-center text-crimson mb-2">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-xs font-bold tracking-widest text-text">TRINETRA</h1>
                </div>

                <div className="flex md:flex-col gap-8 items-center justify-center w-full md:w-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isActive ? 'shadow-neumorphic-inset text-crimson' : 'shadow-neumorphic text-muted hover:text-text'
                                }`
                            }
                            title={item.label}
                        >
                            {item.icon}
                        </NavLink>
                    ))}
                </div>

                <div className="mt-0 md:mt-auto flex flex-col gap-4 items-center">
                    <RockerSwitch checked={language === 'en'} onChange={toggleLanguage} labelOn="EN" labelOff="HI" />
                    <ThemeToggle />
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 rounded-3xl md:rounded-[3rem] bg-background shadow-neumorphic-inset p-4 md:p-8 overflow-hidden relative order-1 md:order-2 h-[calc(100vh-7rem)] md:h-auto">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
