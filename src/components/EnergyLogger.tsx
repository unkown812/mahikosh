import React, { useState } from "react";
import { Zap, Flame, Home, Check, History, Trash2, Calendar } from "lucide-react";
import { EnergyLog } from "../types";
import { calculateEnergyCo2, EMISSION_FACTORS } from "../utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface EnergyLoggerProps {
  onAddEnergyLog: (month: string, year: number, electricity: number, gas: number) => void;
  logs: EnergyLog[];
  onDeleteLog: (id: string) => void;
}

export default function EnergyLogger({ onAddEnergyLog, logs, onDeleteLog }: EnergyLoggerProps) {
  const now = new Date();
  const [month, setMonth] = useState(MONTHS[now.getMonth()]);
  const [year, setYear] = useState(now.getFullYear().toString());
  const [electricity, setElectricity] = useState("");
  const [gas, setGas] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const elecFactor = EMISSION_FACTORS.energy.electricity_per_inr;
  const gasFactor = EMISSION_FACTORS.energy.gas_per_inr;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const elecInr = parseFloat(electricity) || 0;
    const gasInr = parseFloat(gas) || 0;
    const parsedYear = parseInt(year) || now.getFullYear();

    if (elecInr > 0 || gasInr > 0) {
      onAddEnergyLog(month, parsedYear, elecInr, gasInr);
      setElectricity("");
      setGas("");
      setSuccessMsg(`Logged energy for ${month} ${parsedYear}: ${(elecInr * elecFactor + gasInr * gasFactor).toFixed(2)} kg CO₂`);
      setTimeout(() => setSuccessMsg(""), 6000);
    }
  };

  return (
    <div id="energy-logger-section" className="clay-card p-6 md:p-8">
      <div className="flex items-start justify-between border-b border-border-soft pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 border border-warn/20 text-warn">
              <Home className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold font-display text-fg">Home Energy Bills</h2>
          </div>
          <p className="text-xs text-muted font-medium mt-1">
            Log monthly electricity and gas bills (INR). Indian grid: {elecFactor} kg/₹ electricity, {gasFactor} kg/₹ gas.
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-fg-2">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent text-sm"
            >
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-fg-2">Year</label>
            <input
              type="number"
              min="2020"
              max="2030"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent text-sm font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-surface-warm/10 rounded-xl border border-border-soft space-y-3">
            <div className="flex items-center gap-2 text-fg font-bold text-xs uppercase tracking-wider font-display">
              <Zap className="w-4.5 h-4.5 text-yellow-500 fill-yellow-100" />
              <span>Electricity Bill (INR)</span>
            </div>
            <div className="space-y-1">
              <label htmlFor="elec-bill-field" className="block text-[11px] font-bold text-muted">
                Amount in ₹
              </label>
              <input
                id="elec-bill-field"
                type="number"
                min="0"
                step="1"
                value={electricity}
                onChange={(e) => setElectricity(e.target.value)}
                placeholder="e.g. 1200"
                className="w-full px-4 py-2 border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent text-sm font-mono"
              />
            </div>
            <div className="text-[10px] text-muted flex justify-between">
              <span>{elecFactor} kg CO₂/₹</span>
              {electricity && (
                <span className="font-semibold text-danger">
                  ≈ {(parseFloat(electricity) * elecFactor).toFixed(2)} kg CO₂
                </span>
              )}
            </div>
          </div>

          <div className="p-4 bg-surface-warm/10 rounded-xl border border-border-soft space-y-3">
            <div className="flex items-center gap-2 text-fg font-bold text-xs uppercase tracking-wider font-display">
              <Flame className="w-4.5 h-4.5 text-red-500 fill-red-100" />
              <span>Gas Bill (INR)</span>
            </div>
            <div className="space-y-1">
              <label htmlFor="gas-bill-field" className="block text-[11px] font-bold text-muted">
                Amount in ₹
              </label>
              <input
                id="gas-bill-field"
                type="number"
                min="0"
                step="1"
                value={gas}
                onChange={(e) => setGas(e.target.value)}
                placeholder="e.g. 800"
                className="w-full px-4 py-2 border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent text-sm font-mono"
              />
            </div>
            <div className="text-[10px] text-muted flex justify-between">
              <span>{gasFactor} kg CO₂/₹</span>
              {gas && (
                <span className="font-semibold text-danger">
                  ≈ {(parseFloat(gas) * gasFactor).toFixed(2)} kg CO₂
                </span>
              )}
            </div>
          </div>
        </div>

        <button type="submit" className="clay-btn-interactive w-full py-2.5 flex items-center justify-center gap-2">
          <Home className="w-4 h-4" />
          <span>Log Energy Bill</span>
        </button>
      </form>

      {logs.length > 0 && (
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fg-2 font-display">
            <History className="w-4 h-4 text-muted" />
            <span>Energy History ({logs.length})</span>
          </div>

          {/* Mobile card layout */}
          <div className="sm:hidden space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="p-3 bg-surface border border-border-soft rounded-xl flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-fg">{log.month} {log.year}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {log.electricity_bill > 0 && <span className="text-[10px] text-muted">Elec: ₹{log.electricity_bill}</span>}
                    {log.gas_bill > 0 && <span className="text-[10px] text-muted">Gas: ₹{log.gas_bill}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono font-bold text-danger">{log.co2_emission.toFixed(2)} kg</p>
                </div>
                <button
                  onClick={() => onDeleteLog(log.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-border-soft shadow-clay bg-surface/50 max-h-52 no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-warm/40 font-display font-bold text-fg-2 sticky top-0">
                <tr>
                  <th className="p-3">Period</th>
                  <th className="p-3">Electricity (₹)</th>
                  <th className="p-3">Gas (₹)</th>
                  <th className="p-3 text-right">CO₂</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-warm/10 text-fg-2 font-medium">
                    <td className="p-3 font-semibold">{log.month} {log.year}</td>
                    <td className="p-3 font-mono">{log.electricity_bill > 0 ? `₹${log.electricity_bill}` : "—"}</td>
                    <td className="p-3 font-mono">{log.gas_bill > 0 ? `₹${log.gas_bill}` : "—"}</td>
                    <td className="p-3 text-right font-mono text-danger font-semibold">{log.co2_emission.toFixed(2)} kg</td>
                    <td className="p-3">
                      <button
                        onClick={() => onDeleteLog(log.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
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
