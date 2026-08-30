import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './contexts/AuthContext';
import {
  loadAllDailyLogs,
  saveDailyLog,
  loadAllGroupWorkouts,
  addGroupWorkout,
  deleteGroupWorkout,
  loadAllCharityRecords,
  saveCharityRecord,
  loadHealthReports,
  addHealthReport,
  deleteHealthReport,
  fetchAllTeams,
} from './services/dataService';
import { DailyLog, GroupWorkout, MonthlyCharityRecord, HealthReport, Team } from './types';
import { getTodayDateStr, getMonthKey, getWeekRange, addDays } from './utils/dateUtils';
import { calculateDailyScore, createEmptyDailyLog, MORNING_WORKOUT_BONUS_POINTS } from './constants/rules';

import { Navbar, ActiveView } from './components/Navbar';
import { DateNavigator } from './components/DateNavigator';
import { ScoreOverviewBanner } from './components/ScoreOverviewBanner';
import { DailyScorecard } from './components/DailyScorecard';
import { HealthReportUpload } from './components/HealthReportUpload';
import { AnalyticsView } from './components/AnalyticsView';
import { HistoryCalendarView } from './components/HistoryCalendarView';
import { GroupWorkoutModal } from './components/GroupWorkoutModal';
import { MonthlyCharityModal } from './components/MonthlyCharityModal';
import { RulebookModal } from './components/RulebookModal';
import { ExportImportModal } from './components/ExportImportModal';
import { CompleteProfileModal } from './components/CompleteProfileModal';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AdminPanel } from './pages/AdminPanel';
import { Leaderboard } from './pages/Leaderboard';
import { Feed } from './pages/Feed';

