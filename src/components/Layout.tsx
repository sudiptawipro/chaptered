import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import OmniSearch from './OmniSearch';
import QuickAdd from './QuickAdd';
import { ToastProvider } from './Toast';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

interface LayoutProps {
  children: ReactNode;
}

function LayoutInner({ children }: LayoutProps) {
  const { theme } = useTheme();

  return (
    <div className="flex min-h-screen bg-bg text-text font-sans relative">

      {/* ── Liquid Glass Background Orbs ──────────────────────────────────
          Fixed layer at z-0. These colored blobs are what glass card
          surfaces blur and tint — the core of the liquid glass effect.
          In light mode they're slightly more muted (.bg-orb class dims them).
      ─────────────────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Pink / accent orb — top-left */}
        <div
          className="bg-orb"
          style={{
            position: 'absolute',
            top: '-15%', left: '-8%',
            width: '650px', height: '650px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,107,157,0.9) 0%, transparent 68%)',
            filter: 'blur(90px)',
            opacity: theme === 'light' ? 0.12 : 0.18,
          }}
        />
        {/* Purple orb — bottom-right */}
        <div
          className="bg-orb"
          style={{
            position: 'absolute',
            bottom: '-12%', right: '-6%',
            width: '720px', height: '720px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.9) 0%, transparent 68%)',
            filter: 'blur(110px)',
            opacity: theme === 'light' ? 0.1 : 0.16,
          }}
        />
        {/* Cyan orb — mid-right */}
        <div
          className="bg-orb"
          style={{
            position: 'absolute',
            top: '35%', right: '15%',
            width: '480px', height: '480px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.9) 0%, transparent 68%)',
            filter: 'blur(80px)',
            opacity: theme === 'light' ? 0.07 : 0.1,
          }}
        />
        {/* Gold orb — lower-center */}
        <div
          className="bg-orb"
          style={{
            position: 'absolute',
            top: '65%', left: '28%',
            width: '360px', height: '360px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251,191,36,0.9) 0%, transparent 68%)',
            filter: 'blur(80px)',
            opacity: theme === 'light' ? 0.06 : 0.09,
          }}
        />
        {/* Green orb — far left, mid */}
        <div
          className="bg-orb"
          style={{
            position: 'absolute',
            top: '48%', left: '-4%',
            width: '320px', height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(61,237,122,0.9) 0%, transparent 68%)',
            filter: 'blur(70px)',
            opacity: theme === 'light' ? 0.06 : 0.08,
          }}
        />
      </div>

      {/* ── App Shell ───────────────────────────────────────────────────── */}
      <Sidebar />
      <main className="flex-1 ml-[240px] p-8 relative z-10">
        {children}
      </main>
      <OmniSearch />
      <QuickAdd />
    </div>
  );
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <LayoutInner>{children}</LayoutInner>
      </ToastProvider>
    </ThemeProvider>
  );
}
