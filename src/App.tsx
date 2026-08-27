import { useState } from 'react';
import { Search } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useNotifications, requestNotificationPermission } from '@/lib/notifications';
import { todayKey } from '@/lib/dates';
import type { Tab } from '@/components/BottomNav';
import type { Task } from '@/types';
import BottomNav from '@/components/BottomNav';
import HomePage from '@/pages/HomePage';
import PlannerPage from '@/pages/PlannerPage';
import CalendarPage from '@/pages/CalendarPage';
import NotesPage from '@/pages/NotesPage';
import SettingsPage from '@/pages/SettingsPage';
import GlobalSearch from '@/components/GlobalSearch';
import TaskEditor from '@/components/TaskEditor';

export default function App() {
  const { data, update, replaceAll } = useStore();
  const [tab, setTab] = useState<Tab>('home');
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickTask, setQuickTask] = useState(false);

  useNotifications(data);

  // Onboarding
  if (!data.settings.onboarded) {
    return <Onboarding onDone={() => {
      update((d) => { d.settings.onboarded = true; return d; });
      requestNotificationPermission();
    }} />;
  }

  const handleQuickAdd = (type: 'task' | 'note' | 'event' | 'plan') => {
    if (type === 'task' || type === 'plan') {
      setQuickTask(true);
    } else if (type === 'note') {
      setTab('notes');
    } else if (type === 'event') {
      setTab('calendar');
    }
  };

  return (
    <div className="min-h-screen bg-cream-bg">
      {/* Top bar with search */}
      <div
        className="fixed top-0 left-0 right-0 z-30 bg-cream-bg/80 backdrop-blur-lg flex items-center justify-between px-4"
        style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(env(safe-area-inset-top) + 0px)' }}
      />

      {/* Search button — floating on home */}
      {tab === 'home' && (
        <button
          onClick={() => setSearchOpen(true)}
          className="fixed top-4 right-4 z-30 w-10 h-10 rounded-full bg-cream-card shadow-card flex items-center justify-center active:scale-90 transition-transform"
          style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
          aria-label="Search"
        >
          <Search size={20} className="text-pink-primary" />
        </button>
      )}

      {/* Page content */}
      <main className="min-h-screen pb-20 max-w-lg mx-auto">
        {tab === 'home' && <HomePage data={data} update={update} onQuickAdd={handleQuickAdd} />}
        {tab === 'planner' && <PlannerPage data={data} update={update} />}
        {tab === 'calendar' && <CalendarPage data={data} update={update} />}
        {tab === 'notes' && <NotesPage data={data} update={update} />}
        {tab === 'settings' && <SettingsPage data={data} update={update} replaceAll={replaceAll} />}
      </main>

      <BottomNav active={tab} onChange={setTab} />

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} data={data} onResultClick={() => setSearchOpen(false)} />
      <TaskEditor
        open={quickTask}
        onClose={() => setQuickTask(false)}
        onSave={(task: Task) =>
          update((d) => {
            d.tasks.push(task);
            return d;
          })
        }
        defaultDate={todayKey()}
        defaultScope="daily"
      />
    </div>
  );
}

function Onboarding({ onDone }: { onDone: () => void }) {
  return (
    <div className="min-h-screen bg-cream-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="w-28 h-28 rounded-full bg-pink-soft flex items-center justify-center mb-8 animate-scale-in">
        <svg width="56" height="56" viewBox="0 0 512 512" fill="none">
          <rect width="512" height="512" rx="112" fill="#F7559D"/>
          <rect x="104" y="120" width="304" height="272" rx="40" fill="#FFFFFF"/>
          <rect x="104" y="120" width="304" height="72" rx="40" fill="#FF8FC2"/>
          <rect x="200" y="96" width="20" height="48" rx="10" fill="#FFFFFF"/>
          <rect x="292" y="96" width="20" height="48" rx="10" fill="#FFFFFF"/>
          <line x1="156" y1="240" x2="356" y2="240" stroke="#F7559D" strokeWidth="14" stroke-linecap="round"/>
          <line x1="156" y1="288" x2="300" y2="288" stroke="#FF8FC2" strokeWidth="14" stroke-linecap="round"/>
          <line x1="156" y1="336" x2="328" y2="336" stroke="#FF8FC2" strokeWidth="14" stroke-linecap="round"/>
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-ink mb-3 animate-slide-up">
        Welcome to Planner Rieke <span className="text-pink-primary">💗</span>
      </h1>
      <p className="text-ink-muted text-base leading-relaxed max-w-xs mb-10 animate-slide-up">
        Plan your days.<br />
        Organize your thoughts.<br />
        Make room for yourself.
      </p>
      <button
        onClick={onDone}
        className="px-10 py-4 bg-pink-primary text-white rounded-pill font-semibold text-lg shadow-soft active:scale-95 transition-transform animate-scale-in"
      >
        Get Started
      </button>
    </div>
  );
}
