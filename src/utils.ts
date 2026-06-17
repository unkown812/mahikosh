import { TravelMode } from "./types";

// Standard Carbon footprint constants (in kg CO2 per unit)
export const EMISSION_FACTORS = {
  // Trips: kg CO2 emitted per km
  travel: {
    petrol_car: 0.20,
    electric_car: 0.05,
    public_transit: 0.08,
    active_travel: 0,
  },
  // Indian national factors for home utilities
  energy: {
    electricity_kwh: 0.82, // 0.82 kg CO2 per kWh (Indian grid mix)
    gas_kg: 1.50,          // 1.50 kg CO2 per kg of LPG
  }
};

// Travel mode labels
export const TRAVEL_MODE_LABELS: Record<TravelMode, string> = {
  petrol_car: "Petrol/Diesel Car",
  electric_car: "Electric Vehicle (EV)",
  public_transit: "Public Transit (Bus/Metro)",
  active_travel: "Active Travel (Walking/Cycling)"
};

/**
 * Calculates CO2 emission for travel based on mode and distance
 */
export function calculateTravelCo2(mode: TravelMode, distance: number): number {
  return distance * EMISSION_FACTORS.travel[mode];
}

/**
 * Calculates CO2 emission for energy bills based on consumption
 */
export function calculateEnergyCo2(kwh: number, lpgKg: number): number {
  return (kwh * EMISSION_FACTORS.energy.electricity_kwh) + (lpgKg * EMISSION_FACTORS.energy.gas_kg);
}

/**
 * Calculates EcoBucks points earned for logging a trip
 */
export function calculateTripEcoBucks(mode: TravelMode, distance: number): number {
  switch (mode) {
    case "active_travel":
      return Math.round(distance * 10); // Highest bonus for active commuting!
    case "public_transit":
      return Math.round(distance * 4);  // solid bonus for transit
    case "electric_car":
      return Math.round(distance * 2);  // cleaner alternative
    case "petrol_car":
      return Math.max(1, Math.round(distance * 0.5)); // min 1 point for conscious tracking
    default:
      return 0;
  }
}

/**
 * Level mapping determined by cumulative EcoBucks
 */
export function determineEcoLevel(ecoBucks: number): "EcoStarter" | "Green Hero" | "Sustainable Star" | "Earth Guardian" {
  if (ecoBucks < 150) return "EcoStarter";
  if (ecoBucks < 500) return "Green Hero";
  if (ecoBucks < 1200) return "Sustainable Star";
  return "Earth Guardian";
}

/**
 * Standard rewards catalog
 */
export const REWARDS_CATALOG = [
  {
    id: "r1",
    title: "1 Month Public Transit Pass",
    cost: 300,
    description: "Get a 50% discount coupon on your local city bus or rail transit passes.",
    provider: "MetroTransit Co.",
    category: "transport" as const,
  },
  {
    id: "r2",
    title: "Tree Planting Initiative",
    cost: 150,
    description: "Redeem 150 EcoBucks to plant a native broadleaf sapling in your name and receive a digital certificate.",
    provider: "Grow-Green Foundation",
    category: "lifestyle" as const,
  },
  {
    id: "r3",
    title: "Smart Smart-Plug Discount",
    cost: 250,
    description: "Receive a 30% discount on Smart Plugs to automate device shutdown and avoid phantom power logs.",
    provider: "EcoVolts SmartHome",
    category: "energy" as const,
  },
  {
    id: "r4",
    title: "Sustainable Bamboo Cutlery Kit",
    cost: 200,
    description: "Reduce single-use plastic waste on the go with a zero-waste reusable organic bamboo travel dining kit.",
    provider: "EarthBazaar Marketplace",
    category: "lifestyle" as const,
  },
  {
    id: "r5",
    title: "Eco Vegan Gourmet Dessert Voucher",
    cost: 100,
    description: "Enjoy a free organic, plant-based chocolate avocado pie or gluten-free cake slice at GreenEats.",
    provider: "GreenEats Bakery",
    category: "food" as const,
  }
];
