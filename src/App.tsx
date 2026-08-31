import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Download, BookMarked } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import {
  loadAllDailyLogs,
  saveDailyLog,
  shareLogToCommunity,
  loadAllGroupWorkouts,
  addGroupWorkout,
  deleteGroupWorkout,
  loadAllCharityRecords,
  saveCharityRecord,
  loadHealthReports,
  addHealthReport,
  deleteHealthReport,
  fetchAllTeams,
  fetchIndividualLeaderboard,
  fetchScoringConfig,
  fetchEarnedAchievementIds,
  recordEarnedAchievements,
} from './services/dataService';
import { DailyLog, GroupWorkout, MonthlyCharityRecord, HealthReport, Team } from './types';
import { getTodayDateStr, getMonthKey, getWeekRange, addDays } from './utils/dateUtils';
import { calculateDailyScore, createEmptyDailyLog, setScoringThresholds } from './constants/rules';
import { calculateAchievements, AchievementResult } from './services/achievementService';

import { Sidebar, MenuButton, ActiveView, AdminView } from './components/Sidebar';
import { DateNavigator } from './components/DateNavigator';
import { DailyScorecard } from './components/DailyScorecard';
import { HealthReportUpload } from './components/HealthReportUpload';
import { AnalyticsView } from './components/AnalyticsView';
import { HistoryCalendarView } from './components/HistoryCalendarView';
import { MonthlyCharityModal } from './components/MonthlyCharityModal';
import { RulebookModal } from './components/RulebookModal';
import { ExportImportModal } from './components/ExportImportModal';
import { CompleteProfileModal } from './components/CompleteProfileModal';
import { Toast } from './components/Toast';
import { AchievementModal } from './components/AchievementModal';
import { TEAMS_ENABLED } from './constants/features';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AdminPanel } from './pages/AdminPanel';
import { AdminOverview } from './pages/AdminOverview';
import { AdminStub } from './pages/AdminStub';
import { AdminScoreCards } from './pages/AdminScoreCards';
import { Leaderboard } from './pages/Leaderboard';
import { Feed } from './pages/Feed';
import { Today } from './pages/Today';
import { Qualifiers } from './pages/Qualifiers';
import { WeeklyReport } from './pages/WeeklyReport';
import { Beyond } from './pages/Beyond';
import { Profile } from './pages/Profile';
import { ResetPassword } from './pages/ResetPassword';

function isoWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const weekNumber =
    1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
  return `${target.getFullYear()}-W${weekNumber}`;
}

const PAGE_TITLES: Record<ActiveView, [string, string]> = {
  today: ['Today', 'Your complete well-being, in one view.'],
  checkin: ['Daily Check-in', 'Log once. Let the app calculate the rest.'],
  leaderboard: ['Leaderboard', 'Compete on points — and on balance.'],
  feed: ['Community', 'Positive accountability, without the noise.'],
  qualifiers: ['Qualifiers', 'Protect your weekly score.'],
  report: ['Weekly Report', 'See where you are thriving and where to rebalance.'],
  analytics: ['Trends', 'Your 30-day performance history.'],
  history: ['Calendar', 'Pillar score calendar & day completion history.'],
  beyond: ['Beyond', 'Reflect • Evolve • Inspire'],
  profile: ['Profile & Privacy', 'Your challenge preferences and data.'],
  admin: ['Admin', 'Community management.'],
};

const ADMIN_TITLES: Record<AdminView, [string, string]> = {
  overview: ['Admin Overview', 'Community health at a glance.'],
  participants: ['Participants', 'Manage access and eligibility.'],
  rules: ['Score Cards', 'Edit the point values the scoring engine uses.'],
  events: ['Events & Bonuses', 'Create group activities and power bonuses.'],
  moderation: ['Proof & Moderation', 'Review evidence and score exceptions.'],
  analytics: ['Analytics', 'Participation, balance and drop-off.'],
  announcements: ['Announcements', 'Keep the community aligned.'],
  audit: ['Audit Log', 'Every privileged change, recorded.'],
  integrations: ['Integrations', 'Wearables, notifications, AI and exports.'],
};

