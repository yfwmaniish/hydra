import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Settings, Network } from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';
import RockerSwitch from '../components/ui/RockerSwitch';
import { useTranslation } from '../context/TranslationContext';
import UserProfileMenu from '../components/UserProfileMenu';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { language, toggleLanguage } = useTranslation();
    const location = useLocation();

    const navItems = [
        { path: '/', icon: <LayoutDashboard size={24} />, label: 'Dashboard' },
        { path: '/investigation', icon: <Network size={24} />, label: 'Investigation' },
        { path: '/admin', icon: <Settings size={24} />, label: 'Data Sources' },
    ];

    const getPageTitle = () => {
        switch (location.pathname) {
            case '/': return 'Dashboard';
            case '/investigation': return 'Investigation';
            case '/admin': return 'Data Sources';
            case '/profile': return 'My Profile';
            default: return 'Trinetra';
        }
    };

    return (
        <div className="min-h-screen bg-background text-text p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Sidebar Navigation */}
            <nav className="w-full md:w-24 flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 md:gap-8 pt-2 pb-2 md:pt-8 md:pb-8 h-16 md:h-auto order-2 md:order-1 bg-background md:bg-transparent rounded-2xl md:rounded-none shadow-neumorphic md:shadow-none z-50">
                <div className="hidden md:flex flex-col items-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-background shadow-neumorphic flex items-center justify-center text-crimson mb-2">
                        <Shield size={28} />
                    </div>
                </div>

                <div className="flex md:flex-col gap-6 items-center justify-center w-full md:w-auto">
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
            <main className="flex-1 rounded-3xl md:rounded-[2.5rem] bg-background shadow-neumorphic-inset p-4 md:p-8 overflow-hidden relative order-1 md:order-2 h-[calc(100vh-5rem)] md:h-[calc(100vh-3rem)] flex flex-col">
                <header className="flex justify-between items-center mb-6 shrink-0">
                    <div className="md:hidden flex items-center gap-2 text-crimson mb-1">
                        <Shield size={24} />
                        <span className="font-bold tracking-widest text-xs">TRINETRA</span>
                    </div>

                    {/* Breadcrumb / Title */}
                    <div className="hidden md:block">
                        <h2 className="text-xl font-bold text-text/80">{getPageTitle()}</h2>
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                        <UserProfileMenu />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
