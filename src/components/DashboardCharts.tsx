import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { TripLog, EnergyLog, MealLog } from "../types";
import { PieChart as PieIcon, BarChart2, Info } from "lucide-react";

interface DashboardChartsProps {
  trips: TripLog[];
  energyLogs: EnergyLog[];
  meals: MealLog[];
}

export default function DashboardCharts({ trips, energyLogs, meals }: DashboardChartsProps) {
  // 1. Compute Category Totals
  const travelTotal = trips.reduce((sum, t) => sum + t.co2_emission, 0);
  const energyTotal = energyLogs.reduce((sum, e) => sum + e.co2_emission, 0);
  const foodTotal = meals.reduce((sum, m) => sum + m.co2_emission, 0);
  const cumulativeTotal = travelTotal + energyTotal + foodTotal;

  // 2. Format category payload for Pie Chart
  const pieData = [
    { name: "Travel (Commuting)", value: Number(travelTotal.toFixed(1)) },
    { name: "Home Energy (Utility)", value: Number(energyTotal.toFixed(1)) },
    { name: "Diet (Meals scanned)", value: Number(foodTotal.toFixed(1)) }
  ].filter(item => item.value > 0);

  // Fallback pie data in case there is no logs yet to show a placeholder guide
  const defaultPieData = [
    { name: "Travel", value: 12.0 },
    { name: "Home Energy", value: 8.5 },
    { name: "Diet", value: 5.6 }
  ];

  const usingPlaceholderData = pieData.length === 0;
  const currentPiePayload = usingPlaceholderData ? defaultPieData : pieData;

  // Matching color swatches: Slushie (Cyan), Lemon (Gold), Matcha (Green)
  const SWATCH_COLORS = ["#0089ad", "#fbbd41", "#078a52"];

  // 3. Historical Timeline format for Bar Chart (Aggregates emissions by day of week or entry ID)
  // Let's list the last 5 logs chronologically
  const allLogs: Array<{ name: string; co2: number; type: string; date: Date }> = [];
  
  trips.forEach(t => allLogs.push({ name: "Transit", co2: t.co2_emission, type: "travel", date: new Date(t.createdAt) }));
  energyLogs.forEach(e => allLogs.push({ name: "Utility", co2: e.co2_emission, type: "energy", date: new Date(e.createdAt) }));
  meals.forEach(m => allLogs.push({ name: m.foodName, co2: m.co2_emission, type: "food", date: new Date(m.createdAt) }));

  // Sort logs by newest
  allLogs.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Take last 7 logs for clean graph
  const timelineData = allLogs.slice(-7).map((log, index) => ({
    name: `${log.name.slice(0, 10)}${log.name.length > 10 ? ".." : ""}`,
    "CO₂ kg": Number(log.co2.toFixed(1)),
    category: log.type
  }));

  // Fallback timeline data
  const defaultTimeline = [
    { name: "Mon", "CO₂ kg": 4.1 },
    { name: "Tue", "CO₂ kg": 2.5 },
    { name: "Wed", "CO₂ kg": 0.0 },
    { name: "Thu", "CO₂ kg": 5.2 },
    { name: "Fri", "CO₂ kg": 1.1 },
    { name: "Sat", "CO₂ kg": 3.8 },
    { name: "Sun", "CO₂ kg": 0.6 }
  ];

  const currentBarPayload = timelineData.length > 0 ? timelineData : defaultTimeline;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-charts-container">
      {/* Chart 1: Carbon Source Breakdown (Pie) */}
      <div className="clay-card p-6 bg-surface">
        <div className="flex items-center gap-2 mb-4 border-b border-border-soft pb-3">
          <PieIcon className="w-5 h-5 text-[#0089ad]" />
          <div>
            <h3 className="text-base font-bold font-display text-fg">Carbon Source Proportions</h3>
            <p className="text-[10px] text-muted font-medium">Breakdown of emissions by transport, food, and energy sectors.</p>
          </div>
        </div>

        {usingPlaceholderData && (
          <div className="mb-3 p-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] rounded-lg flex items-center gap-1.5 font-medium">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Currently showing demo breakdown. Insert commute, food, or power logs to view live calculations!</span>
          </div>
        )}

        <div className="h-60 flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={currentPiePayload}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {currentPiePayload.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={SWATCH_COLORS[index % SWATCH_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => [`${val} kg CO₂`, "Emission"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Historical Timeline (Bar) */}
      <div className="clay-card p-6 bg-surface">
        <div className="flex items-center gap-2 mb-4 border-b border-border-soft pb-3">
          <BarChart2 className="w-5 h-5 text-accent" />
          <div>
            <h3 className="text-base font-bold font-display text-fg">Emissions Timeline</h3>
            <p className="text-[10px] text-muted font-medium">Sequential tracking history of your logged ecological events.</p>
          </div>
        </div>

        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={currentBarPayload} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#8a7a70" }} />
              <YAxis tick={{ fontSize: 9, fill: "#8a7a70" }} />
              <Tooltip formatter={(val) => [`${val} kg`, "CO₂ emission"]} />
              <Bar dataKey="CO₂ kg" radius={[6, 6, 0, 0]}>
                {currentBarPayload.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#b46a46" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
