
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { signInWithGoogle } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
            navigate('/');
        } catch (error) {
            console.error("Login failed", error);
        } finally {
            setLoading(false);
        }
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

                <div className="space-y-6">
                    <div className="text-center">
                        <p className="text-muted mb-6">Authenticate using your agency credentials</p>
                    </div>

                    <Button
                        variant="primary"
                        className="w-full justify-center py-3 text-lg font-semibold shadow-lg shadow-crimson/20 hover:shadow-crimson/40 flex items-center gap-3"
                        isLoading={loading}
                        onClick={handleLogin}
                    >
                        {!loading && (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        )}
                        {loading ? 'Authenticating...' : 'Sign in with Google'}
                    </Button>
                </div>

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
