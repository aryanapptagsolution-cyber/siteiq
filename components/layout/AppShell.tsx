'use client';
import React, { useState } from 'react';
import TopNav from '@/components/layout/TopNav';
import Sidebar from '@/components/layout/Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar expanded={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex flex-col flex-1 overflow-hidden">
                <TopNav />
                <main className="flex-1 overflow-auto">{children}</main>
            </div>
        </div>
    );
}
