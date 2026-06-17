import React, { useState, useEffect } from "react";
import {
  Navigation,
  Camera,
  Home,
  Gift,
  Award,
  Sparkles,
  Layers,
  Leaf,
  LogOut,
  User,
  Activity,
  Trash2,
  TrendingDown,
  Percent,
  Calendar,
  AlertCircle
} from "lucide-react";
import { UserProfile, TripLog, MealLog, EnergyLog, RewardItem, TravelMode } from "./types";
import {
  calculateTravelCo2,
  calculateEnergyCo2,
  calculateTripEcoBucks,
  determineEcoLevel,
  REWARDS_CATALOG
} from "./utils";
import MetricCard from "./components/MetricCard";
import TravelTracker from "./components/TravelTracker";
import MealScanner from "./components/MealScanner";
import EnergyLogger from "./components/EnergyLogger";
import EcoInsights from "./components/EcoInsights";
import RewardsStore from "./components/RewardsStore";
import DashboardCharts from "./components/DashboardCharts";

// Default pre-populated seed data for first-time premium demonstration (User retains fully printable and clearable state)
const INITIAL_TRIPS: TripLog[] = [
  {
    id: "seed-t1",
    userId: "u123",
    distance: 12.0,
    mode: "public_transit",
    co2_emission: 0.96,
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  },
  {
    id: "seed-t2",
    userId: "u123",
    distance: 4.5,
    mode: "active_travel",
    co2_emission: 0,
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  }
];

const INITIAL_MEALS: MealLog[] = [
  {
    id: "seed-m1",
    userId: "u123",
    foodName: "Steamed Vegetable Dumplings",
    type: "veg",
    co2_emission: 0.35,
    description: "Steam-cooked organic dumpling pockets, sparing high livestock carbon offsets.",
    confidence: 0.97,
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
  }
];

const INITIAL_ENERGY: EnergyLog[] = [
  {
    id: "seed-e1",
    userId: "u123",
    electricity_bill: 50.0,
    gas_bill: 3.5,
    co2_emission: 46.25, // (50 * 0.82) + (3.5 * 1.5)
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString()
  }
];

