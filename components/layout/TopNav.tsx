'use client';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, Download, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import MetroSearch from '@/components/dashboard/MetroSearch';

export default function TopNav() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const { can } = usePermissions();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        clearAuth();
        router.push('/login');
    };

    const rolePillColor: Record<string, string> = {
        admin: 'bg-red-100 text-red-700',
        planner: 'bg-indigo-100 text-indigo-700',
        analyst: 'bg-blue-100 text-blue-700',
        viewer: 'bg-slate-100 text-slate-600',
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 z-10 shadow-sm">
            {/* Logo text */}
            <div className="hidden md:flex items-baseline gap-1 shrink-0 mr-2">
                <span className="text-slate-900 text-lg font-bold">SiteIQ</span>
                <span className="text-slate-400 text-xs ml-1">EV Charger Intelligence</span>
            </div>

            {/* Metro search — center */}
            <div className="flex-1 max-w-lg mx-auto">
                <MetroSearch />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3 ml-auto">
                {can('export_csv') && (
                    <button className="hidden sm:flex items-center gap-2 h-9 px-4 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        Export Top 50
                    </button>
                )}

                <button className="relative w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full" />
                </button>

                {/* User menu */}
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center gap-2 hover:bg-slate-50 rounded-xl px-2 py-1 transition-colors"
                    >
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {user?.avatarInitials ?? 'U'}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-medium text-slate-900">{user?.name ?? 'User'}</p>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-widest ${rolePillColor[user?.role ?? 'viewer']}`}>
                                {user?.role ?? 'viewer'}
                            </span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50">
                            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                                <User className="w-4 h-4" /> Profile
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                            >
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
