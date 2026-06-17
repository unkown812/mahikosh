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

      if (!response.ok) {
        throw new Error(`Insights service returned status ${response.status}`);
      }

      const data = await response.json();
      setInsight({
        summary: data.summary,
        tips: data.tips || [],
        generatedAt: data.generatedAt || new Date().toISOString(),
        isFallback: data.isFallback
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Unable to contact Gemini Pro. Loading client-side expert insights engine.");
      
      // Local client-side rules-engine fallback as requested in PRD Reliability
      const totalMealCount = meals.length;
      const veganRatio = meals.filter(m => m.type === "veg").length / Math.max(1, totalMealCount);

      setInsight({
        summary: "Based on your local logs, you are making fine progress tracking travel, energy, and nutrition! Focused checks on transport and home electricity stand to save the highest cumulative kg CO₂.",
        tips: [
          veganRatio < 0.6 
            ? "Green Diet Boost: Plant foods average 10-50x fewer emissions than red meats. Adding 2 more vegetarian meals this week could save 8.5 kg CO₂." 
            : "Superb Green Diet: You are maintaining a highly vegetarian meal intake! Good job. Keeps food logistics emissions bottom-low.",
          "Phantom Energy loads: Shutting off electronic device power sockets cleanly from walls instead of standby mode saves up to 10% on monthly electric carbon.",
          trips.length > 0 
            ? "Smart Mobility: Replacing even one single-occupancy petrol vehicle transit route with walking or a bus cuts commute footprints by nearly 40%." 
            : "Track your trips using 'Live Commuting Tracker' to audit travel emissions and earn rapid bonus EcoBucks!"
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips.length, energyLogs.length, meals.length]);

  return (
    <div id="ai-insights-section" className="clay-card p-6 md:p-8 bg-surface-warm/10 relative overflow-hidden">
      {/* Decorative Matcha overlay subtle stamp */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-accent/5 rounded-full blur-xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent">
              <Sparkles className="w-5 h-5 fill-accent/15" />
            </span>
            <h2 className="text-xl font-bold font-display text-fg">Gemini Sustainability Advisor</h2>
          </div>
          <p className="text-xs text-muted font-medium mt-1">
            Contextual insights compiled server-side based on your registered commute, diet, and power stats.
          </p>
        </div>

        <button
          onClick={fetchInsights}
          disabled={isLoading}
          className="clay-btn-secondary px-3.5 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 flex flex-col items-center text-center space-y-4 animate-pulse">
          <Leaf className="w-8 h-8 text-accent animate-bounce" />
          <div>
            <p className="text-xs font-bold text-fg">Gemini Pro synthesizing ecological summary...</p>
            <p className="text-[10px] text-muted font-medium">Re-calculating carbon reductions across all logs.</p>
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
              {/* Summary Block */}
              <div className="p-5 bg-bg/50 border-l-4 border-accent rounded-r-2xl border-y border-r border-border shadow-clay relative">
                <Quote className="absolute top-3 right-3 w-8 h-8 text-accent/5 pointer-events-none" />
                <p className="text-xs font-bold uppercase tracking-wider text-accent font-display">
                  Weekly Footprint Diagnostic
                </p>
                <p className="text-sm font-medium text-fg mt-2 leading-relaxed italic">
                  "{insight.summary}"
                </p>
                {insight.isFallback && (
                  <span className="absolute bottom-3 right-3 text-[8px] font-mono uppercase bg-surface-warm/40 px-1 rounded text-muted">
                    Engine Mode: expert rules
                  </span>
                )}
              </div>

              {/* Tips Grid */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-fg-2 font-display mb-3 flex items-center gap-1">
                  <Compass className="w-4 h-4 text-accent" />
                  <span>Personalized Actionable Nudges</span>
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {insight.tips.map((tip, idx) => {
                    // Alternate colorful background styles based on modern earthy swatches
                    const colors = [
                      { bg: "bg-accent/5 border-accent/20 text-[#1a3818]", iconColor: "text-accent", bgBadge: "bg-accent/15" },
                      { bg: "bg-warn/5 border-warn/20 text-[#6e4905]", iconColor: "text-warn", bgBadge: "bg-warn/15" },
                      { bg: "bg-slate-100 border-border text-slate-800", iconColor: "text-slate-600", bgBadge: "bg-slate-200" }
                    ];
                    const choice = colors[idx % colors.length];

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border ${choice.bg} shadow-clay flex flex-col justify-between hover:scale-[1.01] transition-all duration-150`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold ${choice.bgBadge} ${choice.iconColor}`}>
                              0{idx+1}
                            </span>
                            <span className="text-[10px] font-bold font-display uppercase tracking-wider">
                              {idx === 0 ? "Nutrition Choice" : idx === 1 ? "Power Efficiency" : "Transit Nudge"}
                            </span>
                          </div>
                          <p className="text-xs font-medium leading-relaxed">
                            {tip}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-black/5 flex items-center text-[10px] font-bold gap-0.5 self-end tracking-tight cursor-pointer hover:underline">
                          <span>Get active</span>
                          <ChevronRight className="w-3 h-3" />
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
