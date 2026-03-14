import type { ReactNode } from "react";

export function DataTable({
  columns,
  children,
  className = "",
}: {
  columns: string[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto border-[3px] border-dark ${className}`}>
      <table className="min-w-full divide-y-[3px] divide-dark">
        <thead className="bg-canvas border-b-[3px] border-dark">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-4 py-2 text-left text-xs font-bold text-dark uppercase tracking-wider">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card divide-y-[3px] divide-dark">{children}</tbody>
      </table>
    </div>
  );
}