export default function App() {
  const {
    session,
    profile,
    isAdmin,
    loading,
    actingUserId,
    actingProfile,
    setActingUserId,
    signOut,
    refreshMyProfile,
    isViewingReadOnly,
    isPasswordRecovery,
  } = useAuth();

  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [dismissedTeamPrompt, setDismissedTeamPrompt] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingToday, setSavingToday] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [achievementResult, setAchievementResult] = useState<AchievementResult | null>(null);
  const [earnedAchievementIds, setEarnedAchievementIds] = useState<Set<string>>(new Set());

  const [dailyLogs, setDailyLogs] = useState<Record<string, DailyLog>>({});
  const [groupWorkouts, setGroupWorkouts] = useState<GroupWorkout[]>([]);
  const [charityRecords, setCharityRecords] = useState<MonthlyCharityRecord[]>([]);
  const [healthReports, setHealthReports] = useState<HealthReport[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [, setScoringConfigVersion] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [activeView, setActiveView] = useState<ActiveView>('today');
  const [inAdminArea, setInAdminArea] = useState(false);
  const [activeAdminView, setActiveAdminView] = useState<AdminView>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);

  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isCharityModalOpen, setIsCharityModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const targetUserId = actingUserId || profile?.id || null;

  const reloadData = useCallback(async () => {
    if (!targetUserId) return;
    const [logs, workouts, charities, reports, earnedIds] = await Promise.all([
      loadAllDailyLogs(targetUserId),
      loadAllGroupWorkouts(targetUserId),
      loadAllCharityRecords(targetUserId),
      loadHealthReports(targetUserId),
      fetchEarnedAchievementIds(targetUserId),
    ]);
    setDailyLogs(logs);
    setGroupWorkouts(workouts);
    setCharityRecords(charities);
    setHealthReports(reports);
    setEarnedAchievementIds(earnedIds);
  }, [targetUserId]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  useEffect(() => {
    if (TEAMS_ENABLED) fetchAllTeams().then(setTeams);
  }, []);

  useEffect(() => {
    if (!session) return;
    // Load the admin's saved scoring thresholds (if any) so every
    // calculation in the app uses them from here on. Defaults apply
    // instantly while this loads, so nothing is ever blocked on it.
    fetchScoringConfig().then((config) => {
      if (config) {
        setScoringThresholds(config);
        setScoringConfigVersion((v) => v + 1); // force score recalculation with the new thresholds
      }
    });
  }, [session]);

  useEffect(() => {
    if (!profile?.id) return;
    fetchIndividualLeaderboard('all').then((entries) => {
      const mine = entries.find((e) => e.userId === (targetUserId || profile.id));
      setMyRank(mine?.rank ?? null);
    });
  }, [profile?.id, targetUserId, dailyLogs]);

  const myTeamName = useMemo(
    () => (TEAMS_ENABLED ? teams.find((t) => t.id === (actingProfile?.teamId ?? profile?.teamId))?.name || null : null),
    [teams, actingProfile, profile]
  );

  const currentLog = useMemo(() => dailyLogs[selectedDate] || createEmptyDailyLog(selectedDate), [dailyLogs, selectedDate]);
  const currentScoreBreakdown = useMemo(() => calculateDailyScore(currentLog), [currentLog]);
  const activeMonthKey = useMemo(() => getMonthKey(selectedDate), [selectedDate]);
  const activeWeek = useMemo(() => getWeekRange(selectedDate), [selectedDate]);

  const currentCharityRecord = useMemo(
    () => charityRecords.find((c) => c.monthKey === activeMonthKey),
    [charityRecords, activeMonthKey]
  );

  const thisWeekWorkouts = useMemo(() => groupWorkouts.filter((w) => activeWeek.days.includes(w.date)), [groupWorkouts, activeWeek]);
  const thisWeekMorningEntry = thisWeekWorkouts.find((w) => w.isMorning);
  const thisWeekHasMorningWorkout = !!thisWeekMorningEntry;

  const strengthSessionsThisWeek = useMemo(
    () => activeWeek.days.filter((d) => dailyLogs[d]?.body?.strengthCardioCompleted).length,
    [dailyLogs, activeWeek]
  );

  const perfectDaysThisWeek = useMemo(
    () => activeWeek.days.filter((d) => calculateDailyScore(dailyLogs[d]).completeDayBonus > 0).length,
    [dailyLogs, activeWeek]
  );

  const monthTotal = useMemo(() => {
    let sum = 0;
    for (const [date, log] of Object.entries(dailyLogs) as [string, DailyLog][]) {
      if (getMonthKey(date) === activeMonthKey) sum += calculateDailyScore(log).totalDailyScore;
    }
    return sum;
  }, [dailyLogs, activeMonthKey]);

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
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#315e56', '#3f6087', '#985365', '#725f8d', '#9a7950'] });
    } catch {
      // safe fallback
    }
  }, []);

  const handleUpdateLog = useCallback(
    async (updatedLog: DailyLog) => {
      if (!targetUserId) return;
      const prevScore = calculateDailyScore(dailyLogs[updatedLog.date]);
      const nextScore = calculateDailyScore(updatedLog);
      if (!prevScore.allDimensionsCompleted && nextScore.allDimensionsCompleted) triggerConfetti();
      setDailyLogs((prev) => ({ ...prev, [updatedLog.date]: updatedLog }));
      try {
        await saveDailyLog(targetUserId, updatedLog);
        setSaveError(null);
      } catch (err: any) {
        setSaveError(err?.message || "Couldn't save your changes — check your connection and try again.");
      }
    },
    [dailyLogs, triggerConfetti, targetUserId]
  );

  const handleSaveAndShare = useCallback(async () => {
    if (!targetUserId) return;
    setSavingToday(true);
    try {
      await saveDailyLog(targetUserId, currentLog);
      const fullName = actingProfile?.fullName || profile?.fullName || 'Participant';
      const achievementResult = calculateAchievements(dailyLogs, currentLog);
      await shareLogToCommunity(targetUserId, fullName, currentLog, achievementResult.all);
      setDailyLogs((prev) => ({ ...prev, [currentLog.date]: currentLog }));
      setSaveError(null);
      setToastMessage('Saved & shared to Community ✓');

      // Only celebrate — and only ever award once — badges the participant
      // hasn't already earned. Everything currently qualifying still gets
      // attached to today's Community post above, but the modal is reserved
      // for genuinely new unlocks so it doesn't replay on every save.
      const isNew = (tag: { id: string }) => !earnedAchievementIds.has(tag.id);
      const newlyEarned = achievementResult.all.filter(isNew);
      if (newlyEarned.length > 0) {
        await recordEarnedAchievements(targetUserId, newlyEarned.map((tag) => tag.id));
        setEarnedAchievementIds((prev) => {
          const next = new Set(prev);
          newlyEarned.forEach((tag) => next.add(tag.id));
          return next;
        });
        setAchievementResult({
          daily: achievementResult.daily.filter(isNew),
          weekly: achievementResult.weekly.filter(isNew),
          overall: achievementResult.overall.filter(isNew),
          all: newlyEarned,
        });
        triggerConfetti();
      }
    } catch (err: any) {
      setSaveError(err?.message || "Couldn't save your changes — check your connection and try again.");
    } finally {
      setSavingToday(false);
    }
  }, [targetUserId, currentLog, actingProfile, profile, dailyLogs, triggerConfetti, earnedAchievementIds]);

  const handleToggleWorkout = useCallback(async () => {
    if (!targetUserId || isViewingReadOnly) return;
    if (thisWeekMorningEntry) {
      await deleteGroupWorkout(targetUserId, thisWeekMorningEntry.id);
      setGroupWorkouts((prev) => prev.filter((w) => w.id !== thisWeekMorningEntry.id));
    } else {
      const created = await addGroupWorkout(targetUserId, {
        title: 'Morning Group Workout',
        groupName: 'Group',
        workoutType: 'Group Session',
        durationMinutes: 45,
        date: selectedDate,
        isMorning: true,
        notes: '',
      });
      setGroupWorkouts((prev) => [created, ...prev]);
    }
  }, [targetUserId, thisWeekMorningEntry, isViewingReadOnly, selectedDate]);

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

  const handleToggleCharity = useCallback(() => {
    if (isViewingReadOnly) return;
    handleSaveCharityRecord({
      id: currentCharityRecord?.id || '',
      monthKey: activeMonthKey,
      completed: !currentCharityRecord?.completed,
      title: currentCharityRecord?.title || 'Community giving',
      category: currentCharityRecord?.category || 'other',
      amountOrHours: currentCharityRecord?.amountOrHours || '',
      notes: currentCharityRecord?.notes || '',
      completedDate: getTodayDateStr(),
    });
  }, [currentCharityRecord, activeMonthKey, handleSaveCharityRecord, isViewingReadOnly]);

  const handleAddHealthReport = useCallback(
    async (report: Omit<HealthReport, 'id' | 'uploadedAt'>) => {
      if (!targetUserId) return;
      const created = await addHealthReport(targetUserId, report);
      setHealthReports((prev) => [created, ...prev]);
    },
    [targetUserId]
  );

  const handleDeleteHealthReport = useCallback(
    async (id: string, storagePath: string) => {
      if (!targetUserId) return;
      await deleteHealthReport(targetUserId, id, storagePath);
      setHealthReports((prev) => prev.filter((r) => r.id !== id));
    },
    [targetUserId]
  );

  if (loading) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="sub">Loading…</div>
      </div>
    );
  }

  if (isPasswordRecovery) {
    return <ResetPassword />;
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
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="card" style={{ maxWidth: 360, textAlign: 'center' }}>
          <h2>Account Disabled</h2>
          <p className="sub">Your account has been disabled by an admin. Contact your challenge admin for help.</p>
          <button className="btn-primary" onClick={signOut} style={{ marginTop: 10 }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const needsTeamCompletion = TEAMS_ENABLED && !!profile && profile.role === 'user' && !profile.teamId && !dismissedTeamPrompt;
  const [title, subtitle] = inAdminArea ? ADMIN_TITLES[activeAdminView] : PAGE_TITLES[activeView];

  return (
    <div className="app-shell">
      {needsTeamCompletion && profile && (
        <CompleteProfileModal
          userId={profile.id}
          currentName={profile.fullName}
          onDone={async () => {
            await refreshMyProfile();
            await reloadData();
          }}
          onDismiss={() => setDismissedTeamPrompt(true)}
        />
      )}

      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isAdmin={isAdmin}
        onOpenAdmin={() => setInAdminArea((v) => !v)}
        inAdminArea={inAdminArea}
        activeAdminView={activeAdminView}
        setActiveAdminView={setActiveAdminView}
        myName={actingProfile?.fullName || profile?.fullName}
        onSignOut={signOut}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="app-main">
        <header className="app-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <MenuButton onClick={() => setMobileOpen(true)} />
            <div className="top-brand" aria-label="Challenge 360">
              <span className="top-brand-mark">360°</span>
              <strong>CHALLENGE 360</strong>
            </div>
            <div className="top-page-title">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="btn-secondary" onClick={() => setIsRulesModalOpen(true)} title="Official rules">
              <BookMarked className="w-4 h-4" />
            </button>
            <button className="btn-secondary" onClick={() => setIsExportModalOpen(true)} title="Export data">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </header>

        <section className="app-wrap">
          {saveError && (
            <div className="notice warn" style={{ marginBottom: 14 }}>
              ⚠️ {saveError}{' '}
              <button onClick={() => setSaveError(null)} style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>
                Dismiss
              </button>
            </div>
          )}

          {isAdmin && actingUserId && actingUserId !== profile?.id && (
            <div className="notice warn" style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                Viewing &amp; editing <strong>{actingProfile?.fullName || actingProfile?.email}</strong>'s scorecard as admin.
              </span>
              <button
                onClick={() => setActingUserId(profile!.id)}
                style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Back to my own data
              </button>
            </div>
          )}

          {inAdminArea ? (
            <>
              {activeAdminView === 'overview' && <AdminOverview />}
              {activeAdminView === 'participants' && (
                <AdminPanel
                  onViewUserData={(userId) => {
                    setActingUserId(userId);
                    setInAdminArea(false);
                    setActiveView('today');
                  }}
                />
              )}
              {activeAdminView === 'rules' && <AdminScoreCards />}
              {(['events', 'moderation', 'analytics', 'announcements', 'audit', 'integrations'] as const).includes(
                activeAdminView as any
              ) && <AdminStub kind={activeAdminView as any} />}
            </>
          ) : (
            <>
              {activeView === 'today' && (
                <div className="animate-fadeIn" style={{ display: 'grid', gap: 16 }}>
                  <DateNavigator selectedDate={selectedDate} onSelectDate={setSelectedDate} dailyLogs={dailyLogs} />
                  <Today
                    currentLog={currentLog}
                    dailyLogs={dailyLogs}
                    score={currentScoreBreakdown}
                    currentStreak={currentStreak}
                    myRank={myRank}
                    monthTotal={monthTotal}
                    thisWeekWorkoutDone={thisWeekHasMorningWorkout}
                    onToggleWorkout={handleToggleWorkout}
                    perfectDaysThisWeek={perfectDaysThisWeek}
                    strengthSessionsThisWeek={strengthSessionsThisWeek}
                    onGoToCheckin={() => setActiveView('checkin')}
                    readOnly={isViewingReadOnly}
                  />
                </div>
              )}

              {activeView === 'checkin' && (
                <div className="animate-fadeIn" style={{ display: 'grid', gap: 16 }}>
                  <DateNavigator selectedDate={selectedDate} onSelectDate={setSelectedDate} dailyLogs={dailyLogs} />
                  <DailyScorecard
                    currentLog={currentLog}
                    onUpdateLog={handleUpdateLog}
                    openCharityModal={() => setIsCharityModalOpen(true)}
                    currentCharityRecord={currentCharityRecord}
                    monthKey={activeMonthKey}
                    onDone={() => setActiveView('today')}
                    onSaveAndShare={handleSaveAndShare}
                    saving={savingToday}
                    readOnly={isViewingReadOnly}
                  />
                  <HealthReportUpload
                    date={selectedDate}
                    userId={targetUserId || ''}
                    reports={healthReports}
                    onAdd={handleAddHealthReport}
                    onDelete={handleDeleteHealthReport}
                    readOnly={isViewingReadOnly}
                  />
                </div>
              )}

              {activeView === 'leaderboard' && (
                <Leaderboard
                  onEditAsAdmin={(userId) => {
                    setActingUserId(userId);
                    setActiveView('today');
                  }}
                />
              )}

              {activeView === 'feed' && <Feed />}

              {activeView === 'qualifiers' && (
                <Qualifiers
                  strengthSessionsThisWeek={strengthSessionsThisWeek}
                  charityCompleted={currentCharityRecord?.completed ?? false}
                  onToggleCharity={handleToggleCharity}
                  disqualifiedWeeksTotal={0}
                  readOnly={isViewingReadOnly}
                />
              )}

              {activeView === 'report' && <WeeklyReport dailyLogs={dailyLogs} selectedDate={selectedDate} />}

              {activeView === 'analytics' && (
                <AnalyticsView
                  dailyLogs={dailyLogs}
                  groupWorkouts={groupWorkouts}
                  charityRecords={charityRecords}
                  onSelectDate={(d) => {
                    setSelectedDate(d);
                    setActiveView('checkin');
                  }}
                />
              )}

              {activeView === 'history' && (
                <HistoryCalendarView
                  dailyLogs={dailyLogs}
                  onSelectDateAndSwitch={(d) => {
                    setSelectedDate(d);
                    setActiveView('checkin');
                  }}
                />
              )}

              {activeView === 'beyond' && targetUserId && <Beyond userId={targetUserId} weekKey={isoWeekKey(selectedDate)} />}

              {activeView === 'profile' && <Profile />}
            </>
          )}
        </section>
      </main>

      <RulebookModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />

      {achievementResult && (
        <AchievementModal result={achievementResult} onClose={() => setAchievementResult(null)} />
      )}

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

      {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}
    </div>
  );
}
