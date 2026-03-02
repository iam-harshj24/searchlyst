import React from 'react';
import { Globe, Plus, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function EmptyProjectState({ onAddProject }) {
    return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-[var(--surface-hover)] border border-[var(--border)] rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Globe className="w-10 h-10 text-[var(--text-muted)]" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No project selected</h2>
                <p className="text-[var(--text-secondary)] text-sm mb-8 leading-relaxed">
                    Add your first project to start tracking AI visibility, generating content, and running audits.
                </p>
                <Button
                    onClick={onAddProject}
                    className="bg-red-600 hover:bg-red-700 text-[var(--text-primary)] rounded-xl h-11 px-6"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Project
                </Button>
            </div>
        </div>
    );
}