export default function App() {
  // --- STATE DEFINITIONS ---
  const [profile, setProfile] = useState<UserProfile>({
    uid: "u123",
    email: "mrunaljogane@gmail.com",
    displayName: "Mrunal Jogane",
    eco_bucks: 110, // Initial seed balance mimicking achievements
    level: "EcoStarter",
    total_co2: 47.56, // Cumulative seed co2 total
    goals: {
      monthly_co2_target: 200 // kg CO2 maximum
    }
  });

  const [trips, setTrips] = useState<TripLog[]>([]);
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [energyLogs, setEnergyLogs] = useState<EnergyLog[]>([]);
  const [redeemedRewards, setRedeemedRewards] = useState<RewardItem[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"dashboard" | "travel" | "food" | "energy" | "rewards">("dashboard");

  // Profile Customization Modal / Form state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editGoal, setEditGoal] = useState("");

  // --- LOCAL PERSISTENCE SYNCING ON MOUNT ---
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("ecotrack_profile");
      const savedTrips = localStorage.getItem("ecotrack_trips");
      const savedMeals = localStorage.getItem("ecotrack_meals");
      const savedEnergy = localStorage.getItem("ecotrack_energy");
      const savedRewards = localStorage.getItem("ecotrack_rewards");

      if (savedProfile) setProfile(JSON.parse(savedProfile));
      
      if (savedTrips) {
        setTrips(JSON.parse(savedTrips));
      } else {
        setTrips(INITIAL_TRIPS);
        localStorage.setItem("ecotrack_trips", JSON.stringify(INITIAL_TRIPS));
      }

      if (savedMeals) {
        setMeals(JSON.parse(savedMeals));
      } else {
        setMeals(INITIAL_MEALS);
        localStorage.setItem("ecotrack_meals", JSON.stringify(INITIAL_MEALS));
      }

      if (savedEnergy) {
        setEnergyLogs(JSON.parse(savedEnergy));
      } else {
        setEnergyLogs(INITIAL_ENERGY);
        localStorage.setItem("ecotrack_energy", JSON.stringify(INITIAL_ENERGY));
      }

      if (savedRewards) setRedeemedRewards(JSON.parse(savedRewards));
    } catch (e) {
      console.error("Failed to recover localized state configurations:", e);
    }
  }, []);

  // --- DYNAMIC PARAMETERS STATE SYNCHRONIZATION ---
  const updateLocalStorageAndState = (
    newTrips: TripLog[],
    newMeals: MealLog[],
    newEnergy: EnergyLog[],
    newRewards: RewardItem[],
    ecoBucksModifier = 0,
    directOverrideBucks?: number
  ) => {
    // 1. Calculate new total Carbon
    const tripSum = newTrips.reduce((sum, t) => sum + t.co2_emission, 0);
    const mealSum = newMeals.reduce((sum, m) => sum + m.co2_emission, 0);
    const energySum = newEnergy.reduce((sum, e) => sum + e.co2_emission, 0);
    const totalCarbon = tripSum + mealSum + energySum;

    // 2. Adjust EcoBucks balance
    let finalEcoBucks = directOverrideBucks !== undefined ? directOverrideBucks : profile.eco_bucks + ecoBucksModifier;
    if (finalEcoBucks < 0) finalEcoBucks = 0;

    // 3. Determine Level
    const finalLevel = determineEcoLevel(finalEcoBucks);

    const updatedProfile = {
      ...profile,
      total_co2: Number(totalCarbon.toFixed(2)),
      eco_bucks: finalEcoBucks,
      level: finalLevel
    };

    setProfile(updatedProfile);
    setTrips(newTrips);
    setMeals(newMeals);
    setEnergyLogs(newEnergy);
    setRedeemedRewards(newRewards);

    // Persist completely
    localStorage.setItem("ecotrack_profile", JSON.stringify(updatedProfile));
    localStorage.setItem("ecotrack_trips", JSON.stringify(newTrips));
    localStorage.setItem("ecotrack_meals", JSON.stringify(newMeals));
    localStorage.setItem("ecotrack_energy", JSON.stringify(newEnergy));
    localStorage.setItem("ecotrack_rewards", JSON.stringify(newRewards));
  };

  // --- ACTIONS HANDLERS ---

  // 1. Add Travel Trip
  const handleAddTrip = (distance: number, mode: TravelMode) => {
    const emission = calculateTravelCo2(mode, distance);
    const ecoBucksAwarded = calculateTripEcoBucks(mode, distance);

    const newTrip: TripLog = {
      id: `t-${Date.now()}`,
      userId: profile.uid,
      distance,
      mode,
      co2_emission: Number(emission.toFixed(2)),
      createdAt: new Date().toISOString()
    };

    const nextTrips = [newTrip, ...trips];
    updateLocalStorageAndState(nextTrips, meals, energyLogs, redeemedRewards, ecoBucksAwarded);
  };

  // Delete Trip
  const handleDeleteTrip = (id: string) => {
    const target = trips.find(t => t.id === id);
    if (!target) return;
    const nextTrips = trips.filter(t => t.id !== id);
    // Deduct points earned for that trip
    const pointsToDeduct = -calculateTripEcoBucks(target.mode, target.distance);
    updateLocalStorageAndState(nextTrips, meals, energyLogs, redeemedRewards, pointsToDeduct);
  };

  // 2. Add Diet Meal
  const handleAddMeal = (foodName: string, type: "veg" | "non-veg", co2: number, description: string, confidence: number) => {
    // Dietary bonus points: 15 EcoBucks for pure vegetable options, 5 for non-veg tracking
    const pointsAwarded = type === "veg" ? 15 : 5;

    const newMeal: MealLog = {
      id: `m-${Date.now()}`,
      userId: profile.uid,
      foodName,
      type,
      co2_emission: Number(co2.toFixed(2)),
      description,
      confidence,
      createdAt: new Date().toISOString()
    };

    const nextMeals = [newMeal, ...meals];
    updateLocalStorageAndState(trips, nextMeals, energyLogs, redeemedRewards, pointsAwarded);
  };

  // Delete Meal
  const handleDeleteMeal = (id: string) => {
    const target = meals.find(m => m.id === id);
    if (!target) return;
    const nextMeals = meals.filter(m => m.id !== id);
    const pointsToDeduct = target.type === "veg" ? -15 : -5;
    updateLocalStorageAndState(trips, nextMeals, energyLogs, redeemedRewards, pointsToDeduct);
  };

  // 3. Add Home Energy log
  const handleAddEnergyLog = (electricity: number, gas: number) => {
    const emission = calculateEnergyCo2(electricity, gas);
    // Flat 25 EcoBucks reward for monthly billing inventory mindfulness!
    const pointsAwarded = 25;

    const newLog: EnergyLog = {
      id: `e-${Date.now()}`,
      userId: profile.uid,
      electricity_bill: electricity,
      gas_bill: gas,
      co2_emission: Number(emission.toFixed(2)),
      createdAt: new Date().toISOString()
    };

    const nextEnergy = [newLog, ...energyLogs];
    updateLocalStorageAndState(trips, meals, nextEnergy, redeemedRewards, pointsAwarded);
  };

  // Delete Energy Log
  const handleDeleteEnergy = (id: string) => {
    const nextEnergy = energyLogs.filter(e => e.id !== id);
    updateLocalStorageAndState(trips, meals, nextEnergy, redeemedRewards, -25);
  };

  // 4. Redeem Reward
  const handleRedeemReward = (rewardId: string, cost: number) => {
    const catalogItem = REWARDS_CATALOG.find(r => r.id === rewardId);
    if (!catalogItem || profile.eco_bucks < cost) return;

    // Generate random mock coupon code matching clean B2B design formats
    const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const num = "0123456789";
    const getRandomStr = (src: string, len: number) => Array.from({ length: len }, () => src[Math.floor(Math.random() * src.length)]).join("");
    const couponCode = `ECO-${getRandomStr(alpha, 4)}-${getRandomStr(num, 4)}`;

    const redeemedItem: RewardItem = {
      ...catalogItem,
      couponCode,
      redeemedAt: new Date().toISOString()
    };

    const nextRewards = [...redeemedRewards, redeemedItem];
    updateLocalStorageAndState(trips, meals, energyLogs, nextRewards, -cost);
  };

  // --- SAVE CUSTOMIZED PROFILE ---
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...profile,
      displayName: editName.trim() || profile.displayName,
      goals: {
        monthly_co2_target: parseInt(editGoal) || profile.goals.monthly_co2_target
      }
    };
    setProfile(updated);
    localStorage.setItem("ecotrack_profile", JSON.stringify(updated));
    setIsEditProfileOpen(false);
  };

  // Open Modal Helpers
  const handleOpenEditProfile = () => {
    setEditName(profile.displayName);
    setEditGoal(String(profile.goals.monthly_co2_target));
    setIsEditProfileOpen(true);
  };

  // Clear All Storage Database (Mindful Reset)
  const handleResetApp = () => {
    if (confirm("Are you sure you want to delete all activity logs and reset your EcoBucks? This cannot be undone.")) {
      localStorage.clear();
      setTrips([]);
      setMeals([]);
      setEnergyLogs([]);
      setRedeemedRewards([]);
      const defaultProfile: UserProfile = {
        uid: "u123",
        email: "mrunaljogane@gmail.com",
        displayName: "Mrunal Jogane",
        eco_bucks: 100,
        level: "EcoStarter",
        total_co2: 0,
        goals: {
          monthly_co2_target: 200
        }
      };
      setProfile(defaultProfile);
      localStorage.setItem("ecotrack_profile", JSON.stringify(defaultProfile));
      setActiveTab("dashboard");
    }
  };

  // --- LEVEL COLOR ENHANCEMENTS ---
  const getLevelColor = (lvl: string) => {
    switch (lvl) {
      case "EcoStarter": return "text-[#dac8b9] bg-stone-100 border-[#eaded4]";
      case "Green Hero": return "text-[#078a52] bg-[#84e7a5]/10 border-[#078a52]/30";
      case "Sustainable Star": return "text-[#0089ad] bg-[#3bd3fd]/10 border-[#0089ad]/30";
      case "Earth Guardian": return "text-[#43089f] bg-[#c1b0ff]/10 border-[#43089f]/30";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // Active state counts
  const progressRatio = Math.min(100, (profile.total_co2 / profile.goals.monthly_co2_target) * 100);

  return (
    <div className="min-h-screen bg-bg text-fg font-sans pb-16">
      {/* --------------------------------------------------------- */}
      {/* 1. SOLID CLAY NAVBAR */}
      {/* --------------------------------------------------------- */}
      <nav className="sticky top-0 z-50 bg-[#fff8f1]/95 backdrop-blur border-b border-border shadow-clay">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
              <div className="w-9 h-9 bg-accent border-1.5 border-black rounded-xl shadow-hard-offset flex items-center justify-center text-white scale-90 sm:scale-100">
                <Leaf className="w-5 h-5 fill-white/20" />
              </div>
              <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-fg">
                EcoTrack
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 bg-green-100 border border-success/30 text-success text-[9px] uppercase tracking-widest font-bold rounded-md">
                Production-v2
              </span>
            </div>

            {/* Quick stats & Profile info */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Level Badge */}
              <div
                className={`hidden md:flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-bold leading-none ${getLevelColor(
                  profile.level
                )}`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>{profile.level}</span>
              </div>

              {/* EcoBucks quick-view */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#fbbd41]/10 border border-[#fbbd41]/30 text-[#9d6a09] font-display font-bold text-xs sm:text-sm rounded-xl">
                <Sparkles className="w-4 h-4 fill-amber-300" />
                <span className="font-mono">{profile.eco_bucks}</span>
                <span className="hidden xs:inline text-[10px]">EcoBucks</span>
              </div>

              {/* User Avatar & Name */}
              <button
                onClick={handleOpenEditProfile}
                className="flex items-center gap-2 p-1 bg-surface-warm/30 hover:bg-surface-warm/50 rounded-xl border border-border-soft transition-all"
                title="Edit profile & goals"
              >
                <div className="w-8 h-8 rounded-lg bg-accent text-white font-display font-bold flex items-center justify-center text-xs">
                  {profile.displayName.charAt(0)}
                </div>
                <span className="hidden lg:inline text-xs font-bold text-fg pr-1">
                  {profile.displayName}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --------------------------------------------------------- */}
      {/* 2. DYNAMIC MAIN CONTAINER */}
      {/* --------------------------------------------------------- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Quick Header Banner presenting local date and dynamic greeting */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#fff8f1] border border-border rounded-3xl p-6 shadow-clay relative overflow-hidden">
          {/* Decorative left-edge leaf accent */}
          <div className="absolute top-0 left-0 w-1.5 h-full bg-accent" />
          
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-bold font-display text-fg leading-tight">
              Hello, {profile.displayName}
            </h1>
            <p className="text-xs text-muted font-medium">
              Your eco-mindfulness is active. Tracking Carbon footprint coordinates securely under Indian parameters.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleOpenEditProfile}
              className="clay-btn-secondary px-4 py-2 text-xs font-bold"
            >
              Goal & Profile Settings
            </button>
            <button
              onClick={handleResetApp}
              className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Reset all local states"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Workspace</span>
            </button>
          </div>
        </div>

        {/* --- GRID SPLIT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* 3. DESKTOP SIDEBAR NAVIGATION AND PERFORMANCE WIDGET */}
          <div className="col-span-1 space-y-6">
            
            {/* Nav Menu */}
            <div className="clay-card p-4 space-y-1.5 bg-[#fff8f1]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted font-display px-2 mb-2">
                Core Workspace
              </p>
              
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === "dashboard"
                    ? "bg-accent text-white border border-black shadow-hard-offset"
                    : "text-fg-2 hover:bg-surface-warm/20"
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Dashboard Home</span>
              </button>

              <button
                onClick={() => setActiveTab("travel")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === "travel"
                    ? "bg-accent text-white border border-black shadow-hard-offset"
                    : "text-fg-2 hover:bg-surface-warm/20"
                }`}
              >
                <Navigation className="w-4 h-4" />
                <span>Travel Tracker (GPS)</span>
              </button>

              <button
                onClick={() => setActiveTab("food")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === "food"
                    ? "bg-accent text-white border border-black shadow-hard-offset"
                    : "text-fg-2 hover:bg-surface-warm/20"
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>AI Meal Scanner</span>
              </button>

              <button
                onClick={() => setActiveTab("energy")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === "energy"
                    ? "bg-accent text-white border border-black shadow-hard-offset"
                    : "text-fg-2 hover:bg-surface-warm/20"
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Energy Utilities</span>
              </button>

              <button
                onClick={() => setActiveTab("rewards")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === "rewards"
                    ? "bg-accent text-white border border-black shadow-hard-offset"
                    : "text-fg-2 hover:bg-surface-warm/20"
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>Rewards Store</span>
              </button>
            </div>

            {/* Goal Progress Widget */}
            <div className="clay-card p-5 bg-[#fff8f1]">
              <div className="flex items-center gap-2 mb-3">
                <Leaf className="w-4 h-4 text-success" />
                <span className="text-xs font-bold font-display uppercase tracking-wider text-fg-2">
                  Carbon Goal Meter
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-muted font-medium">Cumulative Emission</span>
                  <span className="text-xs font-bold text-fg">
                    {profile.total_co2.toFixed(1)} / {profile.goals.monthly_co2_target} kg
                  </span>
                </div>

                <div className="w-full bg-stone-200 border border-border-soft h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progressRatio < 50
                        ? "bg-green-500"
                        : progressRatio < 85
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${progressRatio}%` }}
                  />
                </div>

                <div className="pt-1.5 flex items-start gap-1 text-[10px] text-muted font-medium">
                  <TrendingDown className="w-3.5 h-3.5 text-success shrink-0" />
                  <span>
                    {progressRatio < 100
                      ? `Using ${progressRatio.toFixed(0)}% of your target limit. Keep it low!`
                      : "Carbon target limit exceeded. Review recommendations to reduce!"}
                  </span>
                </div>
              </div>
            </div>

            {/* Active User Rank information */}
            <div className="p-4 bg-gradient-to-b from-[#ead6c7]/30 to-[#ead6c7]/10 border border-border rounded-2xl flex items-center gap-3 text-fg-2">
              <Award className="w-8 h-8 text-amber-700 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-[#b46a46] font-display">Current rank</p>
                <p className="text-xs font-bold text-fg leading-none mt-0.5">{profile.level}</p>
                <p className="text-[9px] text-muted mt-1">Level grows automatically as you log clean commutes, veg diets and utility stats!</p>
              </div>
            </div>

          </div>

          {/* 4. DYNAMIC VIEW CAROUSEL */}
          <div className="col-span-1 lg:col-span-3 space-y-6">
            
            {/* DASHBOARD PAGE */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                
                {/* Metrics ribbon */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MetricCard
                    id="metric-total-co2"
                    title="Total Carbon Logged"
                    value={profile.total_co2}
                    unit="kg CO₂"
                    icon={Leaf}
                    colorClass="text-danger"
                    bgAccentStyle="bg-red-50"
                    description={`Monthly limit target: ${profile.goals.monthly_co2_target} kg`}
                  />
                  <MetricCard
                    id="metric-points-earned"
                    title="Active EcoBucks Score"
                    value={profile.eco_bucks}
                    unit="Points"
                    icon={Sparkles}
                    colorClass="text-[#d08a11]"
                    bgAccentStyle="bg-yellow-50"
                    description={`Level status: ${profile.level}`}
                  />
                  <MetricCard
                    id="metric-tracked-entries"
                    title="Audit Logs Logged"
                    value={trips.length + meals.length + energyLogs.length}
                    unit="Entries"
                    icon={Activity}
                    colorClass="text-success"
                    bgAccentStyle="bg-green-50"
                    description="Travel tracks + Food Scans + Utility logs"
                  />
                </div>

                {/* AI Insights integration */}
                <EcoInsights trips={trips} energyLogs={energyLogs} meals={meals} />

                {/* Dashboard visualization graphics */}
                <DashboardCharts trips={trips} energyLogs={energyLogs} meals={meals} />

              </div>
            )}

            {/* TRAVEL COMMUTES PAGE */}
            {activeTab === "travel" && (
              <TravelTracker onAddTrip={handleAddTrip} trips={trips} onDeleteTrip={handleDeleteTrip} />
            )}

            {/* FOOD DIETS PAGE */}
            {activeTab === "food" && (
              <MealScanner onAddMeal={handleAddMeal} meals={meals} onDeleteMeal={handleDeleteMeal} />
            )}

            {/* UTILITIES ENERGY PAGE */}
            {activeTab === "energy" && (
              <EnergyLogger onAddEnergyLog={handleAddEnergyLog} logs={energyLogs} onDeleteLog={handleDeleteEnergy} />
            )}

            {/* REWARDS STORE PAGE */}
            {activeTab === "rewards" && (
              <RewardsStore
                ecoBucks={profile.eco_bucks}
                onRedeemReward={handleRedeemReward}
                redeemedRewards={redeemedRewards}
              />
            )}

          </div>

        </div>
      </main>

      {/* --------------------------------------------------------- */}
      {/* 5. GORGEOUS STYLED PROFILE GOAL EDIT POPUP / DIALOG */}
      {/* --------------------------------------------------------- */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="relative clay-card p-6 md:p-8 max-w-md w-full bg-[#fff8f1] animate-fade-in">
            
            <div className="flex justify-between items-start border-b border-border-soft pb-3.5 mb-5">
              <div>
                <h3 className="text-lg font-bold font-display text-fg flex items-center gap-1.5">
                  <User className="w-5 h-5 text-accent" />
                  <span>Profile & Goals settings</span>
                </h3>
                <p className="text-[11px] text-muted">Optimize limits to fit your actual household counts.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-muted hover:text-fg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="modal-name-input" className="block text-xs font-bold text-fg-2">
                  Display Signature Name
                </label>
                <input
                  id="modal-name-input"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-fg-2">
                  Account Email Address (Firebase Secure)
                </label>
                <input
                  type="text"
                  disabled
                  value={profile.email}
                  className="w-full px-3.5 py-2 border border-border rounded-xl bg-stone-100 text-muted text-sm cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="modal-goal-input" className="block text-xs font-bold text-fg-2">
                  Monthly CO₂ Target Goal Limit (in kg)
                </label>
                <input
                  id="modal-goal-input"
                  type="number"
                  min="20"
                  max="1500"
                  required
                  value={editGoal}
                  onChange={(e) => setEditGoal(e.target.value)}
                  className="w-full px-3.5 py-2 border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent text-sm font-mono"
                />
                <p className="text-[9px] text-muted">
                  Indian national urban average household emits roughly 180 kg CO2 / month. Let's aim to beat it!
                </p>
              </div>

              <div className="pt-4 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 border border-border-soft text-fg-2 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent hover:bg-accent-hover text-white border border-black font-bold shadow-hard-offset rounded-xl transition-all"
                >
                  Save settings
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
