import React from 'react';
import { Globe, ChevronDown, Plus } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function DomainSelector({ domains, selectedDomain, onSelectDomain, onAddDomain }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)] gap-2">
                    <Globe className="w-4 h-4 text-red-500" />
                    <span className="max-w-[150px] truncate">
                        {selectedDomain ? selectedDomain.name : 'Select Domain'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[var(--bg-secondary)] border-[var(--border)] w-56">
                {domains.map((domain) => (
                    <DropdownMenuItem
                        key={domain.id}
                        onClick={() => onSelectDomain(domain)}
                        className={`cursor-pointer ${selectedDomain?.id === domain.id ? 'bg-red-500/10 text-red-400' : 'text-[var(--text-primary)]'}`}
                    >
                        <div className="flex items-center gap-2 w-full">
                            <div className={`w-2 h-2 rounded-full ${domain.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            <span className="flex-1 truncate">{domain.name}</span>
                            <span className="text-xs text-[var(--text-secondary)]">{domain.visibility_score || 0}</span>
                        </div>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-[var(--border)]" />
                <DropdownMenuItem onClick={onAddDomain} className="cursor-pointer text-red-400">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Domain
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}