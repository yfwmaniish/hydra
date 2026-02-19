import React, { useState } from 'react';

import EntityGraph from '../components/ui/EntityGraph';
import Card from '../components/ui/Card';
import { Search, Filter, Share2, Download } from 'lucide-react';
import Button from '../components/ui/Button';
import type { Entity } from '../data/mockData';

const Investigation: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<Entity['type'][]>(['actor', 'ip', 'domain', 'target', 'credential']);
    const [timeRange, setTimeRange] = useState('24h');
    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
    };

    const handleExport = () => {
        const reportData = {
            timestamp: new Date().toISOString(),
            filters: selectedTypes,
            timeRange,
            search: searchTerm,
            // In a real app we'd pass the current graph data here too
            note: "Investigation Report"
        };
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `investigation-report-${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <div className="max-w-7xl mx-auto h-full flex flex-col gap-6">
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-text mb-2">Investigation Board</h1>
                        <p className="text-muted">Analyze relationships between entities and threats.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={handleShare}><Share2 size={18} className="mr-2" />Share</Button>
                        <Button variant="primary" onClick={handleExport}><Download size={18} className="mr-2" />Export Report</Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                    {/* Sidebar / Filters */}
                    <Card className="lg:col-span-1 flex flex-col gap-6">
                        <div className="flex items-center gap-2 text-text font-semibold border-b border-slate-700/50 pb-4">
                            <Filter size={18} />
                            Filters
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                            <input
                                type="text"
                                placeholder="Search entities..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-background shadow-neumorphic-inset rounded-lg text-sm text-text outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-muted uppercase font-bold">Node Type</label>
                            <div className="flex flex-col gap-2">
                                {['actor', 'ip', 'domain', 'target', 'credential'].map((type) => (
                                    <label key={type} className="flex items-center gap-2 text-sm text-text cursor-pointer hover:text-primary capitalise">
                                        <input
                                            type="checkbox"
                                            checked={selectedTypes.includes(type as any)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedTypes([...selectedTypes, type as any]);
                                                } else {
                                                    setSelectedTypes(selectedTypes.filter(t => t !== type));
                                                }
                                            }}
                                            className="accent-primary"
                                        />
                                        {type === 'ip' ? 'IP Address' : type.charAt(0).toUpperCase() + type.slice(1)}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-muted uppercase font-bold">Time Range</label>
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="w-full bg-background text-text text-sm p-2 rounded-lg shadow-neumorphic-inset outline-none"
                            >
                                <option value="24h">Last 24 Hours</option>
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                            </select>
                        </div>
                    </Card>

                    {/* Main Graph Area */}
                    <div className="lg:col-span-3 h-full min-h-[500px]">
                        <EntityGraph
                            searchTerm={searchTerm}
                            filterTypes={selectedTypes}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default Investigation;
