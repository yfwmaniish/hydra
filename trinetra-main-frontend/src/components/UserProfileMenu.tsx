import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const UserProfileMenu: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const toggleMenu = () => setIsOpen(!isOpen);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!user) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={toggleMenu}
                className="flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-background/50 outline-none focus:ring-2 focus:ring-primary/20"
            >
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 shadow-neumorphic">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                            <User size={20} />
                        </div>
                    )}
                </div>
                <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-bold text-text">{user.displayName || 'User'}</span>
                    <span className="text-xs text-muted">{user.email}</span>
                </div>
                <ChevronDown size={16} className={`text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 rounded-2xl bg-background shadow-neumorphic-pressed border border-white/5 overflow-hidden z-50 p-2"
                    >
                        <div className="px-4 py-3 border-b border-white/5 mb-2 md:hidden">
                            <p className="text-sm font-bold text-text truncate">{user.displayName}</p>
                            <p className="text-xs text-muted truncate">{user.email}</p>
                        </div>

                        <button
                            onClick={() => {
                                navigate('/profile');
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-primary/5 hover:text-primary list-none text-left transition-colors text-sm text-text"
                        >
                            <User size={18} />
                            My Profile
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-crimson/5 hover:text-crimson list-none text-left transition-colors text-sm text-text mt-1"
                        >
                            <LogOut size={18} />
                            Log Out
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserProfileMenu;
