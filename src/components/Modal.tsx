import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({ open, onClose, title, children, footer }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 animate-fade-in px-4 pb-[env(safe-area-inset-bottom)]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-cream-card rounded-t-[28px] sm:rounded-[28px] shadow-float animate-slide-up max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="text-lg font-semibold text-ink">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-pink-soft text-pink-primary flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-5 pb-5 overflow-y-auto app-scroll">{children}</div>
        {footer && <div className="px-5 pb-5 pt-2">{footer}</div>}
      </div>
    </div>
  );
}
