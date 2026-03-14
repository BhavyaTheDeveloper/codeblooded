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
    <div className={`overflow-x-auto rounded border border-slate-200 ${className}`}>
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">{children}</tbody>
      </table>
    </div>
  );
}
