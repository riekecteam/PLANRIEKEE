import { useState, useEffect } from 'react';
import Modal from './Modal';
import type { Task, Category, Priority } from '@/types';
import { CATEGORIES, PRIORITIES, REMINDER_OPTIONS } from '@/lib/constants';
import { uid } from '@/lib/store';
import { todayKey } from '@/lib/dates';

interface TaskEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  task?: Task | null;
  defaultDate?: string;
  defaultScope?: Task['scope'];
}

const blank: Omit<Task, 'id' | 'createdAt'> = {
  title: '',
  date: todayKey(),
  time: '',
  category: 'Personal',
  priority: 'Medium',
  status: 'todo',
  notes: '',
  scope: 'daily',
  reminder: null,
};

export default function TaskEditor({
  open,
  onClose,
  onSave,
  task,
  defaultDate,
  defaultScope,
}: TaskEditorProps) {
  const [form, setForm] = useState<Omit<Task, 'id' | 'createdAt'>>(blank);

  useEffect(() => {
    if (open) {
      if (task) {
        const { id, createdAt, ...rest } = task;
        void id;
        void createdAt;
        setForm(rest);
      } else {
        setForm({
          ...blank,
          date: defaultDate || todayKey(),
          scope: defaultScope || 'daily',
        });
      }
    }
  }, [open, task, defaultDate, defaultScope]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({
      ...form,
      id: task?.id || uid(),
      createdAt: task?.createdAt || Date.now(),
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? 'Edit Task' : 'Add Task'}
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-pill bg-pink-soft text-pink-primary font-semibold active:scale-95 transition-transform"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title.trim()}
            className="flex-1 py-3 rounded-pill bg-pink-primary text-white font-semibold active:scale-95 transition-transform shadow-soft disabled:opacity-50"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-ink-muted mb-1.5 block">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="What do you need to do?"
            className="input-field"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-ink-muted mb-1.5 block">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted mb-1.5 block">Time</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => set('time', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted mb-1.5 block">Category</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c: Category) => (
              <button
                key={c}
                onClick={() => set('category', c)}
                className={`chip ${
                  form.category === c
                    ? 'bg-pink-primary text-white'
                    : 'bg-pink-soft text-ink-muted'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted mb-1.5 block">Priority</label>
          <div className="flex gap-2">
            {PRIORITIES.map((p: Priority) => (
              <button
                key={p}
                onClick={() => set('priority', p)}
                className={`chip ${
                  form.priority === p
                    ? 'bg-pink-primary text-white'
                    : 'bg-pink-soft text-ink-muted'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted mb-1.5 block">Reminder</label>
          <select
            value={form.reminder || ''}
            onChange={(e) => set('reminder', e.target.value || null)}
            className="input-field appearance-none"
          >
            <option value="">No reminder</option>
            {REMINDER_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted mb-1.5 block">Notes</label>
          <textarea
            value={form.notes || ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Add a note..."
            rows={2}
            className="input-field resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}
