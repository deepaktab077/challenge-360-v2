import React, { useState } from 'react';
import { ListChecks } from 'lucide-react';
import { DailyLog } from '../types';
import { getTodayRemaining, getWeekRemaining } from '../services/whatsLeftService';

interface WhatsLeftProps {
  currentLog: DailyLog;
  dailyLogs: Record<string, DailyLog>;
}

export function WhatsLeft({ currentLog, dailyLogs }: WhatsLeftProps) {
  const [tab, setTab] = useState<'today' | 'week'>('today');

  const todayItems = getTodayRemaining(currentLog);
  const weekItems = getWeekRemaining(dailyLogs, currentLog);
  const items = tab === 'today' ? todayItems : weekItems;

  return (
    <div className="card">
      <div className="ey" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <ListChecks className="w-3.5 h-3.5" /> WHAT'S LEFT?
      </div>
      <h2>{tab === 'today' ? "Today's remaining tasks" : "This week's remaining progress"}</h2>

      <div className="choices" style={{ margin: '8px 0' }}>
        <button className={`choice ${tab === 'today' ? 'on' : ''}`} onClick={() => setTab('today')}>
          Today {todayItems.length > 0 ? `(${todayItems.length})` : ''}
        </button>
        <button className={`choice ${tab === 'week' ? 'on' : ''}`} onClick={() => setTab('week')}>
          This Week {weekItems.length > 0 ? `(${weekItems.length})` : ''}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="notice good">
          {tab === 'today' ? "You've hit full points on everything today. 🎉" : 'Every weekly milestone is on track. 🎉'}
        </div>
      ) : (
        <div>
          {items.map((item) => (
            <div key={item.label} className="list-row" style={{ borderTop: '1px solid var(--line)' }}>
              <div className="grow">
                <b style={{ fontSize: 13, color: 'var(--ink)' }}>{item.label}</b>
                <div className="sub">{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
