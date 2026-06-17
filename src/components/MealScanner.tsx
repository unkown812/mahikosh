import React, { useState, useRef } from "react";
import { Camera, Upload, Check, AlertCircle, RefreshCw, Trash2, ShieldAlert, Sparkles, Image as ImageIcon } from "lucide-react";
import { MealLog } from "../types";

interface MealScannerProps {
  onAddMeal: (foodName: string, type: "veg" | "non-veg", co2: number, description: string, confidence: number) => void;
  meals: MealLog[];
  onDeleteMeal: (id: string) => void;
}

export default function MealScanner({ onAddMeal, meals, onDeleteMeal }: MealScannerProps) {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Encouraging loading messages to improve UX (VEO/Gemini design guideline)
  const [loadMsgIdx, setLoadMsgIdx] = useState(0);
  const loadingMessages = [
    "Analyzing food textures...",
    "Estimating organic vs carbon ratio...",
    "Querying agricultural supply chain metrics...",
    "Computing protein greenhouse coefficient...",
    "Finalizing carbon footprint report..."
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

  // Sample quick food selection presets to test the system easily
  const foodPresets = [
    {
      name: "Avocado Sourdough Toast",
      type: "veg" as const,
      co2: 0.45,
      description: "Low carbon footprint! Toast with organic avocado and a squeeze of lemon. Sparing meat emissions.",
      confidence: 0.98,
      imgUrl: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&q=80&w=120"
    },
    {
      name: "Standard Grilled Beef Burger",
      type: "non-veg" as const,
      co2: 4.80,
      description: "Red beef burgers have extremely high methane & land offsets. Generating 4.8kg CO2 equivalent per portion.",
      confidence: 0.94,
      imgUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=120"
    },
    {
      name: "Mixed Lentil Curry & Rice",
      type: "veg" as const,
      co2: 0.58,
      description: "Lentils are high-protein nitrogen fixers, meaning minimal fertilizer emissions and a brilliant low carbon footprint.",
      confidence: 0.97,
      imgUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=120"
    }
  ];

  // Helper: Convert File to Base64
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
      // Strip off "data:image/jpeg;base64," etc for the raw string
      const base64Bytes = result.substring(result.indexOf(",") + 1);
      setBase64Data(base64Bytes);
      setScanResult(null);
      setErrorHeader("");
    };
    reader.onerror = () => {
      setErrorHeader("Reading file failed.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Drag-and-drop handlers (Usability Patterns Requirement)
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Trigger Gemini vision API scan from Express server
  const handleStartScan = async () => {
    if (!base64Data || !imageMime) return;

    setIsLoading(true);
    setErrorHeader("");
    setScanResult(null);

    try {
      const response = await fetch("/api/gemini/scan-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Data,
          mimeType: imageMime
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned code ${response.status}`);
      }

      const parsed = await response.json();
      if (parsed.error) {
        throw new Error(parsed.error);
      }

      setScanResult({
        foodName: parsed.foodName || "Discovered Cuisine",
        type: (parsed.type === "veg" || parsed.type === "non-veg") ? parsed.type : "veg",
        co2: Number(parsed.co2) || 1.1,
        description: parsed.description || "A nutritious meal analyzed by Gemini Vision.",
        confidence: parsed.confidence || 0.90,
        isFallback: parsed.isFallback
      });
    } catch (err: any) {
      console.error(err);
      setErrorHeader(err.message || "Meal scanning failed due to connectivity disruption.");
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate scanning for presets immediately to increase onboarding efficiency
  const handleSelectPreset = (p: typeof foodPresets[0]) => {
    setImagePreview(p.imgUrl);
    setScanResult({
      foodName: p.name,
      type: p.type,
      co2: p.co2,
      description: p.description,
      confidence: p.confidence,
      isFallback: false
    });
    setErrorHeader("");
  };

  const handleSaveMeal = () => {
    if (!scanResult) return;
    onAddMeal(
      scanResult.foodName,
      scanResult.type,
      scanResult.co2,
      scanResult.description,
      scanResult.confidence
    );
    // Clear state
    setImagePreview(null);
    setBase64Data(null);
    setImageMime(null);
    setScanResult(null);
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
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border-soft pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-green-100 border border-success/20 text-success">
              <Camera className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold font-display text-fg">AI Diet & Meal Scanner</h2>
          </div>
          <p className="text-xs text-muted font-medium mt-1">
            Snap or upload photos of your dishes. Our server-side Gemini Vision scans ingredients to map carbon values.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Core Uploader */}
        <div className="lg:col-span-3 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-fg-2 font-display">
            Upload Food Photograph or Use Presets
          </label>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            {foodPresets.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className="flex items-center gap-2 p-1.5 pr-3 bg-surface hover:bg-surface-warm/20 border border-border rounded-xl shadow-clay text-left text-xs text-fg-2 transition-all hover:scale-[1.01]"
              >
                <img
                  src={p.imgUrl}
                  alt={p.name}
                  className="w-8 h-8 rounded-lg object-cover border border-border-soft"
                />
                <div className="leading-tight">
                  <p className="font-semibold text-[11px] truncate max-w-[130px]">{p.name}</p>
                  <span className={`text-[9px] font-bold uppercase ${p.type === "veg" ? "text-success" : "text-amber-700"}`}>
                    {p.type}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* File input / Drag & drop */}
          {!imagePreview ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[190px] ${
                dragActive
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent hover:bg-surface-warm/10 bg-surface/40"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                id="file-input-diet"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="p-3 bg-surface rounded-xl border border-border-soft shadow-clay text-muted mb-3">
                <Upload className="w-6 h-6 animate-bounce" />
              </div>
              <p className="text-xs font-bold font-display text-fg">Drag & Drop food image here</p>
              <p className="text-[10px] text-muted font-medium mt-1">or click to browse your desktop</p>
            </div>
          ) : (
            <div className="p-4 bg-surface rounded-2xl border border-border-soft shadow-clay relative">
              <img
                src={imagePreview}
                alt="Meal submission preview"
                className="w-full h-44 object-cover rounded-xl border border-border"
              />
              
              <div className="absolute top-6 right-6 flex gap-2">
                <button
                  onClick={handleClear}
                  className="p-1.5 bg-red-600/90 text-white rounded-lg border border-black hover:bg-red-700 shadow-clay transition-all"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {!scanResult && !isLoading && (
                <div className="mt-4 flex gap-4">
                  <button
                    onClick={handleStartScan}
                    className="clay-btn-interactive w-full py-2.5 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 fill-white" />
                    <span>Run Gemini AI Food Classification</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Loader */}
          {isLoading && (
            <div className="p-6 bg-surface border border-border-soft rounded-2xl shadow-clay flex flex-col items-center text-center space-y-3 animate-pulse">
              <RefreshCw className="w-8 h-8 text-accent animate-spin" />
              <div>
                <p className="text-xs font-bold font-display text-fg">Gemini Vision parsing nutrition...</p>
                <p className="text-[10px] text-muted font-mono mt-0.5">{loadingMessages[loadMsgIdx]}</p>
              </div>
            </div>
          )}

          {/* Error messages */}
          {errorHeader && (
            <div className="p-3 bg-red-100 border border-red-200 rounded-xl flex items-center gap-2 text-danger text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorHeader}</span>
            </div>
          )}
        </div>

        {/* Scan Result Details output */}
        <div className="lg:col-span-2">
          {scanResult ? (
            <div className="p-6 bg-surface border border-border-soft rounded-2xl shadow-clay flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted font-mono">
                    Scan Report
                  </span>
                  <span className="text-[10px] font-mono text-muted">
                    Confidence: {(scanResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <h3 className="text-lg font-bold font-display text-fg leading-tight">
                  {scanResult.foodName}
                </h3>

                {/* Diet Type Badge representation */}
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span
                    className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase border ${
                      scanResult.type === "veg"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-amber-50 border-amber-200 text-amber-700"
                    }`}
                  >
                    {scanResult.type === "veg" ? "🌱 Pure Vegetarian" : "🍗 Non-Vegetarian"}
                  </span>
                  {scanResult.isFallback && (
                    <span className="px-2 py-0.5 bg-surface-warm/40 border border-border text-muted text-[8px] uppercase font-mono rounded">
                      Demo Fallback
                    </span>
                  )}
                </div>

                {/* Carbon intensity indicator */}
                <div className="mt-4 border-t border-border-soft pt-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-medium text-fg-2">Estimated Footprint</span>
                    <span className="text-sm font-bold font-mono text-danger">
                      {scanResult.co2.toFixed(2)} kg CO₂
                    </span>
                  </div>
                  <div className="w-full bg-bg border border-border-soft h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        scanResult.co2 < 1.0
                          ? "bg-green-500"
                          : scanResult.co2 < 2.5
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(100, (scanResult.co2 / 5.0) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-muted text-right mt-1 font-mono">
                    Intensity: {scanResult.co2 < 1.5 ? "Low carbon" : "High carbon"} (relative to 5kg beef baseline)
                  </p>
                </div>

                <p className="mt-4 text-xs text-paragraph text-fg-2 leading-relaxed italic bg-bg/50 p-2.5 rounded-xl border border-border-soft">
                  "{scanResult.description}"
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveMeal}
                  className="clay-btn-interactive w-full py-2.5 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Log Meal & Claim EcoBucks</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full border border-dashed border-border-soft rounded-2xl bg-surface-warm/10 flex flex-col items-center justify-center text-center p-6 min-h-[180px]">
              <ImageIcon className="w-8 h-8 text-muted animate-pulse mb-2" />
              <p className="text-xs font-bold font-display text-muted">Awaiting Food Image Scan</p>
              <p className="text-[10px] text-muted max-w-[200px] mt-1">
                Once scanned, Gemini details food name, meat presence, and carbon mass.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* History log */}
      {meals.length > 0 && (
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fg-2 font-display">
            <ImageIcon className="w-4 h-4 text-muted" />
            <span>AI Food Scan History ({meals.length})</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border-soft shadow-clay bg-surface/50 max-h-52 no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-warm/40 font-display font-bold text-fg-2 sticky top-0">
                <tr>
                  <th className="p-3">Dish / Food Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">CO₂ Emission</th>
                  <th className="p-3 text-center">Confidence</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {meals.map((meal) => (
                  <tr key={meal.id} className="hover:bg-surface-warm/10 text-fg-2 font-medium">
                    <td className="p-3">
                      <p className="font-semibold">{meal.foodName}</p>
                      <p className="text-[10px] text-muted max-w-sm truncate">{meal.description}</p>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                        meal.type === "veg" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {meal.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-danger font-semibold">
                      {meal.co2_emission.toFixed(2)} kg
                    </td>
                    <td className="p-3 text-center font-mono text-muted">
                      {(meal.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => onDeleteMeal(meal.id)}
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
