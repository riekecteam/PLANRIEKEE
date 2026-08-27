import { useState, useMemo } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { AppData, Task, WeeklyGoal } from '@/types';
import {
  todayKey,
  weekStartKey,
  weekDays,
  addDays,
  shortDayName,
  dayNumber,
  formatLongDate,
} from '@/lib/dates';
import { uid } from '@/lib/store';
import TaskRow from '@/components/TaskRow';
import TaskEditor from '@/components/TaskEditor';
import ConfirmDialog from '@/components/ConfirmDialog';

interface WeeklyPlannerProps {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
}

export default function WeeklyPlanner({ data, update }: WeeklyPlannerProps) {
  const [weekStart, setWeekStart] = useState(() =>
    weekStartKey(new Date(), data.settings.firstDayOfWeek)
  );
  const [selectedDay, setSelectedDay] = useState(todayKey());
  const [taskEditor, setTaskEditor] = useState<{ open: boolean; task?: Task | null }>({ open: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [goalText, setGoalText] = useState('');

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const weekGoals = data.weeklyGoals.filter((g) => g.weekStart === weekStart);
  const weeklyData = data.weekly.find((w) => w.weekStart === weekStart);

  const dayTasks = useMemo(
    () =>
      data.tasks
        .filter((t) => t.date === selectedDay)
        .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99')),
    [data.tasks, selectedDay]
  );

  const weekTasks = useMemo(
    () => data.tasks.filter((t) => days.includes(t.date)),
    [data.tasks, days]
  );
  const weekCompleted = weekTasks.filter((t) => t.status === 'completed').length;
  const weekProgress = weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0;

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

  const addGoal = () => {
    if (!goalText.trim() || weekGoals.length >= 5) return;
    update((d) => {
      d.weeklyGoals.push({ id: uid(), weekStart, text: goalText.trim(), done: false });
      return d;
    });
    setGoalText('');
  };

  const toggleGoal = (id: string) =>
    update((d) => {
      const g = d.weeklyGoals.find((x) => x.id === id);
      if (g) g.done = !g.done;
      return d;
    });

  const deleteGoal = (id: string) =>
    update((d) => {
      d.weeklyGoals = d.weeklyGoals.filter((g) => g.id !== id);
      return d;
    });

  const updateWeekly = (fn: (w: typeof data.weekly[number]) => void) =>
    update((d) => {
      let entry = d.weekly.find((x) => x.weekStart === weekStart);
      if (!entry) {
        entry = { weekStart, notes: '', nextWeekPreview: '' };
        d.weekly.push(entry);
      }
      fn(entry);
      return d;
    });

  const getWeekly = () => weeklyData || { weekStart, notes: '', nextWeekPreview: '' };

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-ink">Weekly Planner</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="w-8 h-8 rounded-full bg-cream-card shadow-card flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronLeft size={18} className="text-pink-primary" />
          </button>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="w-8 h-8 rounded-full bg-cream-card shadow-card flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronRight size={18} className="text-pink-primary" />
          </button>
        </div>
      </div>

      {/* Week day selector */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
        {days.map((date) => {
          const isSelected = date === selectedDay;
          const isToday = date === todayKey();
          return (
            <button
              key={date}
              onClick={() => setSelectedDay(date)}
              className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl flex-shrink-0 min-w-[52px] transition-all active:scale-95 ${
                isSelected ? 'bg-pink-primary text-white shadow-soft' : 'bg-cream-card shadow-card text-ink'
              }`}
            >
              <span className={`text-[10px] font-medium ${isSelected ? 'text-white/80' : 'text-ink-muted'}`}>
                {shortDayName(date)}
              </span>
              <span className={`text-lg font-bold ${isToday && !isSelected ? 'text-pink-primary' : ''}`}>
                {dayNumber(date)}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-ink-muted text-sm mb-4">{formatLongDate(new Date(selectedDay + 'T00:00'))}</p>

      {/* Weekly Progress */}
      <div className="card p-5 mb-4 bg-gradient-to-br from-white to-pink-soft/40">
        <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">Weekly Progress</p>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#FFE4F0" strokeWidth="6" />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="#F7559D"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(weekProgress / 100) * 175.9} 175.9`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-pink-primary">
              {weekProgress}%
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-ink">{weekCompleted}/{weekTasks.length}</p>
            <p className="text-xs text-ink-muted">tasks completed this week</p>
          </div>
        </div>
      </div>

      {/* Weekly Goals */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-ink">Weekly Goals</h2>
            <p className="text-xs text-ink-muted mt-0.5">{weekGoals.filter((g) => g.done).length}/{weekGoals.length} done</p>
          </div>
        </div>
        <div className="space-y-2">
          {weekGoals.map((g: WeeklyGoal) => (
            <div key={g.id} className="flex items-center gap-3 bg-pink-soft/50 rounded-2xl p-3">
              <button
                onClick={() => toggleGoal(g.id)}
                className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
                  g.done ? 'bg-pink-primary text-white' : 'border-2 border-pink-secondary/50'
                }`}
              >
                {g.done && <Check size={14} strokeWidth={3} />}
              </button>
              <p className={`flex-1 text-sm font-medium ${g.done ? 'task-done' : 'text-ink'}`}>{g.text}</p>
              <button
                onClick={() => deleteGoal(g.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-ink-muted active:scale-90 transition-transform"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {weekGoals.length < 5 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                placeholder="Add a weekly goal..."
                className="input-field flex-1"
              />
              <button
                onClick={addGoal}
                disabled={!goalText.trim()}
                className="btn-primary px-4 disabled:opacity-50"
              >
                <Plus size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Day tasks */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-ink">{shortDayName(selectedDay)}'s Tasks</h2>
          <button
            onClick={() => setTaskEditor({ open: true })}
            className="w-8 h-8 rounded-full bg-pink-primary text-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <Plus size={18} />
          </button>
        </div>
        {dayTasks.length === 0 ? (
          <p className="text-center text-ink-muted text-sm py-6">No tasks for this day.</p>
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
      </div>

      {/* Weekly Notes */}
      <div className="card p-4 mb-4">
        <h2 className="text-sm font-bold text-ink mb-3">Weekly Notes</h2>
        <textarea
          value={getWeekly().notes}
          onChange={(e) => updateWeekly((w) => { w.notes = e.target.value; })}
          placeholder="This week's thoughts..."
          rows={3}
          className="input-field resize-none"
        />
      </div>

      {/* Next Week Preview */}
      <div className="card p-4 mb-4">
        <h2 className="text-sm font-bold text-ink mb-3">Next Week Preview</h2>
        <textarea
          value={getWeekly().nextWeekPreview}
          onChange={(e) => updateWeekly((w) => { w.nextWeekPreview = e.target.value; })}
          placeholder="Plans for next week..."
          rows={3}
          className="input-field resize-none"
        />
      </div>

      <TaskEditor
        open={taskEditor.open}
        onClose={() => setTaskEditor({ open: false })}
        onSave={saveTask}
        task={taskEditor.task}
        defaultDate={selectedDay}
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
