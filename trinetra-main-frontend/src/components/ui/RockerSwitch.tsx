import React from 'react';

interface RockerSwitchProps {
    checked: boolean;
    onChange: () => void;
    labelOn?: string;
    labelOff?: string;
}

const RockerSwitch: React.FC<RockerSwitchProps> = ({ checked, onChange, labelOn = "EN", labelOff = "HI" }) => {
    return (
        <div className="flex items-center gap-3">
            <span className={`text-xs font-bold tracking-wider transition-colors ${!checked ? 'text-primary' : 'text-muted'}`}>
                {labelOff}
            </span>

            <label className="relative inline-block w-14 h-8">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="opacity-0 w-0 h-0 peer"
                />

                {/* Switch Body */}
                <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-slate-700 rounded shadow-inner transition-colors duration-300 peer-checked:bg-slate-700"></span>

                {/* The Rocker */}
                <span className={`
                    absolute left-1 top-1 bottom-1 w-6 bg-gradient-to-b from-slate-300 to-slate-400 rounded
                    shadow-[1px_1px_2px_rgba(0,0,0,0.5),inset_1px_1px_1px_rgba(255,255,255,0.8)]
                    transition-all duration-300
                    ${checked ? 'transform translate-x-6 bg-gradient-to-b from-primary to-green-600' : ''}
                `}>
                    {/* Grip Lines */}
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-[2px]">
                        <span className="w-2 h-[1px] bg-black/20"></span>
                        <span className="w-2 h-[1px] bg-black/20"></span>
                        <span className="w-2 h-[1px] bg-black/20"></span>
                    </span>
                </span>
            </label>

            <span className={`text-xs font-bold tracking-wider transition-colors ${checked ? 'text-primary' : 'text-muted'}`}>
                {labelOn}
            </span>
        </div>
    );
};

export default RockerSwitch;
