import { Check, Pencil, Trash2, Clock } from 'lucide-react';
import type { Task } from '@/types';
import { categoryColor, priorityDot } from '@/lib/constants';
import { formatTime } from '@/lib/dates';

interface TaskRowProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskRow({ task, onToggle, onEdit, onDelete }: TaskRowProps) {
  const done = task.status === 'completed';
  return (
    <div className="group flex items-start gap-3 bg-cream-card rounded-2xl p-3.5 shadow-card animate-fade-in">
      <button
        onClick={() => onToggle(task.id)}
        className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
          done ? 'bg-pink-primary text-white animate-check-pop' : 'border-2 border-pink-secondary/50'
        }`}
        aria-label={done ? 'Mark as todo' : 'Mark as done'}
      >
        {done && <Check size={14} strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm leading-snug ${done ? 'task-done' : 'text-ink'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {task.time && (
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <Clock size={11} />
              {formatTime(task.time)}
            </span>
          )}
          {task.category && (
            <span
              className="chip text-white"
              style={{ backgroundColor: categoryColor[task.category] }}
            >
              {task.category}
            </span>
          )}
          {task.priority && (
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: priorityDot[task.priority] }}
              />
              {task.priority}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(task)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-pink-soft active:scale-90 transition-all"
          aria-label="Edit"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-pink-soft active:scale-90 transition-all"
          aria-label="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
