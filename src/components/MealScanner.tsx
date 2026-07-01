import React, { useState, useRef } from "react";
import { Camera, Upload, Check, AlertCircle, RefreshCw, Sparkles, Image as ImageIcon, Trash2 } from "lucide-react";
import { MealLog } from "../types";
import { EMISSION_FACTORS } from "../utils";

interface MealScannerProps {
  onAddMeal: (type: "veg" | "non-veg", description: string, co2: number) => void;
  meals: MealLog[];
  onDeleteMeal: (id: string) => void;
}

const VEG_CO2 = EMISSION_FACTORS.food.veg;
const NONVEG_CO2 = EMISSION_FACTORS.food["non-veg"];

export default function MealScanner({ onAddMeal, meals, onDeleteMeal }: MealScannerProps) {
  const [mealType, setMealType] = useState<"veg" | "non-veg">("veg");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{
    foodName: string;
    type: "veg" | "non-veg";
    co2: number;
    description: string;
    confidence: number;
    isFallback?: boolean;
  } | null>(null);
  const [errorHeader, setErrorHeader] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loadMsgIdx, setLoadMsgIdx] = useState(0);
  const loadingMessages = [
    "Analyzing food textures...",
    "Estimating organic vs carbon ratio...",
    "Computing protein greenhouse coefficient...",
    "Finalizing carbon footprint report...",
  ];

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setInterval(() => {
        setLoadMsgIdx(prev => (prev + 1) % loadingMessages.length);
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  const processFile = (file: File) => {
    if (!file.type.match(/image.*/)) {
      setErrorHeader("File must be a valid image type (PNG, JPEG, WebP).");
      return;
    }
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      const base64Bytes = result.substring(result.indexOf(",") + 1);
      setBase64Data(base64Bytes);
      setScanResult(null);
      setErrorHeader("");
    };
    reader.onerror = () => setErrorHeader("Reading file failed.");
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleStartScan = async () => {
    if (!base64Data || !imageMime) return;
    setIsLoading(true);
    setErrorHeader("");
    setScanResult(null);
    try {
      const response = await fetch("/api/gemini/scan-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Data, mimeType: imageMime })
      });
      if (!response.ok) throw new Error(`Server returned code ${response.status}`);
      const parsed = await response.json();
      if (parsed.error) throw new Error(parsed.error);
      setScanResult({
        foodName: parsed.foodName || "Discovered Cuisine",
        type: (parsed.type === "veg" || parsed.type === "non-veg") ? parsed.type : "veg",
        co2: Number(parsed.co2) || VEG_CO2,
        description: parsed.description || "A nutritious meal analyzed by Gemini.",
        confidence: parsed.confidence || 0.90,
        isFallback: parsed.isFallback,
      });
    } catch (err: any) {
      setErrorHeader(err.message || "Meal scanning failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMeal = () => {
    if (!scanResult) return;
    onAddMeal(scanResult.type, scanResult.foodName + " — " + scanResult.description, scanResult.co2);
    setSuccessMsg("Meal logged successfully!");
    setTimeout(() => setSuccessMsg(""), 4000);
    setImagePreview(null);
    setBase64Data(null);
    setImageMime(null);
    setScanResult(null);
  };

  const handleManualSave = () => {
    if (!description.trim()) return;
    const co2 = mealType === "veg" ? VEG_CO2 : NONVEG_CO2;
    onAddMeal(mealType, description.trim(), co2);
    setSuccessMsg("Meal logged successfully!");
    setTimeout(() => setSuccessMsg(""), 4000);
    setDescription("");
  };

  const handleClear = () => {
    setImagePreview(null);
    setBase64Data(null);
    setImageMime(null);
    setScanResult(null);
    setErrorHeader("");
  };

  return (
    <div id="meal-scanner-section" className="clay-card p-6 md:p-8">
      <div className="flex items-start justify-between border-b border-border-soft pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-green-100 border border-success/20 text-success">
              <Camera className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold font-display text-fg">AI Meal Scanner</h2>
          </div>
          <p className="text-xs text-muted font-medium mt-1">
            Snap a photo or manually log your meal to track dietary carbon footprint.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 bg-success/15 border border-success/30 rounded-xl flex items-center gap-2 text-success text-xs font-medium animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-fg-2 font-display">
            Quick Manual Entry
          </label>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setMealType("veg")}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                mealType === "veg"
                  ? "bg-green-100 border-green-400 text-green-800"
                  : "bg-surface border-border text-fg-2 hover:bg-surface-warm/20"
              }`}
            >
              Veg ({VEG_CO2} kg CO₂)
            </button>
            <button
              onClick={() => setMealType("non-veg")}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                mealType === "non-veg"
                  ? "bg-amber-100 border-amber-400 text-amber-800"
                  : "bg-surface border-border text-fg-2 hover:bg-surface-warm/20"
              }`}
            >
              Non-Veg ({NONVEG_CO2} kg CO₂)
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your meal (e.g. 'Dal rice with vegetables')"
              className="flex-1 px-4 py-2 border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent text-sm"
            />
            <button
              onClick={handleManualSave}
              disabled={!description.trim()}
              className="clay-btn-interactive px-4 py-2 text-xs font-bold disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-soft" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-surface text-muted font-medium">or scan with AI</span>
            </div>
          </div>

          {!imagePreview ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[150px] ${
                dragActive
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent hover:bg-surface-warm/10 bg-surface/40"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="p-3 bg-surface rounded-xl border border-border-soft shadow-clay text-muted mb-3">
                <Upload className="w-6 h-6 animate-bounce" />
              </div>
              <p className="text-xs font-bold font-display text-fg">Upload a food photo</p>
              <p className="text-[10px] text-muted font-medium mt-1">or click to browse</p>
            </div>
          ) : (
            <div className="p-4 bg-surface rounded-2xl border border-border-soft shadow-clay relative">
              <img
                src={imagePreview}
                alt="AI meal scanner food photo upload for carbon footprint analysis"
                className="w-full h-44 object-cover rounded-xl border border-border"
              />
              <div className="absolute top-6 right-6 flex gap-2">
                <button
                  onClick={handleClear}
                  className="p-1.5 bg-red-600/90 text-white rounded-lg border border-black hover:bg-red-700 shadow-clay transition-all"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {!scanResult && !isLoading && (
                <div className="mt-4">
                  <button
                    onClick={handleStartScan}
                    className="clay-btn-interactive w-full py-2.5 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 fill-white" />
                    <span>Scan with Gemini AI</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {isLoading && (
            <div className="p-6 bg-surface border border-border-soft rounded-2xl shadow-clay flex flex-col items-center text-center space-y-3 animate-pulse">
              <RefreshCw className="w-8 h-8 text-accent animate-spin" />
              <div>
                <p className="text-xs font-bold font-display text-fg">Gemini scanning...</p>
                <p className="text-[10px] text-muted font-mono mt-0.5">{loadingMessages[loadMsgIdx]}</p>
              </div>
            </div>
          )}

          {errorHeader && (
            <div className="p-3 bg-red-100 border border-red-200 rounded-xl flex items-center gap-2 text-danger text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorHeader}</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {scanResult ? (
            <div className="p-6 bg-surface border border-border-soft rounded-2xl shadow-clay flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted font-mono">
                    Scan Report
                  </span>
                  <span className="text-[10px] font-mono text-muted">
                    {(scanResult.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <h3 className="text-lg font-bold font-display text-fg leading-tight">{scanResult.foodName}</h3>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase border ${
                    scanResult.type === "veg"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-amber-50 border-amber-200 text-amber-700"
                  }`}>
                    {scanResult.type === "veg" ? "Vegetarian" : "Non-Vegetarian"}
                  </span>
                </div>
                <div className="mt-4 border-t border-border-soft pt-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-medium text-fg-2">Footprint</span>
                    <span className="text-sm font-bold font-mono text-danger">{scanResult.co2.toFixed(2)} kg CO₂</span>
                  </div>
                  <div className="w-full bg-bg border border-border-soft h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        scanResult.co2 < 1.0 ? "bg-green-500" : scanResult.co2 < 2.5 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(100, (scanResult.co2 / 5.0) * 100)}%` }}
                    />
                  </div>
                </div>
                <p className="mt-4 text-xs text-paragraph text-fg-2 leading-relaxed italic bg-bg/50 p-2.5 rounded-xl border border-border-soft">
                  "{scanResult.description}"
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveMeal}
                className="clay-btn-interactive w-full py-2.5 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Log Meal</span>
              </button>
            </div>
          ) : (
            <div className="h-full border border-dashed border-border-soft rounded-2xl bg-surface-warm/10 flex flex-col items-center justify-center text-center p-6 min-h-[180px]">
              <ImageIcon className="w-8 h-8 text-muted animate-pulse mb-2" />
              <p className="text-xs font-bold font-display text-muted">Awaiting Scan</p>
              <p className="text-[10px] text-muted max-w-[200px] mt-1">
                Upload or type a meal to see its carbon footprint.
              </p>
            </div>
          )}
        </div>
      </div>

      {meals.length > 0 && (
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fg-2 font-display">
            <ImageIcon className="w-4 h-4 text-muted" />
            <span>Meal History ({meals.length})</span>
          </div>

          {/* Mobile card layout */}
          <div className="sm:hidden space-y-2">
            {meals.map((meal) => (
              <div key={meal.id} className="p-3 bg-surface border border-border-soft rounded-xl flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-fg truncate">{meal.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                      meal.type === "veg" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {meal.type}
                    </span>
                    <span className="text-[10px] text-muted">{new Date(meal.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono font-bold text-danger">{meal.co2_emission.toFixed(2)} kg</p>
                </div>
                <button
                  onClick={() => onDeleteMeal(meal.id)}
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
                  <th className="p-3">Description</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">CO₂</th>
                  <th className="p-3 text-center">Date</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {meals.map((meal) => (
                  <tr key={meal.id} className="hover:bg-surface-warm/10 text-fg-2 font-medium">
                    <td className="p-3 max-w-[200px] truncate font-semibold">{meal.description}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                        meal.type === "veg" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {meal.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-danger font-semibold">{meal.co2_emission.toFixed(2)} kg</td>
                    <td className="p-3 text-center text-[10px] text-muted">
                      {new Date(meal.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => onDeleteMeal(meal.id)}
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
