import React from 'react';
import { Search, Filter } from 'lucide-react';

const FilterBar: React.FC = () => {
    return (
        <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                    type="text"
                    placeholder="Search alerts..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-background shadow-neumorphic-inset outline-none text-text placeholder-muted transition-all focus:shadow-neumorphic-pressed"
                />
            </div>
            <button className="px-4 py-2 rounded-xl bg-background shadow-neumorphic text-muted font-medium flex items-center gap-2 active:shadow-neumorphic-pressed transition-all">
                <Filter size={18} />
                <span>Filter</span>
            </button>
            <select className="px-4 py-2 rounded-xl bg-background shadow-neumorphic text-muted font-medium outline-none cursor-pointer active:shadow-neumorphic-pressed transition-all appearance-none">
                <option>Sort by Severity</option>
                <option>Sort by Time</option>
                <option>Sort by Status</option>
            </select>
        </div>
    );
};

export default FilterBar;
