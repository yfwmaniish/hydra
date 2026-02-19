import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';
import { Network, ZoomIn, ZoomOut, Maximize, RefreshCw, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { threatService } from '../../services/threatService';
import type { Entity, Link } from '../../data/mockData';

interface EntityGraphProps {
    searchTerm?: string;
    filterTypes?: Entity['type'][];
}

const EntityGraph: React.FC<EntityGraphProps> = ({ searchTerm = '', filterTypes = [] }) => {
    const { theme } = useTheme();
    const isMatrix = theme === 'matrix';
    const [nodes, setNodes] = useState<Entity[]>([]);
    const [links, setLinks] = useState<Link[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<number | null>(null);
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
    const containerRef = React.useRef<HTMLDivElement>(null);

    const centerGraph = (currentNodes: Entity[]) => {
        if (!currentNodes.length || !containerRef.current) {
            console.warn("Cannot center graph: no nodes or no container");
            return;
        }

        const padding = 50;
        const { width, height } = containerRef.current.getBoundingClientRect();
        console.log("Graph Container Size:", width, height);

        // Find bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        currentNodes.forEach(node => {
            minX = Math.min(minX, node.x - node.size);
            minY = Math.min(minY, node.y - node.size);
            maxX = Math.max(maxX, node.x + node.size);
            maxY = Math.max(maxY, node.y + node.size);
        });

        const graphWidth = maxX - minX;
        const graphHeight = maxY - minY;
        console.log("Graph Bounds:", { minX, minY, graphWidth, graphHeight });

        if (graphWidth === 0 || graphHeight === 0) return;

        // Calculate scale to fit
        const scaleX = (width - padding * 2) / graphWidth;
        const scaleY = (height - padding * 2) / graphHeight;
        let k = Math.min(scaleX, scaleY);

        // Clamp scale
        k = Math.max(0.5, Math.min(k, 2));

        // Center position
        const x = (width - graphWidth * k) / 2 - minX * k;
        const y = (height - graphHeight * k) / 2 - minY * k;

        console.log("New Transform:", { k, x, y });
        setTransform({ k, x, y });
    };

    const manualRefresh = async () => {
        console.log("MANUAL REFRESH TRIGGERED");
        // Only show loader on initial load
        if (nodes.length === 0) setLoading(true);
        try {
            const [fetchedNodes, fetchedLinks] = await Promise.all([
                threatService.getEntities(),
                threatService.getLinks()
            ]);
            setNodes(fetchedNodes);
            setLinks(fetchedLinks);

            // Auto-center after loading
            // Small timeout to ensure container ref is ready and state is set
            setTimeout(() => centerGraph(fetchedNodes), 500);

        } catch (error) {
            console.error("Failed to fetch graph data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial load
        manualRefresh();
        console.log("EntityGraph Mounted - No Helper Interval");
        // Also add listener for resize to re-center? Maybe overkill for now.
    }, []);

    const handleMouseDown = (e: React.MouseEvent, nodeId: number) => {
        e.stopPropagation();
        setDraggingId(nodeId);
        setSelectedNode(nodeId);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingId !== null) {
            const svgRect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - svgRect.left - transform.x) / transform.k;
            const y = (e.clientY - svgRect.top - transform.y) / transform.k;

            setNodes(prev => prev.map(n =>
                n.id === draggingId ? { ...n, x, y } : n
            ));
        }
    };

    const handleMouseUp = () => {
        setDraggingId(null);
    };

    const handleZoomIn = () => setTransform(t => ({ ...t, k: Math.min(t.k * 1.2, 4) }));
    const handleZoomOut = () => setTransform(t => ({ ...t, k: Math.max(t.k / 1.2, 0.25) }));
    const handleReset = () => centerGraph(nodes);
    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const filteredNodes = useMemo(() => {
        return nodes.filter(node => {
            const matchesSearch = node.label.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterTypes.length === 0 || filterTypes.includes(node.type);
            return matchesSearch && matchesType;
        });
    }, [nodes, searchTerm, filterTypes]);

    const filteredLinks = useMemo(() => {
        const nodeIds = new Set(filteredNodes.map(n => n.id));
        return links.filter(link => nodeIds.has(link.source) && nodeIds.has(link.target));
    }, [links, filteredNodes]);

    const getNodeColor = (type: string) => {
        if (isMatrix) return '#00ff41';
        switch (type) {
            case 'actor': return '#ef4444'; // Red
            case 'target': return '#3b82f6'; // Blue
            case 'ip': return '#f59e0b'; // Amber
            case 'credential': return '#f97316'; // Orange
            case 'domain': return '#8b5cf6'; // Violet
            default: return '#8b5cf6'; // Violet
        }
    };

    return (
        <Card className="h-[600px] flex flex-col relative overflow-hidden group" ref={containerRef as any}>
            <div className="flex justify-between items-center mb-4 z-10">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-text flex items-center gap-2">
                        <Network className="text-muted" size={20} />
                        Threat Entity Network
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        Manual Mode
                    </span>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleReset} className="p-2 hover:bg-slate-700/20 rounded-lg text-text transition-colors" title="Center Graph"><RefreshCw className="rotate-45" size={18} /></button>
                    <button onClick={handleZoomIn} className="p-2 hover:bg-slate-700/20 rounded-lg text-text transition-colors"><ZoomIn size={18} /></button>
                    <button onClick={handleZoomOut} className="p-2 hover:bg-slate-700/20 rounded-lg text-text transition-colors"><ZoomOut size={18} /></button>
                    <button onClick={manualRefresh} className="p-2 hover:bg-slate-700/20 rounded-lg text-text transition-colors" title="Refresh Data"><RefreshCw size={18} /></button>
                    <button onClick={handleFullscreen} className="p-2 hover:bg-slate-700/20 rounded-lg text-text transition-colors"><Maximize size={18} /></button>
                </div>
            </div>

            <div className="flex-1 relative cursor-move bg-slate-900/20 rounded-xl overflow-hidden border border-slate-700/30">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <svg
                        className="w-full h-full"
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
                            <AnimatePresence>
                                {/* Render Links */}
                                {filteredLinks.map((link) => {
                                    const start = filteredNodes.find(n => n.id === link.source);
                                    const end = filteredNodes.find(n => n.id === link.target);
                                    if (!start || !end) return null;

                                    return (
                                        <motion.line
                                            key={`link-${link.source}-${link.target}`}
                                            x1={start.x}
                                            y1={start.y}
                                            x2={end.x}
                                            y2={end.y}
                                            stroke={isMatrix ? '#003300' : '#475569'}
                                            strokeWidth="2"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 0.6 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    );
                                })}

                                {/* Render Nodes */}
                                {filteredNodes.map((node) => (
                                    <motion.g
                                        key={node.id}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        onMouseDown={(e) => handleMouseDown(e, node.id)}
                                        className="cursor-pointer hover:opacity-80"
                                    >
                                        <circle
                                            cx={node.x}
                                            cy={node.y}
                                            r={node.size / 2}
                                            fill={getNodeColor(node.type)}
                                            stroke={selectedNode === node.id ? '#ffffff' : 'none'}
                                            strokeWidth="3"
                                            className="transition-all duration-300 shadow-lg"
                                            style={{ filter: isMatrix ? 'drop-shadow(0 0 5px #00ff41)' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
                                        />
                                        <text
                                            x={node.x}
                                            y={node.y + node.size / 2 + 15}
                                            textAnchor="middle"
                                            className={`text-xs font-bold ${isMatrix ? 'fill-[#00ff41]' : 'fill-slate-400'} pointer-events-none`}
                                        >
                                            {node.label}
                                        </text>
                                        {selectedNode === node.id && (
                                            <circle
                                                cx={node.x}
                                                cy={node.y}
                                                r={node.size / 2 + 5}
                                                fill="none"
                                                stroke={isMatrix ? '#00ff41' : '#ffffff'}
                                                strokeWidth="1"
                                                strokeDasharray="4 4"
                                                className="animate-spin-slow"
                                            />
                                        )}
                                    </motion.g>
                                ))}
                            </AnimatePresence>
                        </g>
                    </svg>
                )}

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-md p-3 rounded-lg border border-slate-700/30 flex flex-col gap-2 shadow-lg pointer-events-none">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isMatrix ? 'bg-[#00ff41]' : 'bg-red-500'}`} />
                        <span className="text-xs text-muted">Threat Actor</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isMatrix ? 'bg-[#00ff41]' : 'bg-blue-500'}`} />
                        <span className="text-xs text-muted">Target Sector</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isMatrix ? 'bg-[#00ff41]' : 'bg-amber-500'}`} />
                        <span className="text-xs text-muted">IP Address</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isMatrix ? 'bg-[#00ff41]' : 'bg-violet-500'}`} />
                        <span className="text-xs text-muted">Domain</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isMatrix ? 'bg-[#00ff41]' : 'bg-orange-500'}`} />
                        <span className="text-xs text-muted">Credential</span>
                    </div>
                </div>

                {/* Node Details Panel */}
                <AnimatePresence>
                    {selectedNode && (
                        <motion.div
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            className="absolute top-4 right-4 w-64 bg-background/90 backdrop-blur-xl p-4 rounded-xl border border-slate-700/50 shadow-2xl z-20"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-text">Entity Details</h3>
                                <button onClick={() => setSelectedNode(null)} className="text-muted hover:text-text">
                                    &times;
                                </button>
                            </div>
                            {(() => {
                                const node = nodes.find(n => n.id === selectedNode);
                                if (!node) return null;
                                return (
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="text-muted block text-xs uppercase">Name</span>
                                            <span className="text-primary font-mono">{node.label}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted block text-xs uppercase">Type</span>
                                            <span className="text-text capitalize">{node.type}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted block text-xs uppercase">Status</span>
                                            <span className="text-green-500">{node.status || 'Active Monitoring'}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Card>
    );
};

export default EntityGraph;
