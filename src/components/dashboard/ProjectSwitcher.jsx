import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Globe, Check } from 'lucide-react';

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
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all"
            >
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-white text-xs font-medium truncate">
                        {activeProject?.name || 'Select Project'}
                    </p>
                    <p className="text-white/30 text-[10px] truncate">
                        {activeProject?.url || 'No project selected'}
                    </p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#111] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
                    <div className="p-1.5 max-h-60 overflow-y-auto">
                        {projects.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => { onSwitch(project); setOpen(false); }}
                                className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                                    activeProject?.id === project.id
                                        ? 'bg-red-500/10 text-white'
                                        : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                                }`}
                            >
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    activeProject?.id === project.id ? 'bg-red-600' : 'bg-white/[0.06]'
                                }`}>
                                    <Globe className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-xs font-medium truncate">{project.name}</p>
                                    <p className="text-white/30 text-[10px] truncate">{project.url}</p>
                                </div>
                                {activeProject?.id === project.id && (
                                    <Check className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="border-t border-white/[0.06] p-1.5">
                        <button
                            onClick={() => { onAddNew(); setOpen(false); }}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg text-white/40 hover:bg-white/[0.04] hover:text-white transition-all"
                        >
                            <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center">
                                <Plus className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-medium">Add New Project</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}