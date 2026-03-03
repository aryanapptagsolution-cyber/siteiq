import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SiteIQ — EV Charger Site Selection Dashboard',
  description: 'Internal enterprise tool for evaluating EV charger deployment sites using a configurable weighted scoring model.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-slate-50 antialiased">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
