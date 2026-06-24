import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, Navigation, Footprints, Bus, Car, Train, Plus, History, Trash2, Check, Map, X } from "lucide-react";
import { TripLog, TravelMode } from "../types";
import { calculateTravelCo2, calculateTripEcoBucks, TRAVEL_MODE_LABELS, EMISSION_FACTORS, haversineDistance } from "../utils";
import TripMap from "./TripMap";

interface TravelTrackerProps {
  onAddTrip: (distance: number, mode: TravelMode, duration: number, routeCoordinates: { lat: number; lng: number }[]) => void;
  trips: TripLog[];
  onDeleteTrip: (id: string) => void;
}

const MODE_ICONS: Record<TravelMode, React.ReactNode> = {
  car: <Car className="w-5 h-5" />,
  bus: <Bus className="w-5 h-5" />,
  train: <Train className="w-5 h-5" />,
  "walk-bike": <Footprints className="w-5 h-5" />,
};

const MODE_ORDER: TravelMode[] = ["walk-bike", "train", "bus", "car"];
const MODE_COLORS: Record<TravelMode, string> = {
  car: "#ef4444",
  bus: "#f59e0b",
  train: "#3b82f6",
  "walk-bike": "#22c55e",
};

export default function TravelTracker({ onAddTrip, trips, onDeleteTrip }: TravelTrackerProps) {
  const [mode, setMode] = useState<TravelMode>("walk-bike");
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [routeCoords, setRouteCoords] = useState<{ lat: number; lng: number }[]>([]);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | undefined>();
  const [manualDistance, setManualDistance] = useState("");
  const [activeTab, setActiveTab] = useState<"track" | "manual" | "map">("track");
  const [successMsg, setSuccessMsg] = useState("");
  const [detailTrip, setDetailTrip] = useState<TripLog | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const trackingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);

  // Real GPS tracking
  const startGps = useCallback(() => {
    if (!navigator.geolocation) {
      // Fallback to simulated tracking
      startSimulatedTracking();
      return;
    }
    setIsTracking(true);
    setDistance(0);
    setDuration(0);
    setRouteCoords([]);
    lastPosRef.current = null;
    setSuccessMsg("");

    // Position watcher for real GPS
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const currentCoord = { lat, lng };

        setRouteCoords(prev => {
          const updated = [...prev, currentCoord];
          // Calculate incremental distance using Haversine
          if (lastPosRef.current) {
            const segmentDist = haversineDistance(
              lastPosRef.current.lat, lastPosRef.current.lng,
              lat, lng
            );
            setDistance(prevDist => Number((prevDist + segmentDist).toFixed(3)));
          }
          lastPosRef.current = currentCoord;
          return updated;
        });

        setCurrentPosition([lat, lng]);
      },
      (err) => {
        console.warn("GPS error, falling back to simulation:", err.message);
        startSimulatedTracking();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    // Timer for duration
    trackingTimerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  }, [mode]);

  const startSimulatedTracking = () => {
    setIsTracking(true);
    setDistance(0);
    setDuration(0);
    setRouteCoords([]);
    lastPosRef.current = null;
    setSuccessMsg("");

    trackingTimerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
      const speedMultiplier =
        mode === "walk-bike" ? 0.005 :
        mode === "bus" ? 0.015 :
        mode === "train" ? 0.02 :
        mode === "car" ? 0.03 : 0.01;

      setDistance(prev => Number((prev + speedMultiplier).toFixed(3)));

      // Simulate route coords
      const baseLat = 19.076;
      const baseLng = 72.877;
      const newCoord = {
        lat: baseLat + (Math.random() - 0.5) * 0.01,
        lng: baseLng + (Math.random() - 0.5) * 0.01,
      };
      setRouteCoords(prev => [...prev, newCoord]);
      setCurrentPosition([newCoord.lat, newCoord.lng]);
    }, 1000);
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (trackingTimerRef.current) {
      clearInterval(trackingTimerRef.current);
      trackingTimerRef.current = null;
    }
    setCurrentPosition(undefined);

    if (distance > 0) {
      onAddTrip(Number(distance.toFixed(2)), mode, duration, routeCoords);
      setSuccessMsg(`Trip logged! ${distance.toFixed(2)} km via ${TRAVEL_MODE_LABELS[mode]}`);
      setTimeout(() => setSuccessMsg(""), 6000);
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (trackingTimerRef.current) clearInterval(trackingTimerRef.current);
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDistance = parseFloat(manualDistance);
    if (!isNaN(parsedDistance) && parsedDistance > 0) {
      onAddTrip(parsedDistance, mode, 0, []);
      setManualDistance("");
      setSuccessMsg(`Trip logged manually: ${parsedDistance} km via ${TRAVEL_MODE_LABELS[mode]}`);
      setTimeout(() => setSuccessMsg(""), 6000);
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const currentCo2 = calculateTravelCo2(mode, distance);
  const currentEcoBucks = calculateTripEcoBucks(mode, distance);

  return (
    <div id="travel-tracker-section" className="space-y-6">
      <div className="clay-card p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-soft pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-accent/10 border border-accent/20">
                <Navigation className="w-5 h-5 text-accent" />
              </span>
              <h2 className="text-xl font-bold font-display text-fg">Travel Tracker</h2>
            </div>
            <p className="text-xs text-muted font-medium mt-1">Log your commutes via GPS, manual entry, or view trip map.</p>
          </div>
        </div>

        <div className="flex bg-surface-warm/40 p-1 rounded-xl border border-border-soft mb-6">
          {(["track", "manual", "map"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => !isTracking && setActiveTab(tab)}
              disabled={isTracking}
              className={`flex-1 px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab
                  ? "bg-accent text-white shadow-clay"
                  : "text-fg-2 hover:bg-surface-warm/60 disabled:opacity-50"
              }`}
            >
              {tab === "track" ? <Play className="w-3 h-3" /> : tab === "manual" ? <Plus className="w-3 h-3" /> : <Map className="w-3 h-3" />}
              {tab === "track" ? "Live GPS" : tab === "manual" ? "Manual" : "Trip Map"}
            </button>
          ))}
        </div>

        {successMsg && (
          <div className="mb-4 p-3 bg-success/15 border border-success/30 rounded-xl flex items-center gap-2.5 text-success text-xs font-medium animate-fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-fg-2 font-display mb-3">Transport Mode</label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {MODE_ORDER.map((m) => {
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
                    {MODE_ICONS[m]}
                  </div>
                  <div>
                    <p className="text-xs font-bold font-display">{TRAVEL_MODE_LABELS[m]}</p>
                    <p className="text-[10px] text-muted font-mono mt-0.5">{calculateTravelCo2(m, 1).toFixed(2)} kg/km</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === "track" && (
          <div className="p-6 bg-surface-warm/20 rounded-2xl border border-dashed border-border-soft">
            {isTracking ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex justify-center items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full w-fit mx-auto">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                      <span className="text-xs font-bold text-accent font-mono uppercase tracking-widest">
                        {watchIdRef.current !== null ? "GPS Active" : "Simulated"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 py-4 px-6 bg-surface border border-border-soft rounded-2xl shadow-clay">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted font-display tracking-wider">Distance</p>
                        <p className="text-xl md:text-2xl font-bold font-mono text-accent mt-0.5">{distance.toFixed(3)}</p>
                        <p className="text-[9px] text-muted font-medium">km</p>
                      </div>
                      <div className="border-x border-border-soft">
                        <p className="text-[10px] uppercase font-bold text-muted font-display tracking-wider">Duration</p>
                        <p className="text-xl md:text-2xl font-bold font-mono text-fg mt-0.5">{formatDuration(duration)}</p>
                        <p className="text-[9px] text-muted font-medium">min</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted font-display tracking-wider">Live CO₂</p>
                        <p className="text-xl md:text-2xl font-bold font-mono text-danger mt-0.5">{currentCo2.toFixed(3)}</p>
                        <p className="text-[9px] text-muted font-medium">kg</p>
                      </div>
                    </div>

                    <button
                      onClick={stopTracking}
                      className="w-full px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop & Save Trip</span>
                    </button>
                  </div>

                  <div className="h-[300px] rounded-xl overflow-hidden border border-border-soft">
                    <TripMap
                      trips={[]}
                      currentPosition={currentPosition}
                      currentPolyline={routeCoords.map(c => [c.lat, c.lng] as [number, number])}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 max-w-sm mx-auto">
                <div className="p-4 bg-surface rounded-2xl border border-border-soft shadow-clay w-16 h-16 flex items-center justify-center mx-auto text-accent">
                  <Navigation className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-fg">Ready to go?</h3>
                  <p className="text-xs text-muted font-medium mt-1">GPS tracking will log your route on the map.</p>
                </div>
                <button onClick={startGps} className="clay-btn-interactive px-6 py-2.5 flex items-center gap-2 mx-auto">
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start GPS Tracking</span>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "manual" && (
          <form onSubmit={handleManualSubmit} className="p-6 bg-surface border border-border-soft rounded-2xl shadow-clay space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="travel-distance-field" className="block text-xs font-bold text-fg-2">Distance (km)</label>
                <input id="travel-distance-field" type="number" step="0.01" min="0.1" required value={manualDistance}
                  onChange={(e) => setManualDistance(e.target.value)} placeholder="e.g. 12.5"
                  className="w-full px-4 py-2 border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-fg-2">Calculated</label>
                <div className="p-2 border border-dashed border-border rounded-xl bg-surface-warm/20 grid grid-cols-2 gap-2 text-center h-10 items-center">
                  <span className="text-xs font-mono font-semibold text-danger">
                    +{((manualDistance ? parseFloat(manualDistance) : 0) * EMISSION_FACTORS.travel[mode]).toFixed(2)} kg
                  </span>
                  <span className="text-xs font-mono font-semibold text-success border-l border-border-soft">
                    +{calculateTripEcoBucks(mode, manualDistance ? parseFloat(manualDistance) : 0)} Bucks
                  </span>
                </div>
              </div>
            </div>
            <button type="submit" className="clay-btn-interactive w-full px-5 py-2.5 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> <span>Log Trip</span>
            </button>
          </form>
        )}

        {activeTab === "map" && (
          <div className="h-[450px] rounded-2xl overflow-hidden border border-border-soft">
            <TripMap trips={trips} onTripSelect={(id) => setDetailTrip(trips.find(t => t.id === id) || null)} />
          </div>
        )}
      </div>

      {/* Trip Detail Overlay */}
      {detailTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="clay-card p-6 max-w-2xl w-full bg-[#fff8f1] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold font-display text-fg">Trip Detail</h3>
                <p className="text-xs text-muted">{new Date(detailTrip.createdAt).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
              </div>
              <button onClick={() => setDetailTrip(null)} className="text-muted hover:text-fg"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-surface rounded-xl border border-border-soft">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-muted">Mode</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {MODE_ICONS[detailTrip.mode]}
                  <span className="text-xs font-bold">{TRAVEL_MODE_LABELS[detailTrip.mode]}</span>
                </div>
              </div>
              <div className="text-center border-x border-border-soft">
                <p className="text-[10px] uppercase font-bold text-muted">Distance</p>
                <p className="text-sm font-bold font-mono mt-1">{detailTrip.distance.toFixed(1)} km</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-muted">CO₂</p>
                <p className="text-sm font-bold font-mono text-danger mt-1">{detailTrip.co2_emission.toFixed(2)} kg</p>
              </div>
            </div>

            {detailTrip.routeCoordinates && detailTrip.routeCoordinates.length > 1 && (
              <div className="h-[300px] rounded-xl overflow-hidden border border-border-soft mb-4">
                <TripMap trips={[detailTrip]} selectedTripId={detailTrip.id} />
              </div>
            )}

            <button onClick={() => setDetailTrip(null)} className="w-full py-2 bg-accent text-white font-bold rounded-xl border border-black transition-all">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Trip History */}
      {trips.length > 0 && (
        <div className="clay-card p-6 md:p-8">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fg-2 font-display mb-3">
            <History className="w-4 h-4 text-muted" />
            <span>Trip History ({trips.length})</span>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
            {trips.map(trip => (
              <div
                key={trip.id}
                onClick={() => setDetailTrip(trip)}
                className="flex items-center gap-4 p-3 bg-surface/50 hover:bg-surface-warm/20 rounded-xl border border-border-soft cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: MODE_COLORS[trip.mode] + "20" }}>
                  {MODE_ICONS[trip.mode]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-fg">{TRAVEL_MODE_LABELS[trip.mode]}</p>
                  <p className="text-[10px] text-muted">{trip.distance.toFixed(1)} km · {new Date(trip.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-danger">{trip.co2_emission.toFixed(2)} kg</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteTrip(trip.id); }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
