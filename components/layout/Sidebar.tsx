'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutGrid, SlidersHorizontal, Layers, Map, ShieldCheck, FileText, ChevronRight, ChevronLeft, Zap
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { clsx } from 'clsx';

const NAV_ITEMS = [
    { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard', permission: null },
    { icon: SlidersHorizontal, label: 'Scoring', href: '/dashboard', permission: null },
    { icon: Layers, label: 'Presets', href: '/admin', permission: 'manage_presets' as const },
    { icon: Map, label: 'Map View', href: '/dashboard', permission: null },
    { icon: ShieldCheck, label: 'Admin', href: '/admin', permission: 'run_ingestion' as const },
    { icon: FileText, label: 'Audit Log', href: '/audit', permission: 'view_audit' as const },
];

interface Props { expanded: boolean; onToggle: () => void; }

export default function Sidebar({ expanded, onToggle }: Props) {
    const pathname = usePathname();
    const { can } = usePermissions();

    const visibleItems = NAV_ITEMS.filter(
        (item) => !item.permission || can(item.permission)
    );

    return (
        <div
            className={clsx(
                'flex flex-col bg-white border-r border-slate-200 shadow-md transition-all duration-300 z-20',
                expanded ? 'w-64' : 'w-16'
            )}
        >
            {/* Logo area */}
            <div className="flex items-center justify-center h-16 border-b border-slate-100">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                </div>
                {expanded && <span className="ml-2 font-bold text-slate-900 text-lg">SiteIQ</span>}
            </div>

            {/* Nav items */}
            <nav className="flex-1 py-4 space-y-1 px-2">
                {visibleItems.map(({ icon: Icon, label, href }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={label}
                            href={href}
                            className={clsx(
                                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            )}
                            title={!expanded ? label : undefined}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            {expanded && <span>{label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse toggle */}
            <button
                onClick={onToggle}
                className="flex items-center justify-center h-12 border-t border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
                {expanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
        </div>
    );
}
