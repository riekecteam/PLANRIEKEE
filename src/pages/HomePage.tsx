import { useState, useMemo } from 'react';
import { Plus, StickyNote, CalendarPlus, NotebookPen, Clock } from 'lucide-react';
import type { AppData, Task } from '@/types';
import { greeting, formatLongDate, todayKey, formatTime } from '@/lib/dates';
import EmptyState from '@/components/EmptyState';
import TaskRow from '@/components/TaskRow';
import TaskEditor from '@/components/TaskEditor';
import ConfirmDialog from '@/components/ConfirmDialog';
import { categoryColor } from '@/lib/constants';

interface HomePageProps {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
  onQuickAdd: (type: 'task' | 'note' | 'event' | 'plan') => void;
}

export default function HomePage({ data, update, onQuickAdd }: HomePageProps) {
  const [taskEditor, setTaskEditor] = useState<{ open: boolean; task?: Task | null }>({ open: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const today = todayKey();
  const todaysTasks = useMemo(
    () =>
      data.tasks
        .filter((t) => t.date === today)
        .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99')),
    [data.tasks, today]
  );

  const completed = todaysTasks.filter((t) => t.status === 'completed').length;
  const total = todaysTasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const upcoming = todaysTasks.find((t) => t.status === 'todo' && t.time);

  const toggleTask = (id: string) =>
    update((d) => {
      const t = d.tasks.find((x) => x.id === id);
      if (t) t.status = t.status === 'completed' ? 'todo' : 'completed';
      return d;
    });

  const saveTask = (task: Task) =>
    update((d) => {
      const idx = d.tasks.findIndex((x) => x.id === task.id);
      if (idx >= 0) d.tasks[idx] = task;
      else d.tasks.push(task);
      return d;
    });

  const deleteTask = (id: string) =>
    update((d) => {
      d.tasks = d.tasks.filter((x) => x.id !== id);
      return d;
    });

  const quickActions = [
    { label: 'Add Task', Icon: Plus, type: 'task' as const, color: '#F7559D' },
    { label: 'Sticky Note', Icon: StickyNote, type: 'note' as const, color: '#FF8FC2' },
    { label: 'Event', Icon: CalendarPlus, type: 'event' as const, color: '#5B8DEF' },
    { label: 'Plan', Icon: NotebookPen, type: 'plan' as const, color: '#27AE60' },
  ];

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-ink">
          {greeting()}, {data.settings.name}! <span className="text-pink-primary">💗</span>
        </h1>
        <p className="text-ink-muted text-sm mt-1">{formatLongDate()}</p>
      </div>

      {/* Today's Progress Card */}
      <div className="card p-5 mb-5 animate-slide-up bg-gradient-to-br from-white to-pink-soft/40">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Today's Progress</p>
            <p className="text-4xl font-bold text-pink-primary mt-1">{progress}%</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-ink">{completed}/{total}</p>
            <p className="text-xs text-ink-muted">tasks done</p>
          </div>
        </div>
        <div className="h-3 bg-pink-soft rounded-full overflow-hidden">
          <div
            className="h-full bg-pink-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {upcoming && (
          <div className="flex items-center gap-2 mt-3 text-sm text-ink-muted">
            <Clock size={14} className="text-pink-primary" />
            <span>Up next: <span className="text-ink font-medium">{upcoming.title}</span> at {formatTime(upcoming.time)}</span>
          </div>
        )}
      </div>

      {/* Quick Add */}
      <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-3">Quick Add</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {quickActions.map(({ label, Icon, type, color }) => (
          <button
            key={label}
            onClick={() => onQuickAdd(type)}
            className="flex items-center gap-3 bg-cream-card rounded-2xl p-4 shadow-card active:scale-95 transition-transform"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon size={20} style={{ color }} />
            </div>
            <span className="text-sm font-semibold text-ink">{label}</span>
          </button>
        ))}
      </div>

      {/* Today's Plan */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wide">Today's Plan</h2>
        <button
          onClick={() => setTaskEditor({ open: true })}
          className="w-8 h-8 rounded-full bg-pink-primary text-white flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus size={18} />
        </button>
      </div>

      {todaysTasks.length === 0 ? (
        <EmptyState
          title="No plans yet 💗"
          subtitle="Let's make today a good day."
          actionLabel="Add Plan"
          onAction={() => setTaskEditor({ open: true })}
        />
      ) : (
        <div className="space-y-2.5">
          {todaysTasks.map((task) => (
            <div key={task.id}>
              {task.time && (
                <div className="flex items-center gap-2 mb-1.5 ml-1">
                  <span className="text-xs font-bold text-pink-primary">{formatTime(task.time)}</span>
                  <div className="flex-1 h-px bg-pink-soft" />
                </div>
              )}
              <TaskRow
                task={task}
                onToggle={toggleTask}
                onEdit={(t) => setTaskEditor({ open: true, task: t })}
                onDelete={(id) => setDeleteId(id)}
              />
            </div>
          ))}
        </div>
      )}

      <TaskEditor
        open={taskEditor.open}
        onClose={() => setTaskEditor({ open: false })}
        onSave={saveTask}
        task={taskEditor.task}
        defaultDate={today}
        defaultScope="daily"
      />
      <ConfirmDialog
        open={!!deleteId}
        message="Are you sure you want to delete this task?"
        onConfirm={() => {
          if (deleteId) deleteTask(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
