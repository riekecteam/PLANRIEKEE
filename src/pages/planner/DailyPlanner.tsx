import { useState, useMemo } from 'react';
import { Plus, Check, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AppData, Task, Mood } from '@/types';
import {
  todayKey,
  addDays,
  formatLongDate,
  weekStartKey,
  weekDays,
  shortDayName,
  dayNumber,
  monthKey,
  formatMonthYear,
  monthKeyFromDate,
} from '@/lib/dates';
import { MOODS } from '@/lib/constants';
import { uid } from '@/lib/store';
import TaskRow from '@/components/TaskRow';
import TaskEditor from '@/components/TaskEditor';
import ConfirmDialog from '@/components/ConfirmDialog';

interface DailyPlannerProps {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
}

export default function DailyPlanner({ data, update }: DailyPlannerProps) {
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [taskEditor, setTaskEditor] = useState<{ open: boolean; task?: Task | null }>({ open: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [priorityText, setPriorityText] = useState('');

  const dayTasks = useMemo(
    () =>
      data.tasks
        .filter((t) => t.date === selectedDate && t.scope === 'daily')
        .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99')),
    [data.tasks, selectedDate]
  );

  const dayPriorities = data.priorities.filter((p) => p.date === selectedDate && p.scope === 'daily');
  const dailyData = data.daily.find((d) => d.date === selectedDate);

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
      else d.tasks.push({ ...task, scope: 'daily' });
      return d;
    });

  const deleteTask = (id: string) =>
    update((d) => {
      d.tasks = d.tasks.filter((x) => x.id !== id);
      return d;
    });

  const addPriority = () => {
    if (!priorityText.trim() || dayPriorities.length >= 3) return;
    update((d) => {
      d.priorities.push({
        id: uid(),
        date: selectedDate,
        text: priorityText.trim(),
        scope: 'daily',
      });
      return d;
    });
    setPriorityText('');
  };

  const deletePriority = (id: string) =>
    update((d) => {
      d.priorities = d.priorities.filter((p) => p.id !== id);
      return d;
    });

  const getDaily = (): typeof data.daily[number] =>
    dailyData || { date: selectedDate, notes: '', mood: null, gratitude: ['', '', ''] };

  const updateDaily = (fn: (d: typeof data.daily[number]) => void) =>
    update((d) => {
      let entry = d.daily.find((x) => x.date === selectedDate);
      if (!entry) {
        entry = { date: selectedDate, notes: '', mood: null, gratitude: ['', '', ''] };
        d.daily.push(entry);
      }
      fn(entry);
      return d;
    });

  const timeBlocks = useMemo(() => {
    const blocks: { time: string; task: Task | null }[] = [];
    for (let h = 0; h < 24; h++) {
      const timeStr = `${String(h).padStart(2, '0')}:00`;
      const task = dayTasks.find((t) => t.time && t.time.startsWith(`${String(h).padStart(2, '0')}:`));
      if (task || h % 2 === 0) {
        blocks.push({ time: timeStr, task: task || null });
      }
    }
    return blocks;
  }, [dayTasks]);

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4">
      {/* Header with date picker */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-ink">Daily Planner</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            className="w-8 h-8 rounded-full bg-cream-card shadow-card flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronLeft size={18} className="text-pink-primary" />
          </button>
          <button
            onClick={() => setSelectedDate(todayKey())}
            className="px-3 py-1.5 rounded-pill bg-pink-soft text-pink-primary text-xs font-semibold active:scale-95 transition-transform"
          >
            Today
          </button>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="w-8 h-8 rounded-full bg-cream-card shadow-card flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronRight size={18} className="text-pink-primary" />
          </button>
        </div>
      </div>

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="input-field mb-5"
      />
      <p className="text-ink-muted text-sm mb-5 -mt-3">{formatLongDate(new Date(selectedDate + 'T00:00'))}</p>

      {/* Top Priorities */}
      <Section title="Top Priorities" subtitle={`${dayPriorities.length}/3`}>
        <div className="space-y-2">
          {dayPriorities.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 bg-pink-soft/50 rounded-2xl p-3">
              <span className="w-7 h-7 rounded-full bg-pink-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {i + 1}
              </span>
              <p className="flex-1 text-sm font-medium text-ink">{p.text}</p>
              <button
                onClick={() => deletePriority(p.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-ink-muted active:scale-90 transition-transform"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {dayPriorities.length < 3 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={priorityText}
                onChange={(e) => setPriorityText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPriority()}
                placeholder="Add a priority..."
                className="input-field flex-1"
              />
              <button
                onClick={addPriority}
                disabled={!priorityText.trim()}
                className="btn-primary px-4 disabled:opacity-50"
              >
                <Plus size={18} />
              </button>
            </div>
          )}
        </div>
      </Section>

      {/* To-Do List */}
      <Section
        title="To-Do List"
        action={
          <button
            onClick={() => setTaskEditor({ open: true })}
            className="w-8 h-8 rounded-full bg-pink-primary text-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <Plus size={18} />
          </button>
        }
      >
        {dayTasks.length === 0 ? (
          <p className="text-center text-ink-muted text-sm py-6">No tasks for this day yet.</p>
        ) : (
          <div className="space-y-2.5">
            {dayTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onEdit={(t) => setTaskEditor({ open: true, task: t })}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Time Block */}
      <Section title="Time Block">
        <div className="space-y-1">
          {timeBlocks.map(({ time, task }) => (
            <div key={time} className="flex items-start gap-3 py-1.5">
              <span className="text-xs font-bold text-pink-primary w-12 flex-shrink-0 mt-0.5">
                {time.slice(0, 5)}
              </span>
              {task ? (
                <div className="flex-1 bg-pink-soft/60 rounded-xl px-3 py-2">
                  <p className="text-sm font-medium text-ink">{task.title}</p>
                </div>
              ) : (
                <div className="flex-1 h-px bg-pink-soft/40 mt-3" />
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Daily Notes */}
      <Section title="Daily Notes">
        <textarea
          value={getDaily().notes}
          onChange={(e) => updateDaily((d) => { d.notes = e.target.value; })}
          placeholder="What do I want to remember today?"
          rows={3}
          className="input-field resize-none"
        />
      </Section>

      {/* Today's Mood */}
      <Section title="Today's Mood">
        <div className="flex justify-between gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => updateDaily((d) => { d.mood = m.value as Mood; })}
              className={`flex flex-col items-center gap-1 flex-1 py-3 rounded-2xl transition-all active:scale-95 ${
                getDaily().mood === m.value
                  ? 'bg-pink-primary/10 ring-2 ring-pink-primary'
                  : 'bg-pink-soft/40'
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[10px] font-medium text-ink-muted">{m.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Gratitude */}
      <Section title="Gratitude" subtitle="Today I'm grateful for...">
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-pink-soft text-pink-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </span>
              <input
                type="text"
                value={getDaily().gratitude[i]}
                onChange={(e) =>
                  updateDaily((d) => {
                    d.gratitude[i] = e.target.value;
                  })
                }
                placeholder="Something I'm grateful for..."
                className="input-field"
              />
            </div>
          ))}
        </div>
      </Section>

      <TaskEditor
        open={taskEditor.open}
        onClose={() => setTaskEditor({ open: false })}
        onSave={saveTask}
        task={taskEditor.task}
        defaultDate={selectedDate}
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

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-4 mb-4 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

void Check;
void weekStartKey;
void weekDays;
void shortDayName;
void dayNumber;
void monthKey;
void formatMonthYear;
void monthKeyFromDate;
