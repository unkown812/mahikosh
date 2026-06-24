import { TravelMode } from "./types";

export const EMISSION_FACTORS = {
  travel: {
    car: 0.17,
    bus: 0.08,
    train: 0.04,
    "walk-bike": 0,
  },
  energy: {
    electricity_per_inr: 0.005,
    gas_per_inr: 0.0025,
  },
  food: {
    veg: 1.5,
    "non-veg": 4.5,
  },
};

export const TRAVEL_MODE_LABELS: Record<TravelMode, string> = {
  car: "Car",
  bus: "Bus",
  train: "Train",
  "walk-bike": "Walk / Bike",
};

export function calculateTravelCo2(mode: TravelMode, distance: number): number {
  return distance * EMISSION_FACTORS.travel[mode];
}

export function calculateEnergyCo2(electricityInr: number, gasInr: number): number {
  return (electricityInr * EMISSION_FACTORS.energy.electricity_per_inr) +
         (gasInr * EMISSION_FACTORS.energy.gas_per_inr);
}

export function calculateTripEcoBucks(mode: TravelMode, distance: number): number {
  switch (mode) {
    case "walk-bike":
      return Math.round(distance * 10);
    case "train":
      return Math.round(distance * 6);
    case "bus":
      return Math.round(distance * 4);
    case "car":
      return Math.max(1, Math.round(distance * 0.5));
    default:
      return 0;
  }
}

export function determineEcoLevel(ecoBucks: number): 1 | 2 | 3 | 4 {
  if (ecoBucks < 500) return 1;
  if (ecoBucks < 1500) return 2;
  if (ecoBucks < 5000) return 3;
  return 4;
}

export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const ECO_TIPS = [
  {
    id: "tip1",
    category: "travel" as const,
    title: "Walk or bike for short trips",
    description: "Replace car trips under 5km with walking or cycling. Zero emissions and earns max EcoBucks!",
    impact: "high" as const,
    bucksReward: 30,
  },
  {
    id: "tip2",
    category: "food" as const,
    title: "Try meatless Mondays",
    description: "One vegetarian meal saves ~3 kg CO₂ compared to meat. Start with one day a week.",
    impact: "medium" as const,
    bucksReward: 20,
  },
  {
    id: "tip3",
    category: "energy" as const,
    title: "Unplug phantom loads",
    description: "Devices on standby can account for 10% of your electricity bill. Unplug when not in use.",
    impact: "medium" as const,
    bucksReward: 25,
  },
  {
    id: "tip4",
    category: "travel" as const,
    title: "Use public transit",
    description: "Buses and trains produce 50-75% less CO₂ per km than cars. Switch at least once a week.",
    impact: "high" as const,
    bucksReward: 35,
  },
  {
    id: "tip5",
    category: "energy" as const,
    title: "Switch to LED bulbs",
    description: "LEDs use 75% less energy and last 25x longer than incandescent bulbs.",
    impact: "high" as const,
    bucksReward: 40,
  },
  {
    id: "tip6",
    category: "food" as const,
    title: "Eat seasonal & local",
    description: "Locally sourced seasonal food reduces transport emissions by up to 10x.",
    impact: "low" as const,
    bucksReward: 15,
  },
];

export const REWARDS_CATALOG = [
  {
    id: "r1",
    title: "Tree Planting Initiative",
    cost: 1000,
    description: "Redeem 1000 EcoBucks to plant a native tree in your name and receive a digital certificate.",
    provider: "Grow-Green Foundation",
    category: "lifestyle" as const,
  },
  {
    id: "r2",
    title: "Eco-Store Discount Voucher",
    cost: 500,
    description: "Get a 25% discount on sustainable products at partner eco-stores.",
    provider: "EcoStore Network",
    category: "lifestyle" as const,
  },
  {
    id: "r3",
    title: "Carbon Offset Certificate",
    cost: 2000,
    description: "Redeem 2000 EcoBucks to offset 100 kg of CO₂ through verified carbon credits.",
    provider: "CarbonClear",
    category: "energy" as const,
  },
];
