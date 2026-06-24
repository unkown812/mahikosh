import React, { useState } from "react";
import { Lightbulb, Check, Sparkles, Leaf, Car, UtensilsCrossed, Home, Trophy } from "lucide-react";
import { ECO_TIPS } from "../utils";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  travel: <Car className="w-4 h-4" />,
  food: <UtensilsCrossed className="w-4 h-4" />,
  energy: <Home className="w-4 h-4" />,
  lifestyle: <Leaf className="w-4 h-4" />,
};

const IMPACT_COLORS: Record<string, string> = {
  high: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
};

interface RecommendationsScreenProps {
  onClaimBucks: (tipId: string, bucks: number) => void;
  completedTips: string[];
}

export default function RecommendationsScreen({ onClaimBucks, completedTips }: RecommendationsScreenProps) {
  const [filter, setFilter] = useState<string>("all");
  const [successMsg, setSuccessMsg] = useState("");

  const categories = ["all", "travel", "food", "energy"];

  const filtered = filter === "all" ? ECO_TIPS : ECO_TIPS.filter(t => t.category === filter);

  const handleComplete = (tipId: string, bucks: number) => {
    onClaimBucks(tipId, bucks);
    setSuccessMsg(`+${bucks} EcoBucks earned!`);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="clay-card p-6 md:p-8">
      <div className="flex items-start justify-between border-b border-border-soft pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent">
              <Lightbulb className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold font-display text-fg">Eco Tips</h2>
          </div>
          <p className="text-xs text-muted font-medium mt-1">
            Complete tips to earn bonus EcoBucks and reduce your footprint.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 bg-success/15 border border-success/30 rounded-xl flex items-center gap-2 text-success text-xs font-medium animate-fade-in">
          <Sparkles className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-full border transition-all ${
              filter === cat
                ? "bg-accent text-white border-accent"
                : "border-border hover:border-accent text-fg-2 bg-surface/80"
            }`}
          >
            {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(tip => {
          const isCompleted = completedTips.includes(tip.id);
          return (
            <div
              key={tip.id}
              className={`p-5 rounded-2xl border transition-all ${
                isCompleted
                  ? "bg-success/5 border-success/20"
                  : "bg-surface border-border-soft hover:shadow-clay"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-accent/5 text-accent border border-accent/10">
                    {CATEGORY_ICONS[tip.category] || <Leaf className="w-4 h-4" />}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    {tip.category}
                  </span>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${IMPACT_COLORS[tip.impact]}`}>
                  {tip.impact.toUpperCase()} IMPACT
                </span>
              </div>

              <h3 className="text-sm font-bold font-display text-fg mb-1">{tip.title}</h3>
              <p className="text-xs text-fg-2 leading-relaxed">{tip.description}</p>

              <div className="mt-4 pt-3 border-t border-border-soft flex items-center justify-between">
                <span className="text-xs font-bold text-success flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  +{tip.bucksReward} EcoBucks
                </span>
                {isCompleted ? (
                  <span className="text-xs font-bold text-success flex items-center gap-1">
                    <Check className="w-4 h-4" /> Completed
                  </span>
                ) : (
                  <button
                    onClick={() => handleComplete(tip.id, tip.bucksReward)}
                    className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl border border-black transition-all"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
