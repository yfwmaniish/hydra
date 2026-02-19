import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

import type { Threat } from '../../data/mockData';

interface GlobeVisualizationProps {
    threats?: Threat[];
}

const GlobeVisualization: React.FC<GlobeVisualizationProps> = ({ threats: _threats = [] }) => {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = canvas.offsetWidth;
        let height = canvas.height = canvas.offsetHeight;
        let rotation = 0;

        // Resize observer
        const resizeObserver = new ResizeObserver(() => {
            if (canvas) {
                width = canvas.width = canvas.offsetWidth;
                height = canvas.height = canvas.offsetHeight;
            }
        });
        resizeObserver.observe(canvas);

        const GLOBE_RADIUS = Math.min(width, height) * 0.35;
        const DOT_DENSITY = 40;

        // Generate sphere points
        const points: { x: number; y: number; z: number }[] = [];
        for (let i = 0; i < DOT_DENSITY; i++) {
            const lat = Math.acos(1 - 2 * (i + 0.5) / DOT_DENSITY);
            const long = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

            points.push({
                x: Math.cos(long) * Math.sin(lat),
                y: Math.sin(long) * Math.sin(lat),
                z: Math.cos(lat)
            });
        }

        const render = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            // Center
            const cx = width / 2;
            const cy = height / 2;

            // Rotate
            rotation += 0.005;

            // Draw Dots
            points.forEach(point => {
                // Rotate around Y axis
                const x = point.x * Math.cos(rotation) - point.z * Math.sin(rotation);
                const z = point.z * Math.cos(rotation) + point.x * Math.sin(rotation);
                const y = point.y;

                // Simple perspective
                const scale = 300 / (300 - z * GLOBE_RADIUS);
                const px = cx + x * GLOBE_RADIUS * scale;
                const py = cy + y * GLOBE_RADIUS * scale;

                // Draw only front-facing dots
                if (z < 0) return; // Basic culling (z goes into screen? wait, usually z+ is out) 
                // Let's assume standard right-handed: z+ out of screen.
                // If we rotate:
                // x' = x cos - z sin
                // z' = z cos + x sin
                // If z' > 0 it's in front

                const alpha = (z + 1) / 2; // Simple alpha based on Z

                ctx.beginPath();
                ctx.arc(px, py, 1.5 * scale, 0, Math.PI * 2);
                ctx.fillStyle = theme === 'dark'
                    ? `rgba(74, 222, 128, ${alpha})` // Green dots in dark mode
                    : `rgba(30, 41, 59, ${alpha})`;  // Slate dots in light
                ctx.fill();
            });

            // Draw Halo
            const gradient = ctx.createRadialGradient(cx, cy, GLOBE_RADIUS * 0.8, cx, cy, GLOBE_RADIUS * 1.2);
            gradient.addColorStop(0, 'rgba(74, 222, 128, 0)');
            gradient.addColorStop(1, 'rgba(74, 222, 128, 0.1)');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            requestAnimationFrame(render);
        };

        const animationId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationId);
            resizeObserver.disconnect();
        };
    }, [theme]);

    return (
        <div className="w-full h-64 relative bg-background rounded-2xl shadow-neumorphic-inset overflow-hidden flex items-center justify-center">
            {/* Map Grid Overlay (Decoration) */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />

            <canvas ref={canvasRef} className="w-full h-full" />

            {/* Title Overlay */}
            <div className="absolute top-4 left-6">
                <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Global Activity</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                    <span className="text-xs text-primary font-mono">LIVE MONITORING</span>
                </div>
            </div>
        </div>
    );
};

export default GlobeVisualization;
