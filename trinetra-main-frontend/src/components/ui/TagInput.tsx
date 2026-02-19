import React, { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TagInputProps {
    tags: string[];
    onAdd: (tag: string) => void;
    onRemove: (tag: string) => void;
    placeholder?: string;
    className?: string;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onAdd, onRemove, placeholder = "Add tag...", className = "" }) => {
    const [input, setInput] = useState('');

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && input.trim()) {
            e.preventDefault();
            if (!tags.includes(input.trim())) {
                onAdd(input.trim());
            }
            setInput('');
        }
    };

    return (
        <div className={`flex flex-wrap gap-2 p-2 bg-background shadow-neumorphic-inset rounded-xl min-h-[50px] ${className}`}>
            <AnimatePresence>
                {tags.map((tag) => (
                    <motion.span
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1 px-3 py-1 bg-background shadow-neumorphic rounded-lg text-sm text-text font-medium group"
                    >
                        {tag}
                        <button
                            onClick={() => onRemove(tag)}
                            className="text-muted hover:text-crimson transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </motion.span>
                ))}
            </AnimatePresence>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? placeholder : ""}
                className="flex-1 min-w-[120px] bg-transparent outline-none text-text px-2 text-sm placeholder-muted"
            />
        </div>
    );
};

export default TagInput;
