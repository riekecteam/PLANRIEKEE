import { useState, useMemo } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { AppData, MonthlyGoal, ImportantDate } from '@/types';
import { monthKey, formatMonthYear, todayKey, monthKeyFromDate } from '@/lib/dates';
import { uid } from '@/lib/store';
import ConfirmDialog from '@/components/ConfirmDialog';

interface MonthlyPlannerProps {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
}

const DATE_TYPES: ImportantDate['type'][] = ['Birthday', 'Meeting', 'Deadline', 'Event', 'Appointment'];
const typeColors: Record<ImportantDate['type'], string> = {
  Birthday: '#F7559D',
  Meeting: '#5B8DEF',
  Deadline: '#E74C3C',
  Event: '#27AE60',
  Appointment: '#E67E22',
};

export default function MonthlyPlanner({ data, update }: MonthlyPlannerProps) {
  const [month, setMonth] = useState(monthKey());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'goal' | 'date' | 'todo'>('goal');
  const [goalText, setGoalText] = useState('');
  const [todoText, setTodoText] = useState('');
  const [dateForm, setDateForm] = useState({ title: '', date: todayKey(), type: 'Event' as ImportantDate['type'] });

  const monthlyGoals = data.monthlyGoals.filter((g) => g.month === month);
  const importantDates = data.importantDates
    .filter((d) => monthKeyFromDate(d.date) === month)
    .sort((a, b) => a.date.localeCompare(b.date));
  const monthlyTodos = data.tasks.filter((t) => t.scope === 'monthly' && monthKeyFromDate(t.date) === month);
  const monthlyData = data.monthly.find((m) => m.month === month);

  const shiftMonth = (n: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + n, 1);
    setMonth(monthKey(d));
  };

  const addGoal = () => {
    if (!goalText.trim()) return;
    update((d) => {
      d.monthlyGoals.push({
        id: uid(),
        month,
        name: goalText.trim(),
        status: 'todo',
        progress: 0,
      });
      return d;
    });
    setGoalText('');
  };

  const updateGoal = (id: string, fn: (g: MonthlyGoal) => void) =>
    update((d) => {
      const g = d.monthlyGoals.find((x) => x.id === id);
      if (g) fn(g);
      return d;
    });

  const addTodo = () => {
    if (!todoText.trim()) return;
    update((d) => {
      d.tasks.push({
        id: uid(),
        title: todoText.trim(),
        date: todayKey(),
        time: '',
        category: 'Other',
        priority: 'Medium',
        status: 'todo',
        scope: 'monthly',
        createdAt: Date.now(),
      });
      return d;
    });
    setTodoText('');
  };

  const toggleTodo = (id: string) =>
    update((d) => {
      const t = d.tasks.find((x) => x.id === id);
      if (t) t.status = t.status === 'completed' ? 'todo' : 'completed';
      return d;
    });

  const addImportantDate = () => {
    if (!dateForm.title.trim()) return;
    update((d) => {
      d.importantDates.push({
        id: uid(),
        month,
        title: dateForm.title.trim(),
        date: dateForm.date,
        type: dateForm.type,
      });
      return d;
    });
    setDateForm({ title: '', date: todayKey(), type: 'Event' });
  };

  const updateMonthly = (fn: (m: typeof data.monthly[number]) => void) =>
    update((d) => {
      let entry = d.monthly.find((x) => x.month === month);
      if (!entry) {
        entry = {
          month,
          notes: '',
          reflection: { wentWell: '', couldBeBetter: '', proudOf: '', nextMonth: '' },
        };
        d.monthly.push(entry);
      }
      fn(entry);
      return d;
    });

  const getMonthly = () =>
    monthlyData || {
      month,
      notes: '',
      reflection: { wentWell: '', couldBeBetter: '', proudOf: '', nextMonth: '' },
    };

  const doDelete = () => {
    if (!deleteId) return;
    update((d) => {
      if (deleteType === 'goal') d.monthlyGoals = d.monthlyGoals.filter((g) => g.id !== deleteId);
      else if (deleteType === 'date') d.importantDates = d.importantDates.filter((x) => x.id !== deleteId);
      else if (deleteType === 'todo') d.tasks = d.tasks.filter((t) => t.id !== deleteId);
      return d;
    });
    setDeleteId(null);
  };

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-ink">Monthly Planner</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftMonth(-1)}
            className="w-8 h-8 rounded-full bg-cream-card shadow-card flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronLeft size={18} className="text-pink-primary" />
          </button>
          <button
            onClick={() => shiftMonth(1)}
            className="w-8 h-8 rounded-full bg-cream-card shadow-card flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronRight size={18} className="text-pink-primary" />
          </button>
        </div>
      </div>

      <p className="text-center text-lg font-bold text-pink-primary mb-5">{formatMonthYear(month)}</p>

      {/* Monthly Goals */}
      <Section title="Monthly Goals">
        <div className="space-y-3">
          {monthlyGoals.map((g) => (
            <div key={g.id} className="bg-pink-soft/40 rounded-2xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={g.name}
                  onChange={(e) => updateGoal(g.id, (x) => { x.name = e.target.value; })}
                  className="flex-1 bg-transparent text-sm font-semibold text-ink outline-none"
                />
                <button
                  onClick={() => { setDeleteId(g.id); setDeleteType('goal'); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-ink-muted active:scale-90 transition-transform ml-2"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={g.deadline || ''}
                  onChange={(e) => updateGoal(g.id, (x) => { x.deadline = e.target.value; })}
                  className="text-xs text-ink-muted bg-transparent outline-none flex-1"
                />
                <select
                  value={g.status}
                  onChange={(e) => updateGoal(g.id, (x) => {
                    x.status = e.target.value as MonthlyGoal['status'];
                    x.progress = e.target.value === 'completed' ? 100 : e.target.value === 'in-progress' ? 50 : 0;
                  })}
                  className="text-xs bg-pink-soft rounded-pill px-2 py-1 outline-none"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="mt-2 h-2 bg-pink-soft rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-primary rounded-full transition-all duration-500"
                  style={{ width: `${g.progress}%` }}
                />
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGoal()}
              placeholder="Add a monthly goal..."
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
        </div>
      </Section>

      {/* Important Dates */}
      <Section title="Important Dates">
        <div className="space-y-2 mb-3">
          {importantDates.map((d) => (
            <div key={d.id} className="flex items-center gap-3 bg-cream-card border border-pink-soft rounded-2xl p-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: typeColors[d.type] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{d.title}</p>
                <p className="text-xs text-ink-muted">
                  {new Date(d.date + 'T00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} · {d.type}
                </p>
              </div>
              <button
                onClick={() => { setDeleteId(d.id); setDeleteType('date'); }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-ink-muted active:scale-90 transition-transform"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="space-y-2 bg-pink-soft/30 rounded-2xl p-3">
          <input
            type="text"
            value={dateForm.title}
            onChange={(e) => setDateForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Event title..."
            className="input-field"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={dateForm.date}
              onChange={(e) => setDateForm((f) => ({ ...f, date: e.target.value }))}
              className="input-field flex-1"
            />
            <select
              value={dateForm.type}
              onChange={(e) => setDateForm((f) => ({ ...f, type: e.target.value as ImportantDate['type'] }))}
              className="input-field flex-1 appearance-none"
            >
              {DATE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <button
            onClick={addImportantDate}
            disabled={!dateForm.title.trim()}
            className="btn-primary w-full py-2.5 disabled:opacity-50"
          >
            Add Date
          </button>
        </div>
      </Section>

      {/* Monthly To-Do */}
      <Section title="Monthly To-Do">
        <div className="space-y-2 mb-3">
          {monthlyTodos.map((t) => (
            <div key={t.id} className="flex items-center gap-3 bg-pink-soft/40 rounded-2xl p-3">
              <button
                onClick={() => toggleTodo(t.id)}
                className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
                  t.status === 'completed' ? 'bg-pink-primary text-white' : 'border-2 border-pink-secondary/50'
                }`}
              >
                {t.status === 'completed' && <Check size={14} strokeWidth={3} />}
              </button>
              <p className={`flex-1 text-sm font-medium ${t.status === 'completed' ? 'task-done' : 'text-ink'}`}>
                {t.title}
              </p>
              <button
                onClick={() => { setDeleteId(t.id); setDeleteType('todo'); }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-ink-muted active:scale-90 transition-transform"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={todoText}
            onChange={(e) => setTodoText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a big task..."
            className="input-field flex-1"
          />
          <button
            onClick={addTodo}
            disabled={!todoText.trim()}
            className="btn-primary px-4 disabled:opacity-50"
          >
            <Plus size={18} />
          </button>
        </div>
      </Section>

      {/* Monthly Notes */}
      <Section title="Monthly Notes">
        <textarea
          value={getMonthly().notes}
          onChange={(e) => updateMonthly((m) => { m.notes = e.target.value; })}
          placeholder="Notes for this month..."
          rows={3}
          className="input-field resize-none"
        />
      </Section>

      {/* Monthly Reflection */}
      <Section title="Monthly Reflection">
        <div className="space-y-3">
          {([
            ['wentWell', 'What went well?'],
            ['couldBeBetter', 'What could be better?'],
            ['proudOf', 'What am I proud of?'],
            ['nextMonth', 'What do I want next month?'],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">{label}</label>
              <textarea
                value={getMonthly().reflection[key]}
                onChange={(e) => updateMonthly((m) => { m.reflection[key] = e.target.value; })}
                rows={2}
                className="input-field resize-none"
              />
            </div>
          ))}
        </div>
      </Section>

      <ConfirmDialog
        open={!!deleteId}
        message="Are you sure you want to delete this?"
        onConfirm={doDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4 mb-4 animate-slide-up">
      <h2 className="text-sm font-bold text-ink mb-3">{title}</h2>
      {children}
    </div>
  );
}
