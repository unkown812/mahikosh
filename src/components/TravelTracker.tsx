import React, { useState, useEffect, useRef } from "react";
import { Play, Square, Navigation, Footprints, Bus, Car, Zap, Shield, Plus, History, Trash2, Check } from "lucide-react";
import { TripLog, TravelMode } from "../types";
import { calculateTravelCo2, calculateTripEcoBucks, TRAVEL_MODE_LABELS, EMISSION_FACTORS } from "../utils";

interface TravelTrackerProps {
  onAddTrip: (distance: number, mode: TravelMode) => void;
  trips: TripLog[];
  onDeleteTrip: (id: string) => void;
}

export default function TravelTracker({ onAddTrip, trips, onDeleteTrip }: TravelTrackerProps) {
  const [mode, setMode] = useState<TravelMode>("active_travel");
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(0); // in km
  const [duration, setDuration] = useState(0); // in seconds
  const [manualDistance, setManualDistance] = useState("");
  const [activeTab, setActiveTab] = useState<"track" | "manual">("track");
  const [successMsg, setSuccessMsg] = useState("");

  const trackingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTracking) {
      trackingTimerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
        // Simulate travel distance. Active travel is slower (e.g. 1.2m/s), cars are faster (e.g. 15m/s)
        const speedMultiplier = 
          mode === "active_travel" ? 0.005 :
          mode === "public_transit" ? 0.015 :
          mode === "electric_car" ? 0.025 : 0.03; // km per second
          
        setDistance(prev => Number((prev + speedMultiplier).toFixed(3)));
      }, 1000);
    } else {
      if (trackingTimerRef.current) {
        clearInterval(trackingTimerRef.current);
      }
    }

    return () => {
      if (trackingTimerRef.current) {
        clearInterval(trackingTimerRef.current);
      }
    };
  }, [isTracking, mode]);

  // Start tracking trip
  const handleStart = () => {
    setDistance(0);
    setDuration(0);
    setIsTracking(true);
    setSuccessMsg("");
  };

  // Stop tracking trip and save
  const handleStop = () => {
    setIsTracking(false);
    if (distance > 0) {
      onAddTrip(Number(distance.toFixed(2)), mode);
      setSuccessMsg(`Trip logged successfully! You traveled ${distance.toFixed(2)} km via ${TRAVEL_MODE_LABELS[mode]}!`);
      setTimeout(() => setSuccessMsg(""), 6000);
    }
  };

  // Manual Trip addition
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDistance = parseFloat(manualDistance);
    if (!isNaN(parsedDistance) && parsedDistance > 0) {
      onAddTrip(parsedDistance, mode);
      setManualDistance("");
      setSuccessMsg(`Trip logged manually: ${parsedDistance} km using ${TRAVEL_MODE_LABELS[mode]}!`);
      setTimeout(() => setSuccessMsg(""), 6000);
    }
  };

  // Format second duration as mm:ss
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getModeIcon = (m: TravelMode, sizeClass = "w-5 h-5") => {
    switch (m) {
      case "active_travel": return <Footprints className={sizeClass} />;
      case "public_transit": return <Bus className={sizeClass} />;
      case "electric_car": return <Zap className={sizeClass} />;
      case "petrol_car": return <Car className={sizeClass} />;
    }
  };

  const currentCo2 = calculateTravelCo2(mode, distance);
  const currentEcoBucks = calculateTripEcoBucks(mode, distance);

  return (
    <div id="travel-tracker-section" className="clay-card p-6 md:p-8">
      {/* Tracker heading */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-soft pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-accent/10 border border-accent/20">
              <Navigation className="w-5 h-5 text-accent" />
            </span>
            <h2 className="text-xl font-bold font-display text-fg">Travel & Commutes</h2>
          </div>
          <p className="text-xs text-muted font-medium mt-1">
            Track real-time carbon offsets or manually append trip parameters.
          </p>
        </div>

        {/* Tab options */}
        <div className="flex bg-surface-warm/40 p-1 rounded-xl border border-border-soft self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setActiveTab("track")}
            disabled={isTracking}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "track"
                ? "bg-accent text-white shadow-clay"
                : "text-fg-2 hover:bg-surface-warm/60 disabled:opacity-50"
            }`}
          >
            Live Tracking
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            disabled={isTracking}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "manual"
                ? "bg-accent text-white shadow-clay"
                : "text-fg-2 hover:bg-surface-warm/60 disabled:opacity-50"
            }`}
          >
            Manual Logs
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 bg-success/15 border border-success/30 rounded-xl flex items-center gap-2.5 text-success text-xs font-medium animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Mode selectors */}
      <div className="mb-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-fg-2 font-display mb-3">
          Select Your Mode of Transport
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(["active_travel", "public_transit", "electric_car", "petrol_car"] as TravelMode[]).map((m) => {
            const isSelected = mode === m;
            return (
              <button
                key={m}
                onClick={() => !isTracking && setMode(m)}
                disabled={isTracking}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 text-center transition-all ${
                  isSelected
                    ? "border-2 border-accent bg-accent/5 text-accent font-semibold"
                    : "border-border hover:border-accent hover:bg-surface-warm/20 text-fg shadow-clay bg-surface/50 opacity-80"
                } disabled:opacity-50`}
              >
                <div className={`p-2.5 rounded-xl border transition-all ${isSelected ? "bg-accent text-white" : "bg-bg border-border text-fg-2"}`}>
                  {getModeIcon(m, "w-6 h-6")}
                </div>
                <div>
                  <p className="text-xs font-bold font-display">{TRAVEL_MODE_LABELS[m]}</p>
                  <p className="text-[10px] text-muted font-mono mt-0.5">
                    {calculateTravelCo2(m, 1).toFixed(2)} kg CO₂/km
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content 1: Interactive Live HUD */}
      {activeTab === "track" ? (
        <div className="p-6 bg-surface-warm/20 rounded-2xl border border-dashed border-border-soft flex flex-col items-center justify-center min-h-[220px]">
          {isTracking ? (
            <div className="w-full max-w-md text-center space-y-6">
              {/* Pulse Indicator */}
              <div className="flex justify-center items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full w-fit mx-auto">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                <span className="text-xs font-bold text-accent font-mono uppercase tracking-widest">
                  Live Trip GPS Active
                </span>
              </div>

              {/* LIVE COUNTER DISPLAY */}
              <div className="grid grid-cols-3 gap-4 py-4 px-6 bg-surface border border-border-soft rounded-2xl shadow-clay">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted font-display tracking-wider">Distance</p>
                  <p className="text-xl md:text-2xl font-bold font-mono text-accent mt-0.5">{distance.toFixed(3)}</p>
                  <p className="text-[9px] text-muted font-medium">Kilometers</p>
                </div>
                <div className="border-x border-border-soft">
                  <p className="text-[10px] uppercase font-bold text-muted font-display tracking-wider">Duration</p>
                  <p className="text-xl md:text-2xl font-bold font-mono text-fg mt-0.5">{formatDuration(duration)}</p>
                  <p className="text-[9px] text-muted font-medium">Minutes</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted font-display tracking-wider">Live CO₂</p>
                  <p className="text-xl md:text-2xl font-bold font-mono text-danger mt-0.5">{currentCo2.toFixed(3)}</p>
                  <p className="text-[9px] text-muted font-medium">kg Carbon</p>
                </div>
              </div>

              <div className="flex justify-center items-center gap-4">
                <div className="text-xs bg-success/15 border border-success/30 text-success font-semibold py-1.5 px-4 rounded-xl flex items-center gap-1.5 animate-bounce">
                  <Shield className="w-3.5 h-3.5" />
                  <span>+{currentEcoBucks} EcoBucks Accumulated</span>
                </div>
              </div>

              {/* End Button */}
              <button
                onClick={handleStop}
                className="w-full md:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full flex items-center justify-center gap-2.5 mx-auto transition-all"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Complete Eco-commute</span>
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4 max-w-sm">
              <div className="p-4 bg-surface rounded-2xl border border-border-soft shadow-clay w-16 h-16 flex items-center justify-center mx-auto text-accent">
                <Navigation className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-fg">Ready to head out?</h3>
                <p className="text-xs text-muted font-medium mt-1">
                  Start our smart travel logger when you step out. Our live GPS simulation tracks mileage and awards you points!
                </p>
              </div>
              <button
                onClick={handleStart}
                className="clay-btn-interactive px-6 py-2.5 flex items-center gap-2 mx-auto"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Commuting</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Tab content 2: Manual Log */
        <form onSubmit={handleManualSubmit} className="p-6 bg-surface border border-border-soft rounded-2xl shadow-clay space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="travel-distance-field" className="block text-xs font-bold text-fg-2">
                Distance Traveled (in km)
              </label>
              <input
                id="travel-distance-field"
                type="number"
                step="0.01"
                min="0.1"
                required
                value={manualDistance}
                onChange={(e) => setManualDistance(e.target.value)}
                placeholder="e.g. 12.5"
                className="w-full px-4 py-2 border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent text-sm"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-fg-2">Calculated Outcomes</label>
              <div className="p-2 border border-dashed border-border rounded-xl bg-surface-warm/20 grid grid-cols-2 gap-2 text-center h-10 align-middle items-center">
                <span className="text-xs font-mono font-semibold text-danger">
                  +{((manualDistance ? parseFloat(manualDistance) : 0) * EMISSION_FACTORS.travel[mode]).toFixed(2)} kg CO₂
                </span>
                <span className="text-xs font-mono font-semibold text-success border-l border-border-soft">
                  +{calculateTripEcoBucks(mode, manualDistance ? parseFloat(manualDistance) : 0)} EcoBucks
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="clay-btn-interactive w-full px-5 py-2.5 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Append Commute Record</span>
          </button>
        </form>
      )}

      {/* History Log Table */}
      {trips.length > 0 && (
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fg-2 font-display">
            <History className="w-4 h-4 text-muted" />
            <span>Travel History Records ({trips.length})</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border-soft shadow-clay bg-surface/50 max-h-60 no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-warm/40 font-display font-bold text-fg-2 sticky top-0">
                <tr>
                  <th className="p-3">Transport Mode</th>
                  <th className="p-3">Distance</th>
                  <th className="p-3 text-right">CO₂ Emission</th>
                  <th className="p-3 text-center">Date</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {trips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-surface-warm/10 text-fg-2 font-medium">
                    <td className="p-3 flex items-center gap-2">
                      <span className="text-muted">{getModeIcon(trip.mode, "w-4 h-4")}</span>
                      <span>{TRAVEL_MODE_LABELS[trip.mode]}</span>
                    </td>
                    <td className="p-3 font-mono">{trip.distance.toFixed(1)} km</td>
                    <td className="p-3 text-right font-mono text-danger font-semibold">
                      {trip.co2_emission.toFixed(2)} kg
                    </td>
                    <td className="p-3 text-center text-[10px] text-muted">
                      {new Date(trip.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => onDeleteTrip(trip.id)}
                        className="p-1 px-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete record"
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
