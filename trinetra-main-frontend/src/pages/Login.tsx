import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            navigate('/');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#0d0208] text-[#00ff41] flex items-center justify-center p-4 font-mono relative overflow-hidden">
            {/* Background Grid Animation */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(0, 255, 65, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 65, 0.1) 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-md bg-black/80 backdrop-blur-sm border border-[#00ff41]/30 p-8 rounded-xl shadow-[0_0_20px_rgba(0,255,65,0.2)] z-10 relative"
            >
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full border-2 border-[#00ff41] flex items-center justify-center shadow-[0_0_15px_rgba(0,255,65,0.4)]">
                        <Shield size={32} />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-center mb-2 tracking-widest text-[#00ff41] drop-shadow-[0_0_5px_rgba(0,255,65,0.8)]">
                    SENTINEL ACCESS
                </h1>
                <p className="text-center text-green-400/60 text-xs mb-8">RESTRICTED AREA. AUTHORIZED PERSONNEL ONLY.</p>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold tracking-wider">Agent ID / Email</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/50 border border-[#00ff41]/50 focus:border-[#00ff41] rounded px-4 py-3 outline-none transition-all placeholder-green-900 text-green-100"
                                placeholder="agent@sentinel.intel"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold tracking-wider">Passcode</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/50 border border-[#00ff41]/50 focus:border-[#00ff41] rounded px-4 py-3 outline-none transition-all placeholder-green-900 text-green-100"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00ff41]/70 hover:text-[#00ff41]"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#00ff41]/20 hover:bg-[#00ff41]/30 border border-[#00ff41] text-[#00ff41] font-bold py-3 rounded transition-all uppercase tracking-widest relative overflow-hidden group"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-2 h-2 bg-[#00ff41] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                                <span className="w-2 h-2 bg-[#00ff41] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                <span className="w-2 h-2 bg-[#00ff41] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            </span>
                        ) : (
                            <>
                                <span className="relative z-10">Authenticate</span>
                                <div className="absolute inset-0 bg-[#00ff41] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 opacity-10"></div>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-[#00ff41]/20 flex justify-between text-[10px] text-green-500/50 font-mono">
                    <span>SYS.VER.2.4.0</span>
                    <span className="animate-pulse">SECURE CONNECTION ESTABLISHED</span>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
