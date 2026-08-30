import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  Users,
  Heart,
  BookMarked,
  BarChart3,
  Calendar,
  Download,
  Shield,
  LogOut,
  UserCircle2,
  Medal,
  Menu,
  X,
  LayoutGrid,
  MessageCircle,
} from 'lucide-react';
import { UserProfile } from '../types';

export type ActiveView = 'today' | 'analytics' | 'history' | 'admin' | 'leaderboard' | 'feed';

interface NavbarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  openRulesModal: () => void;
  openWorkoutModal: () => void;
  openCharityModal: () => void;
  openExportModal: () => void;
  currentStreak: number;
  currentCharityQualified: boolean;
  thisWeekWorkoutBonus: number;
  isAdmin?: boolean;
  myName?: string;
  myTeamName?: string | null;
  onSignOut?: () => void;
  allProfiles?: UserProfile[];
  actingUserId?: string | null;
  onSwitchActingUser?: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  openRulesModal,
  openWorkoutModal,
  openCharityModal,
  openExportModal,
  currentStreak,
  currentCharityQualified,
  thisWeekWorkoutBonus,
  isAdmin,
  myName,
  myTeamName,
  onSignOut,
  allProfiles,
  actingUserId,
  onSwitchActingUser,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItem = (view: ActiveView, label: string, Icon: React.ElementType) => (
    <button
      id={`view-${view}-btn`}
      onClick={() => setActiveView(view)}
      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1 ${
        activeView === view ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-400 hover:text-slate-100'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo & Identity */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveView('today')}>
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 shadow-sm shadow-indigo-200 flex items-center justify-center text-white">
                <Trophy className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-indigo-300 flex items-center gap-1.5">
                  CHALLENGE 360°
                  <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    85 Max/Day
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium hidden sm:block">
                  Body · Mind · Heart · Soul{myTeamName ? ` · ${myTeamName}` : ''}
                </p>
              </div>
            </div>

            {/* Quick Stats Badges — desktop only */}
            <div className="hidden lg:flex items-center space-x-2 xl:space-x-3">
              <div
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-800 text-xs text-slate-300 shadow-sm"
                title="Consecutive days logged"
              >
                <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'text-orange-500' : 'text-slate-400'}`} />
                <span className="font-bold text-slate-100">{currentStreak}</span>
                <span className="text-slate-500 font-medium">day streak</span>
              </div>

              <button
                onClick={openWorkoutModal}
                id="weekly-workout-badge-btn"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/15 transition-colors text-xs text-indigo-200 shadow-sm"
                title="Click to view & log group workouts"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-medium text-slate-400">Weekly Workout:</span>
                <span className="font-black text-indigo-400">+{thisWeekWorkoutBonus} pts</span>
              </button>

              <button
                onClick={openCharityModal}
                id="charity-qualifier-badge-btn"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs transition-colors border shadow-sm ${
                  currentCharityQualified
                    ? 'bg-pink-500/10 border-pink-500/30 text-pink-200 hover:bg-pink-500/15'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
                title="Click to manage monthly charity qualifier"
              >
                <Heart className={`w-3.5 h-3.5 ${currentCharityQualified ? 'text-pink-600 fill-pink-600' : 'text-slate-400'}`} />
                <span className="font-medium text-slate-400">Charity:</span>
                <span className={`font-bold ${currentCharityQualified ? 'text-pink-400' : 'text-orange-600'}`}>
                  {currentCharityQualified ? 'Qualified ✓' : 'Pending'}
                </span>
              </button>
            </div>

            {/* Navigation & Actions — desktop */}
            <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              {isAdmin && allProfiles && allProfiles.length > 0 && (
                <select
                  value={actingUserId || ''}
                  onChange={(e) => onSwitchActingUser?.(e.target.value)}
                  className="hidden xl:block text-xs font-semibold border border-slate-800 rounded-lg px-2 py-1.5 bg-slate-900 text-slate-300 max-w-[150px]"
                  title="View/edit as participant"
                >
                  {allProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName || p.email}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-800">
                {navItem('today', 'Scorecard', LayoutGrid)}
                {navItem('leaderboard', 'Leaderboard', Medal)}
                {navItem('feed', 'Feed', MessageCircle)}
                {navItem('analytics', 'Analytics', BarChart3)}
                {navItem('history', 'Calendar', Calendar)}
                {isAdmin && navItem('admin', 'Admin', Shield)}
              </div>

              <button
                id="open-rules-btn"
                onClick={openRulesModal}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-800 rounded-xl transition-colors"
                title="View Official Rules & Point System"
              >
                <BookMarked className="w-5 h-5" />
              </button>

              <button
                id="open-export-btn"
                onClick={openExportModal}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-800 rounded-xl transition-colors"
                title="Export CSV / JSON Backup"
              >
                <Download className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-slate-800">
                <div className="flex items-center gap-1 text-xs text-slate-500" title={myName}>
                  <UserCircle2 className="w-4 h-4" />
                  <span className="max-w-[90px] truncate font-medium">{myName}</span>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-800 rounded-xl transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile: streak + hamburger */}
            <div className="flex lg:hidden items-center gap-2">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-300">
                <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'text-orange-500' : 'text-slate-400'}`} />
                {currentStreak}
              </div>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 text-slate-400 hover:bg-slate-800 rounded-xl"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile sub-banner with quick badges */}
        <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-slate-900/50 border-t border-slate-800 text-xs font-medium">
          <button onClick={openWorkoutModal} className="text-indigo-400 font-bold flex items-center space-x-1">
            <Users className="w-3.5 h-3.5" />
            <span>Workout: +{thisWeekWorkoutBonus} pts</span>
          </button>
          <button
            onClick={openCharityModal}
            className={`flex items-center space-x-1 font-bold ${currentCharityQualified ? 'text-pink-400' : 'text-orange-600'}`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Charity: {currentCharityQualified ? 'Qualified ✓' : 'Pending'}</span>
          </button>
        </div>
      </header>

      {/* Mobile bottom tab bar — phone-first navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900 border-t border-slate-800 shadow-[0_-2px_10px_rgba(0,0,0,0.3)] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 gap-0.5 px-1 py-1.5">
          {[
            { view: 'today' as ActiveView, label: 'Logger', Icon: LayoutGrid },
            { view: 'leaderboard' as ActiveView, label: 'Ranks', Icon: Medal },
            { view: 'feed' as ActiveView, label: 'Feed', Icon: MessageCircle },
          ].map(({ view, label, Icon }) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-[10px] font-bold transition-colors ${
                activeView === view ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-[10px] font-bold text-slate-500"
          >
            <Menu className="w-5 h-5" />
            More
          </button>
        </div>
      </nav>

      {/* Spacer so content isn't hidden behind the fixed bottom bar */}
      <div className="lg:hidden h-16" />

      {/* Mobile slide-up menu sheet */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex items-end">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-full bg-slate-900 rounded-t-3xl p-5 pb-8 space-y-1 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserCircle2 className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-bold text-slate-200">{myName}</p>
                  {myTeamName && <p className="text-xs text-slate-400">{myTeamName}</p>}
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:bg-slate-800 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => {
                setActiveView('analytics');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-900/50 text-sm font-semibold text-slate-300"
            >
              <BarChart3 className="w-4 h-4 text-slate-400" /> Analytics
            </button>

            <button
              onClick={() => {
                setActiveView('history');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-900/50 text-sm font-semibold text-slate-300"
            >
              <Calendar className="w-4 h-4 text-slate-400" /> Calendar
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  setActiveView('admin');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-900/50 text-sm font-semibold text-slate-300"
              >
                <Shield className="w-4 h-4 text-indigo-600" /> Admin Panel
              </button>
            )}

            {isAdmin && allProfiles && allProfiles.length > 0 && (
              <div className="px-3 py-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Viewing as</label>
                <select
                  value={actingUserId || ''}
                  onChange={(e) => onSwitchActingUser?.(e.target.value)}
                  className="w-full mt-1 text-sm font-semibold border border-slate-800 rounded-lg px-2 py-2 bg-slate-900 text-slate-300"
                >
                  {allProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName || p.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => {
                openRulesModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-900/50 text-sm font-semibold text-slate-300"
            >
              <BookMarked className="w-4 h-4 text-slate-400" /> Official Rules
            </button>

            <button
              onClick={() => {
                openExportModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-900/50 text-sm font-semibold text-slate-300"
            >
              <Download className="w-4 h-4 text-slate-400" /> Export Data
            </button>

            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-rose-500/10 text-sm font-semibold text-rose-600"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
};
