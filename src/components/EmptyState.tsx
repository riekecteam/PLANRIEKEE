interface EmptyStateProps {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-in">
      <div className="w-24 h-24 rounded-full bg-pink-soft flex items-center justify-center mb-5">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="#F7559D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="text-ink font-semibold text-lg mb-1">{title}</p>
      <p className="text-ink-muted text-sm mb-6 max-w-xs">{subtitle}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-pink-primary text-white rounded-pill font-semibold shadow-soft active:scale-95 transition-transform"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
