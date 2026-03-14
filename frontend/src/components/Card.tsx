import type { ReactNode } from "react";

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
      {title && <h2 className="px-4 py-3 border-b border-slate-100 font-medium text-slate-800">{title}</h2>}
      <div className="p-4">{children}</div>
    </div>
  );
}
