import React, { useState } from "react";
import { Zap, Flame, Home, Check, History, Trash2, Calendar } from "lucide-react";
import { EnergyLog } from "../types";
import { calculateEnergyCo2 } from "../utils";

interface EnergyLoggerProps {
  onAddEnergyLog: (electricity: number, gas: number) => void;
  logs: EnergyLog[];
  onDeleteLog: (id: string) => void;
}

export default function EnergyLogger({ onAddEnergyLog, logs, onDeleteLog }: EnergyLoggerProps) {
  const [electricity, setElectricity] = useState("");
  const [gas, setGas] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const elecon = parseFloat(electricity) || 0;
    const gascon = parseFloat(gas) || 0;

    if (elecon > 0 || gascon > 0) {
      onAddEnergyLog(elecon, gascon);
      setElectricity("");
      setGas("");
      setSuccessMsg(`Logged energy bill: ${(elecon * 0.82 + gascon * 1.5).toFixed(2)} kg CO₂ computed using Indian emission factors!`);
      setTimeout(() => setSuccessMsg(""), 6000);
    }
  };

  return (
    <div id="energy-logger-section" className="clay-card p-6 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border-soft pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 border border-warn/20 text-warn">
              <Home className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold font-display text-fg">Home Utilities & Energy Bills</h2>
          </div>
          <p className="text-xs text-muted font-medium mt-1">
            Manual log of monthly utility consumption (Indian grid standard values: 0.82 kg CO₂/kWh, 1.5 kg CO₂/kg LPG).
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 bg-success/15 border border-success/30 rounded-xl flex items-center gap-2 text-success text-xs font-medium animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 bg-surface border border-border-soft rounded-2xl shadow-clay space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Electricity */}
          <div className="p-4 bg-surface-warm/10 rounded-xl border border-border-soft space-y-3">
            <div className="flex items-center gap-2 text-fg font-bold text-xs uppercase tracking-wider font-display">
              <Zap className="w-4.5 h-4.5 text-yellow-500 fill-yellow-100" />
              <span>Electricity Bill</span>
            </div>
            <div className="space-y-1">
              <label htmlFor="elec-con-field" className="block text-[11px] font-bold text-muted">
                Consumption (in kWh/Units)
              </label>
              <input
                id="elec-con-field"
                type="number"
                min="0"
                step="0.1"
                value={electricity}
                onChange={(e) => setElectricity(e.target.value)}
                placeholder="e.g. 180"
                className="w-full px-4 py-2 border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent text-sm font-mono"
              />
            </div>
            <div className="text-[10px] text-muted flex justify-between">
              <span>Coeff: 0.82 kg CO₂/Unit</span>
              {electricity && (
                <span className="font-semibold text-danger">
                  ≈ {(parseFloat(electricity) * 0.82).toFixed(1)} kg CO₂
                </span>
              )}
            </div>
          </div>

          {/* Cooking Gas */}
          <div className="p-4 bg-surface-warm/10 rounded-xl border border-border-soft space-y-3">
            <div className="flex items-center gap-2 text-fg font-bold text-xs uppercase tracking-wider font-display">
              <Flame className="w-4.5 h-4.5 text-red-500 fill-red-100" />
              <span>Cooking Gas (LPG)</span>
            </div>
            <div className="space-y-1">
              <label htmlFor="gas-con-field" className="block text-[11px] font-bold text-muted">
                Consumption (in kg cylinder weight)
              </label>
              <input
                id="gas-con-field"
                type="number"
                min="0"
                step="0.1"
                value={gas}
                onChange={(e) => setGas(e.target.value)}
                placeholder="e.g. 14.2"
                className="w-full px-4 py-2 border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent text-sm font-mono"
              />
            </div>
            <div className="text-[10px] text-muted flex justify-between">
              <span>Coeff: 1.50 kg CO₂/kg</span>
              {gas && (
                <span className="font-semibold text-danger">
                  ≈ {(parseFloat(gas) * 1.5).toFixed(1)} kg CO₂
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="clay-btn-interactive w-full py-2.5 flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Save Energy Inventory & Log CO₂</span>
        </button>
      </form>

      {/* Audit History logs */}
      {logs.length > 0 && (
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fg-2 font-display">
            <History className="w-4 h-4 text-muted" />
            <span>Utilities Audit History ({logs.length})</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border-soft shadow-clay bg-surface/50 max-h-52 no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-warm/40 font-display font-bold text-fg-2 sticky top-0">
                <tr>
                  <th className="p-3">Electricity Used</th>
                  <th className="p-3">Gas Used</th>
                  <th className="p-3 text-right">Computed CO₂</th>
                  <th className="p-3 text-center">Receipt Date</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-warm/10 text-fg-2 font-medium">
                    <td className="p-3 font-mono">
                      {log.electricity_bill > 0 ? `${log.electricity_bill} kWh` : "None logged"}
                    </td>
                    <td className="p-3 font-mono">
                      {log.gas_bill > 0 ? `${log.gas_bill} kg` : "None logged"}
                    </td>
                    <td className="p-3 text-right font-mono text-danger font-semibold">
                      {log.co2_emission.toFixed(2)} kg
                    </td>
                    <td className="p-3 text-center text-[10px] text-muted">
                      {new Date(log.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => onDeleteLog(log.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
