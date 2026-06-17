import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  id: string;
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  description?: string;
  colorClass?: string; // e.g. "text-accent" or "text-success"
  bgAccentStyle?: string; // a custom color-mix or background style
}

export default function MetricCard({
  id,
  title,
  value,
  unit,
  icon: Icon,
  description,
  colorClass = "text-meta",
  bgAccentStyle = "bg-surface"
}: MetricCardProps) {
  return (
    <div
      id={id}
      className="clay-card p-5 relative overflow-hidden group hover:scale-[1.01] transition-all duration-200"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider font-semibold text-muted font-display">
            {title}
          </p>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-bold font-display tracking-tight ${colorClass}`}>
              {value}
            </span>
            {unit && <span className="text-xs font-mono text-muted">{unit}</span>}
          </div>
        </div>
        <div className={`p-3 rounded-xl border border-border-soft ${bgAccentStyle} shadow-clay`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
      </div>
      {description && (
        <p className="text-xs text-fg-2 mt-3 font-medium flex items-center gap-1.5 opacity-90">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent/40" />
          {description}
        </p>
      )}
    </div>
  );
}
