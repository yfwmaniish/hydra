import React from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import { User, Mail, Shield, Clock, Calendar } from 'lucide-react';

const Profile: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return <div className="text-text">Loading profile...</div>;
    }

    const creationTime = user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A';
    const lastSignInTime = user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'N/A';

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-text mb-2">My Profile</h1>
                <p className="text-muted">Manage your account settings and preferences.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* User Identity Card */}
                <Card className="col-span-1 md:col-span-1 flex flex-col items-center p-8 text-center bg-gradient-to-b from-primary/5 to-transparent border-primary/10">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-neumorphic mb-6 relative">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                                <User size={48} />
                            </div>
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-text mb-1">{user.displayName || 'User'}</h2>
                    <p className="text-sm text-muted mb-4">{user.email}</p>
                    <div className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                        Authenticated
                    </div>
                </Card>

                {/* Account Details & Stats */}
                <div className="col-span-1 md:col-span-2 space-y-6">
                    <Card>
                        <h3 className="text-lg font-bold text-text mb-6 flex items-center gap-2">
                            <Shield size={20} className="text-primary" />
                            Account Information
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-background shadow-neumorphic-inset">
                                    <div className="flex items-center gap-2 text-xs text-muted mb-1">
                                        <Mail size={14} />
                                        Email Address
                                    </div>
                                    <div className="font-mono text-sm text-text truncate" title={user.email || ''}>
                                        {user.email}
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-background shadow-neumorphic-inset">
                                    <div className="flex items-center gap-2 text-xs text-muted mb-1">
                                        <User size={14} />
                                        User ID
                                    </div>
                                    <div className="font-mono text-xs text-text truncate" title={user.uid}>
                                        {user.uid}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-lg font-bold text-text mb-6 flex items-center gap-2">
                            <ActivityIcon />
                            Session Activity
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-4 p-4 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-muted mb-0.5">Account Created</p>
                                    <p className="text-sm font-bold text-text">{creationTime}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-muted mb-0.5">Last Sign In</p>
                                    <p className="text-sm font-bold text-text">{lastSignInTime}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const ActivityIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
    >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);

export default Profile;
