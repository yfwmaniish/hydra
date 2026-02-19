
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate login delay
        setTimeout(() => {
            setLoading(false);
            // In a real app, you'd set auth state here
            navigate('/');
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-crimson/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-crimson/10 rounded-full blur-[100px]" />
            </div>

            <Card className="w-full max-w-md p-8 relative z-10 backdrop-blur-md bg-background/80 border border-white/5 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-surfaceShadow shadow-neumorphic flex items-center justify-center text-crimson mb-4">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-widest text-text">TRINETRA</h1>
                    <p className="text-muted text-sm mt-2">Threat Intelligence Platform</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <Input
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="agent@trinetra.intel"
                        required
                        icon={<Lock size={18} />}
                    />

                    <div className="relative">
                        <Input
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            icon={<Lock size={18} />}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-[38px] text-muted hover:text-text transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <Button
                        variant="primary"
                        className="w-full justify-center py-3 text-lg font-semibold shadow-lg shadow-crimson/20 hover:shadow-crimson/40"
                        isLoading={loading}
                        type="submit"
                    >
                        {loading ? 'Authenticating...' : 'Access Terminal'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-muted/60">
                        Restricted Access. Authorized Personnel Only.
                        <br />
                        System activity is monitored and logged.
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default Login;