export default function App() {
  const { session, profile, isAdmin, loading, allProfiles, actingUserId, actingProfile, setActingUserId, signOut } =
    useAuth();

  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  // State
  const [dailyLogs, setDailyLogs] = useState<Record<string, DailyLog>>({});
  const [groupWorkouts, setGroupWorkouts] = useState<GroupWorkout[]>([]);
  const [charityRecords, setCharityRecords] = useState<MonthlyCharityRecord[]>([]);
  const [healthReports, setHealthReports] = useState<HealthReport[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [activeView, setActiveView] = useState<ActiveView>('today');

  // Modals
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isCharityModalOpen, setIsCharityModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const targetUserId = actingUserId || profile?.id || null;

  // Load data whenever the acting (viewed) user changes
  const reloadData = useCallback(async () => {
    if (!targetUserId) return;
    const [logs, workouts, charities, reports] = await Promise.all([
      loadAllDailyLogs(targetUserId),
      loadAllGroupWorkouts(targetUserId),
      loadAllCharityRecords(targetUserId),
      loadHealthReports(targetUserId),
    ]);
    setDailyLogs(logs);
    setGroupWorkouts(workouts);
    setCharityRecords(charities);
    setHealthReports(reports);
  }, [targetUserId]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  useEffect(() => {
    fetchAllTeams().then(setTeams);
  }, []);

  const myTeamName = useMemo(
    () => teams.find((t) => t.id === (actingProfile?.teamId ?? profile?.teamId))?.name || null,
    [teams, actingProfile, profile]
  );

  // Active Daily Log
  const currentLog = useMemo(() => {
    return dailyLogs[selectedDate] || createEmptyDailyLog(selectedDate);
  }, [dailyLogs, selectedDate]);

  // Current Score Breakdown
  const currentScoreBreakdown = useMemo(() => calculateDailyScore(currentLog), [currentLog]);

  // Active Month & Active Week
  const activeMonthKey = useMemo(() => getMonthKey(selectedDate), [selectedDate]);
  const activeWeek = useMemo(() => getWeekRange(selectedDate), [selectedDate]);

  // Monthly charity record for active month
  const currentCharityRecord = useMemo(
    () => charityRecords.find((c) => c.monthKey === activeMonthKey),
    [charityRecords, activeMonthKey]
  );

  // Weekly group workouts — morning workout bonus is capped at ONE award (+50) per week
  const thisWeekWorkouts = useMemo(
    () => groupWorkouts.filter((w) => activeWeek.days.includes(w.date)),
    [groupWorkouts, activeWeek]
  );
  const thisWeekHasMorningWorkout = thisWeekWorkouts.some((w) => w.isMorning);
  const thisWeekWorkoutBonus = thisWeekHasMorningWorkout ? MORNING_WORKOUT_BONUS_POINTS : 0;

  // Streak Calculation
  const currentStreak = useMemo(() => {
    const todayStr = getTodayDateStr();
    let streak = 0;
    let checkDate = todayStr;
    const todayScore = calculateDailyScore(dailyLogs[todayStr]);
    if (todayScore.totalDailyScore === 0) checkDate = addDays(todayStr, -1);
    while (true) {
      const score = calculateDailyScore(dailyLogs[checkDate]);
      if (score.totalDailyScore > 0) {
        streak++;
        checkDate = addDays(checkDate, -1);
      } else break;
    }
    return streak;
  }, [dailyLogs]);

  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#6366f1', '#f43f5e', '#f59e0b', '#fbbf24'],
      });
    } catch {
      // safe fallback
    }
  }, []);

  const handleUpdateLog = useCallback(
    async (updatedLog: DailyLog) => {
      if (!targetUserId) return;
      const prevScore = calculateDailyScore(dailyLogs[updatedLog.date]);
      const nextScore = calculateDailyScore(updatedLog);
      if (!prevScore.allDimensionsCompleted && nextScore.allDimensionsCompleted) {
        triggerConfetti();
      }
      setDailyLogs((prev) => ({ ...prev, [updatedLog.date]: updatedLog }));
      await saveDailyLog(targetUserId, updatedLog, actingProfile?.fullName || profile?.fullName);
    },
    [dailyLogs, triggerConfetti, targetUserId]
  );

  const handleResetDay = useCallback(() => {
    handleUpdateLog(createEmptyDailyLog(selectedDate));
  }, [selectedDate, handleUpdateLog]);

  const handleAddWorkout = useCallback(
    async (workout: Omit<GroupWorkout, 'id' | 'createdAt'>) => {
      if (!targetUserId) return;
      const created = await addGroupWorkout(targetUserId, workout);
      setGroupWorkouts((prev) => [created, ...prev]);
    },
    [targetUserId]
  );

  const handleDeleteWorkout = useCallback(
    async (id: string) => {
      if (!targetUserId) return;
      await deleteGroupWorkout(targetUserId, id);
      setGroupWorkouts((prev) => prev.filter((w) => w.id !== id));
    },
    [targetUserId]
  );

  const handleSaveCharityRecord = useCallback(
    async (record: MonthlyCharityRecord) => {
      if (!targetUserId) return;
      await saveCharityRecord(targetUserId, record);
      setCharityRecords((prev) => {
        const idx = prev.findIndex((r) => r.monthKey === record.monthKey);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = record;
          return next;
        }
        return [record, ...prev];
      });
    },
    [targetUserId]
  );

  const handleAddHealthReport = useCallback(
    async (report: Omit<HealthReport, 'id' | 'uploadedAt'>) => {
      if (!targetUserId) return;
      const created = await addHealthReport(targetUserId, report);
      setHealthReports((prev) => [created, ...prev]);
    },
    [targetUserId]
  );

  const handleDeleteHealthReport = useCallback(
    async (id: string) => {
      if (!targetUserId) return;
      await deleteHealthReport(targetUserId, id);
      setHealthReports((prev) => prev.filter((r) => r.id !== id));
    },
    [targetUserId]
  );

  // --- Auth gating -----------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (!session) {
    return authView === 'login' ? (
      <Login onSwitchToSignup={() => setAuthView('signup')} />
    ) : (
      <Signup onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  if (profile && !profile.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-lg font-bold text-slate-100 mb-2">Account Disabled</h1>
          <p className="text-sm text-slate-500 mb-6">
            Your account has been disabled by an admin. Contact your challenge admin for help.
          </p>
          <button onClick={signOut} className="text-sm font-semibold text-indigo-600 hover:underline">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const needsTeamCompletion = !!profile && profile.role === 'user' && !profile.teamId;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-600 selection:text-white flex flex-col justify-between">
      {needsTeamCompletion && profile && (
        <CompleteProfileModal userId={profile.id} currentName={profile.fullName} onDone={reloadData} />
      )}

      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        openRulesModal={() => setIsRulesModalOpen(true)}
        openWorkoutModal={() => setIsWorkoutModalOpen(true)}
        openCharityModal={() => setIsCharityModalOpen(true)}
        openExportModal={() => setIsExportModalOpen(true)}
        currentStreak={currentStreak}
        currentCharityQualified={currentCharityRecord?.completed ?? false}
        thisWeekWorkoutBonus={thisWeekWorkoutBonus}
        isAdmin={isAdmin}
        myName={actingProfile?.fullName || profile?.fullName}
        myTeamName={myTeamName}
        onSignOut={signOut}
        allProfiles={allProfiles}
        actingUserId={actingUserId}
        onSwitchActingUser={(id) => {
          setActingUserId(id);
          setActiveView('today');
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
        {isAdmin && actingUserId && actingUserId !== profile?.id && (
          <div className="mb-4 flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs font-semibold px-4 py-2.5 rounded-xl">
            <span>
              Viewing & editing <strong>{actingProfile?.fullName || actingProfile?.email}</strong>'s scorecard as
              admin.
            </span>
            <button onClick={() => setActingUserId(profile!.id)} className="underline hover:no-underline">
              Back to my own data
            </button>
          </div>
        )}

        {activeView === 'today' && (
          <div className="animate-fadeIn space-y-6">
            <DateNavigator selectedDate={selectedDate} onSelectDate={setSelectedDate} dailyLogs={dailyLogs} />

            <ScoreOverviewBanner
              scoreBreakdown={currentScoreBreakdown}
              onMarkAllComplete={() => {}}
              onResetDay={handleResetDay}
              onTriggerConfetti={triggerConfetti}
            />

            <DailyScorecard
              currentLog={currentLog}
              onUpdateLog={handleUpdateLog}
              openCharityModal={() => setIsCharityModalOpen(true)}
              currentCharityRecord={currentCharityRecord}
              monthKey={activeMonthKey}
            />

            <HealthReportUpload
              date={selectedDate}
              reports={healthReports}
              onAdd={handleAddHealthReport}
              onDelete={handleDeleteHealthReport}
            />
          </div>
        )}

        {activeView === 'leaderboard' && <Leaderboard />}

        {activeView === 'feed' && <Feed />}

        {activeView === 'analytics' && (
          <AnalyticsView
            dailyLogs={dailyLogs}
            groupWorkouts={groupWorkouts}
            charityRecords={charityRecords}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setActiveView('today');
            }}
          />
        )}

        {activeView === 'history' && (
          <HistoryCalendarView
            dailyLogs={dailyLogs}
            onSelectDateAndSwitch={(d) => {
              setSelectedDate(d);
              setActiveView('today');
            }}
          />
        )}

        {activeView === 'admin' && isAdmin && (
          <AdminPanel
            onViewUserData={(userId) => {
              setActingUserId(userId);
              setActiveView('today');
            }}
          />
        )}
      </main>

      <footer className="hidden md:block border-t border-slate-800 bg-slate-900 py-6 text-center text-xs text-slate-500 shadow-sm mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-2">
          <p className="font-bold text-slate-300">Challenge 360° • Body · Mind · Heart · Soul</p>
          <p className="text-[11px] text-slate-400">
            Body (40) + Mind (20) + Heart (10) + Soul (10) = 80 • +5 Complete Day Bonus (85 Max/Day) • +50 Morning
            Group Workout Bonus (once/week)
          </p>
        </div>
      </footer>

      <RulebookModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />

      <GroupWorkoutModal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        selectedDate={selectedDate}
        workouts={groupWorkouts}
        onAddWorkout={handleAddWorkout}
        onDeleteWorkout={handleDeleteWorkout}
        weekAlreadyHasBonus={thisWeekHasMorningWorkout}
      />

      <MonthlyCharityModal
        isOpen={isCharityModalOpen}
        onClose={() => setIsCharityModalOpen(false)}
        monthKey={activeMonthKey}
        charityRecords={charityRecords}
        onSaveCharityRecord={handleSaveCharityRecord}
      />

      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onDataImported={reloadData}
        userId={targetUserId || ''}
      />
    </div>
  );
}
