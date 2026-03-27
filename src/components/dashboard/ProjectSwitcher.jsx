import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Globe, Check } from 'lucide-react';

const getInitial = (name) => {
    if (!name) return 'S';
    return name.replace(/^(https?:\/\/)?(www\.)?/, '').charAt(0).toUpperCase();
};

export default function ProjectSwitcher({ projects, activeProject, onSwitch, onAddNew }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[24px] bg-[#111] border border-[#222] hover:border-[#333] hover:bg-[#1A1A1A] transition-all"
            >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E92A15] to-[#99150A] flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(233,42,21,0.3)] border border-[#ff4433]/30">
                    <span className="text-white text-[18px] font-extrabold">{getInitial(activeProject?.name || 'S')}</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-white text-[15px] font-medium truncate">
                        {activeProject?.name || 'Select Project'}
                    </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#888] transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-[20px] shadow-2xl z-50 overflow-hidden border border-[#222] bg-[#111]" style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                    <div className="p-2 max-h-60 overflow-y-auto">
                        {projects.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => { onSwitch(project); setOpen(false); }}
                                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${activeProject?.id === project.id
                                        ? 'bg-[#1A1A1A]'
                                        : 'hover:bg-[#1A1A1A]'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${activeProject?.id === project.id ? 'bg-gradient-to-br from-[#E92A15] to-[#99150A] border-[#ff4433]/30 shadow-[0_0_8px_rgba(233,42,21,0.3)]' : 'bg-[#1e1e1e] border-[#333]'}`}>
                                    <span className={`text-[14px] font-extrabold ${activeProject?.id === project.id ? 'text-white' : 'text-[#888]'}`}>{getInitial(project.name)}</span>
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-white text-[14px] font-medium truncate">{project.name}</p>
                                </div>
                                {activeProject?.id === project.id && (
                                    <Check className="w-4 h-4 text-[#E92A15] flex-shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="border-t border-[#222] p-2">
                        <button
                            onClick={() => { onAddNew(); setOpen(false); }}
                            className="w-full flex items-center gap-3 p-2 rounded-xl text-[#888] hover:bg-[#1A1A1A] hover:text-white transition-all"
                        >
                            <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center flex-shrink-0">
                                <Plus className="w-4 h-4" />
                            </div>
                            <span className="text-[14px] font-medium">Add New Project</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}