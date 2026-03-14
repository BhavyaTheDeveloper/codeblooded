import type { ReactNode } from "react";

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-[12px] border-[3px] border-dark shadow-[5px_5px_0px_0px_var(--color-dark)] hover:-translate-y-[3px] hover:-translate-x-[3px] hover:shadow-[8px_8px_0px_0px_var(--color-dark)] transition-all duration-200 ${className}`}>
      {title && <h2 className="px-4 py-3 border-b-[3px] border-dark font-bold text-dark uppercase">{title}</h2>}
      <div className="p-4">{children}</div>
    </div>
  );
}
