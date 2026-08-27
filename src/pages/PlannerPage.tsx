import { useState } from 'react';
import type { AppData } from '@/types';
import DailyPlanner from './planner/DailyPlanner';
import WeeklyPlanner from './planner/WeeklyPlanner';
import MonthlyPlanner from './planner/MonthlyPlanner';

interface PlannerPageProps {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
}

type Tab = 'daily' | 'weekly' | 'monthly';

export default function PlannerPage({ data, update }: PlannerPageProps) {
  const [tab, setTab] = useState<Tab>('daily');

  return (
    <div>
      {/* Tab switcher */}
      <div className="sticky top-0 z-20 bg-cream-bg/95 backdrop-blur-lg px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3">
        <div className="flex gap-2 bg-pink-soft/50 rounded-pill p-1">
          {(['daily', 'weekly', 'monthly'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-pill text-sm font-semibold capitalize transition-all ${
                tab === t ? 'bg-pink-primary text-white shadow-soft' : 'text-ink-muted'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'daily' && <DailyPlanner data={data} update={update} />}
      {tab === 'weekly' && <WeeklyPlanner data={data} update={update} />}
      {tab === 'monthly' && <MonthlyPlanner data={data} update={update} />}
    </div>
  );
}
