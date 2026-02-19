import React, { useState, useEffect, useCallback } from 'react';

import Card from '../components/ui/Card';
import Toggle from '../components/ui/Toggle';
import Button from '../components/ui/Button';

import { Plus, Database, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

// ─── Types matching backend response ───────────────────────────────
interface Source {
    id: number;
    name: string;
    active: boolean;
    type: string;
    url?: string;
}

interface Keyword {
    id: number;
    term: string;
    active: boolean;
}

// ─── Component ─────────────────────────────────────────────────────
const AdminConfig: React.FC = () => {
    const [sources, setSources] = useState<Source[]>([]);
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [newSource, setNewSource] = useState('');
    const [newKeyword, setNewKeyword] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null); // Track which action is saving

    // ─── Load from backend on mount ────────────────────────────────
    const loadData = useCallback(async () => {
        try {
            const [sourcesData, keywordsData] = await Promise.allSettled([
                api.sources.list(),
                api.keywords.list(),
            ]);
            if (sourcesData.status === 'fulfilled') setSources(sourcesData.value);
            if (keywordsData.status === 'fulfilled') setKeywords(keywordsData.value);
        } catch (err) {
            console.error('[AdminConfig] Failed to load config:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ─── Source CRUD ───────────────────────────────────────────────
    const toggleSource = async (source: Source) => {
        setSaving(`source-toggle-${source.id}`);
        try {
            const updated = await api.sources.update(source.id, { active: !source.active });
            setSources(prev => prev.map(s => s.id === source.id ? updated : s));
        } catch (err) {
            console.error('[AdminConfig] Toggle source failed:', err);
        } finally {
            setSaving(null);
        }
    };

    const addSource = async () => {
        const name = newSource.trim();
        if (!name) return;
        setSaving('add-source');
        try {
            const created = await api.sources.create({ name, type: 'Custom' });
            setSources(prev => [...prev, created]);
            setNewSource('');
        } catch (err) {
            console.error('[AdminConfig] Add source failed:', err);
        } finally {
            setSaving(null);
        }
    };

    const removeSource = async (id: number) => {
        setSaving(`source-del-${id}`);
        try {
            await api.sources.delete(id);
            setSources(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error('[AdminConfig] Delete source failed:', err);
        } finally {
            setSaving(null);
        }
    };

    // ─── Keyword CRUD ──────────────────────────────────────────────
    const handleAddKeyword = async () => {
        const term = newKeyword.trim();
        if (!term) return;
        setSaving('add-kw');
        try {
            const created = await api.keywords.create(term);
            setKeywords(prev => [...prev, created]);
            setNewKeyword('');
        } catch (err) {
            console.error('[AdminConfig] Add keyword failed:', err);
        } finally {
            setSaving(null);
        }
    };

    const removeKeyword = async (term: string) => {
        const kw = keywords.find(k => k.term === term);
        if (!kw) return;
        setSaving(`kw-del-${kw.id}`);
        try {
            await api.keywords.delete(kw.id);
            setKeywords(prev => prev.filter(k => k.id !== kw.id));
        } catch (err) {
            console.error('[AdminConfig] Delete keyword failed:', err);
        } finally {
            setSaving(null);
        }
    };

    const toggleKeyword = async (keyword: Keyword) => {
        setSaving(`kw-toggle-${keyword.id}`);
        try {
            const updated = await api.keywords.update(keyword.id, { active: !keyword.active });
            setKeywords(prev => prev.map(k => k.id === keyword.id ? updated : k));
        } catch (err) {
            console.error('[AdminConfig] Toggle keyword failed:', err);
        } finally {
            setSaving(null);
        }
    };

    // ─── Loading state ─────────────────────────────────────────────
    if (loading) {
        return (
            <>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="animate-spin text-muted" size={40} />
                </div>
            </>
        );
    }

    return (
        <>
            <div className="max-w-5xl mx-auto h-full flex flex-col gap-8">
                <header className="mb-4">
                    <h1 className="text-3xl font-bold text-text mb-2">System Configuration</h1>
                    <p className="text-muted">Manage data sources, intelligence rules, and system behavior.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
                    {/* ═══ Source Management ═══ */}
                    <Card className="flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-text flex items-center gap-2">
                                <Database className="text-muted" size={20} />
                                Data Sources
                            </h2>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                {sources.filter(s => s.active).length} Active
                            </span>
                        </div>

                        {/* Add Source Input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Add Forum URL or Source Name..."
                                value={newSource}
                                onChange={(e) => setNewSource(e.target.value)}
                                className="flex-1 bg-background text-text px-4 py-2 rounded-lg shadow-neumorphic-inset outline-none focus:shadow-neumorphic-pressed transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && addSource()}
                                disabled={saving === 'add-source'}
                            />
                            <Button onClick={addSource} disabled={saving === 'add-source'}>
                                {saving === 'add-source' ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                            </Button>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            <AnimatePresence>
                                {sources.map((source) => (
                                    <motion.div
                                        key={source.id}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        className="flex items-center justify-between p-3 rounded-xl bg-background shadow-neumorphic-inset"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${source.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-400'}`} />
                                            <div>
                                                <p className="font-semibold text-text text-sm">{source.name}</p>
                                                <p className="text-xs text-muted capitalize">{source.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Toggle
                                                enabled={source.active}
                                                onChange={() => toggleSource(source)}
                                                label=""
                                            />
                                            <button
                                                onClick={() => removeSource(source.id)}
                                                className="text-muted hover:text-crimson p-1 transition-colors"
                                                disabled={saving === `source-del-${source.id}`}
                                            >
                                                {saving === `source-del-${source.id}` ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </Card>

                    <div className="flex flex-col gap-8">
                        {/* ═══ Target Keywords ═══ */}
                        <Card className="flex flex-col gap-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-text">Target Keywords</h2>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    {keywords.filter(k => k.active).length} Active
                                </span>
                            </div>
                            <p className="text-sm text-muted -mt-4">Monitor specific terms across all data sources.</p>

                            {/* Add Keyword Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add keyword (e.g. 'UPI Fraud')..."
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    className="flex-1 bg-background text-text px-4 py-2 rounded-lg shadow-neumorphic-inset outline-none focus:shadow-neumorphic-pressed transition-all"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                                    disabled={saving === 'add-kw'}
                                />
                                <Button onClick={handleAddKeyword} disabled={saving === 'add-kw'}>
                                    {saving === 'add-kw' ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-2">
                                <AnimatePresence>
                                    {keywords.map((keyword) => (
                                        <motion.div
                                            key={keyword.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="flex items-center gap-2 px-3 py-2 bg-background shadow-neumorphic-inset rounded-lg group"
                                        >
                                            <div className={`w-2 h-2 rounded-full ${keyword.active ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]' : 'bg-slate-500'}`} />
                                            <span className="text-sm text-text font-medium">{keyword.term}</span>

                                            <div className="flex items-center gap-2 ml-2 border-l border-slate-700/20 dark:border-slate-700/50 pl-2">
                                                <Toggle
                                                    enabled={keyword.active}
                                                    onChange={() => toggleKeyword(keyword)}
                                                    label=""
                                                    size="sm"
                                                />
                                                <button
                                                    onClick={() => removeKeyword(keyword.term)}
                                                    className="text-muted hover:text-crimson transition-colors"
                                                    disabled={saving === `kw-del-${keyword.id}`}
                                                >
                                                    {saving === `kw-del-${keyword.id}` ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={14} />
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </Card>

                        {/* ═══ Credential Patterns ═══ */}
                        <Card className="flex flex-col gap-6 flex-1">
                            <h2 className="text-xl font-semibold text-text">Credential Patterns (RegEx)</h2>
                            <textarea
                                className="w-full h-full min-h-[150px] bg-background shadow-neumorphic-inset rounded-xl p-4 font-mono text-sm text-text outline-none resize-none focus:ring-2 focus:ring-gray-200/50"
                                defaultValue={`# API Keys\n${"sk_" + "live_"}[0-9a-zA-Z]{24}\n\n# SSH Private Keys\n-----BEGIN OPENSSH PRIVATE KEY-----\n`}
                            />
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminConfig;
