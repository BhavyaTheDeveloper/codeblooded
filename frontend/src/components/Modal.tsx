import type { ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-card border-[3px] border-dark rounded-[12px] shadow-[8px_8px_0px_0px_var(--color-dark)] max-w-md w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b-[3px] border-dark bg-canvas">
          <h3 className="text-lg font-bold text-dark uppercase">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-dark hover:text-primary font-bold text-2xl leading-none transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-4 bg-card">{children}</div>
      </div>
    </div>
  );
}
