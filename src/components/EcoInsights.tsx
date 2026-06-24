import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Compass, AlertCircle, Quote, Leaf, ChevronRight } from "lucide-react";
import { AIInsight, TripLog, EnergyLog, MealLog } from "../types";

interface EcoInsightsProps {
  trips: TripLog[];
  energyLogs: EnergyLog[];
  meals: MealLog[];
}

export default function EcoInsights({ trips, energyLogs, meals }: EcoInsightsProps) {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchInsights = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch("/api/gemini/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trips, energyLogs, meals })
      });
      if (!response.ok) throw new Error(`Insights service returned status ${response.status}`);
      const data = await response.json();
      setInsight({
        summary: data.summary,
        tips: data.tips || [],
        generatedAt: data.generatedAt || new Date().toISOString(),
        isFallback: data.isFallback
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Unable to contact Gemini. Loading local recommendations.");
      const totalMealCount = meals.length;
      const veganRatio = meals.filter(m => m.type === "veg").length / Math.max(1, totalMealCount);
      setInsight({
        summary: "Based on your logs, you are making good progress tracking your carbon footprint.",
        tips: [
          veganRatio < 0.6
            ? "Green Diet Boost: Plant foods average 10-50x fewer emissions than red meats. Try adding more vegetarian meals."
            : "Great plant-based diet! Keep it up.",
          "Phantom loads: Unplug devices when not in use to save up to 10% on electricity.",
          trips.length > 0
            ? "Smart Mobility: Replace car trips with walking or bus when possible to cut commute emissions."
            : "Track your trips using the Travel Tracker to earn EcoBucks!"
        ],
        generatedAt: new Date().toISOString(),
        isFallback: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [trips.length, energyLogs.length, meals.length]);

  return (
    <div id="ai-insights-section" className="clay-card p-6 md:p-8 bg-surface-warm/10 relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-accent/5 rounded-full blur-xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent">
              <Sparkles className="w-5 h-5 fill-accent/15" />
            </span>
            <h2 className="text-xl font-bold font-display text-fg">Gemini Insights</h2>
          </div>
          <p className="text-xs text-muted font-medium mt-1">
            Personalized carbon reduction tips based on your data.
          </p>
        </div>

        <button
          onClick={fetchInsights}
          disabled={isLoading}
          className="clay-btn-secondary px-3.5 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 flex flex-col items-center text-center space-y-4 animate-pulse">
          <Leaf className="w-8 h-8 text-accent animate-bounce" />
          <div>
            <p className="text-xs font-bold text-fg">Analyzing your data...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {errorMsg && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[10px] flex items-center gap-2 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {insight && (
            <div className="space-y-6">
              <div className="p-5 bg-bg/50 border-l-4 border-accent rounded-r-2xl border-y border-r border-border shadow-clay relative">
                <Quote className="absolute top-3 right-3 w-8 h-8 text-accent/5 pointer-events-none" />
                <p className="text-xs font-bold uppercase tracking-wider text-accent font-display">
                  Weekly Summary
                </p>
                <p className="text-sm font-medium text-fg mt-2 leading-relaxed italic">
                  "{insight.summary}"
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-fg-2 font-display mb-3 flex items-center gap-1">
                  <Compass className="w-4 h-4 text-accent" />
                  <span>Actionable Tips</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {insight.tips.map((tip, idx) => {
                    const colors = [
                      { bg: "bg-accent/5 border-accent/20", iconColor: "text-accent", bgBadge: "bg-accent/15" },
                      { bg: "bg-warn/5 border-warn/20", iconColor: "text-warn", bgBadge: "bg-warn/15" },
                      { bg: "bg-slate-100 border-border", iconColor: "text-slate-600", bgBadge: "bg-slate-200" }
                    ];
                    const choice = colors[idx % colors.length];

                    return (
                      <div key={idx} className={`p-4 rounded-xl border ${choice.bg} shadow-clay flex flex-col justify-between`}>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold ${choice.bgBadge} ${choice.iconColor}`}>
                              0{idx + 1}
                            </span>
                          </div>
                          <p className="text-xs font-medium leading-relaxed">{tip}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
