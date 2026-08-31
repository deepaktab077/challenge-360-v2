import React from 'react';
import { Menu, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export type ActiveView =
  | 'today'
  | 'checkin'
  | 'leaderboard'
  | 'feed'
  | 'qualifiers'
  | 'report'
  | 'analytics'
  | 'history'
  | 'beyond'
  | 'profile'
  | 'admin';

const PARTICIPANT_NAV: { id: ActiveView; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '⌂' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { id: 'feed', label: 'Community', icon: '♥' },
  { id: 'qualifiers', label: 'Qualifiers', icon: '⚡' },
  { id: 'report', label: 'Weekly Report', icon: '▤' },
  { id: 'analytics', label: 'Trends', icon: '▥' },
  { id: 'history', label: 'Calendar', icon: '▦' },
  { id: 'beyond', label: 'Beyond', icon: '∞' },
  { id: 'profile', label: 'Profile', icon: '◉' },
];

export type AdminView = 'overview' | 'participants' | 'rules' | 'events' | 'moderation' | 'analytics' | 'announcements' | 'audit' | 'integrations';

const ADMIN_NAV: { id: AdminView; label: string; icon: string }[] = [
  { id: 'overview', label: 'Admin Overview', icon: '⌂' },
  { id: 'participants', label: 'Participants', icon: '♙' },
  { id: 'rules', label: 'Score Cards', icon: '⚙' },
  { id: 'events', label: 'Events & Bonuses', icon: '◫' },
  { id: 'moderation', label: 'Proof & Moderation', icon: '✓' },
  { id: 'analytics', label: 'Analytics', icon: '▥' },
  { id: 'announcements', label: 'Announcements', icon: '✦' },
  { id: 'audit', label: 'Audit Log', icon: '⌁' },
  { id: 'integrations', label: 'Integrations', icon: '◇' },
];

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (v: ActiveView) => void;
  isAdmin?: boolean;
  onOpenAdmin: () => void;
  inAdminArea: boolean;
  activeAdminView: AdminView;
  setActiveAdminView: (v: AdminView) => void;
  myName?: string;
  onSignOut?: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isAdmin,
  onOpenAdmin,
  inAdminArea,
  activeAdminView,
  setActiveAdminView,
  myName,
  onSignOut,
  mobileOpen,
  setMobileOpen,
}) => {
  const { theme, toggleTheme } = useTheme();

  const nav = (
    <>
      <div className="brand">
        <div className="logo">360°</div>
        <div>
          <b>CHALLENGE 360°</b>
          <small>Body • Mind • Heart • Soul</small>
        </div>
      </div>

      <div className="side-nav">
        {inAdminArea
          ? ADMIN_NAV.map((item) => (
              <button
                key={item.id}
                className={activeAdminView === item.id ? 'on' : ''}
                onClick={() => {
                  setActiveAdminView(item.id);
                  setMobileOpen(false);
                }}
              >
                {item.icon} {item.label}
              </button>
            ))
          : PARTICIPANT_NAV.map((item) => (
              <button
                key={item.id}
                className={activeView === item.id ? 'on' : ''}
                onClick={() => {
                  setActiveView(item.id);
                  setMobileOpen(false);
                }}
              >
                {item.icon} {item.label}
              </button>
            ))}
      </div>

      <div className="side-bottom">
        <button
          className="btn-secondary"
          style={{ width: '100%', marginBottom: 10, background: 'transparent', color: '#fff', borderColor: '#3d4659' }}
          onClick={toggleTheme}
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-3.5 h-3.5 inline mr-1.5" /> Dark mode
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 inline mr-1.5" /> Light mode
            </>
          )}
        </button>

        {isAdmin && (
          <button className="adminswitch" onClick={onOpenAdmin}>
            {inAdminArea ? '← Participant App' : 'Admin Console'}
          </button>
        )}

        <div className="side-user">
          <b>{myName}</b>
          <div style={{ color: '#98a0b1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <span>Signed in</span>
            <button onClick={onSignOut} style={{ background: 'none', border: 'none', color: '#98a0b1', cursor: 'pointer' }} title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className={`side ${mobileOpen ? 'open' : ''}`}>{nav}</aside>
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 25 }}
        />
      )}
    </>
  );
};

export const MenuButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button className="menu-btn btn-secondary" onClick={onClick} aria-label="Open menu">
    <Menu className="w-4 h-4" />
  </button>
);
