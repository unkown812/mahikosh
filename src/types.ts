export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  eco_bucks: number;
  level: "EcoStarter" | "Green Hero" | "Sustainable Star" | "Earth Guardian";
  total_co2: number;
  goals: {
    monthly_co2_target: number; // in kg CO2
  };
}

export type TravelMode = "petrol_car" | "electric_car" | "public_transit" | "active_travel";

export interface TripLog {
  id: string;
  userId: string;
  distance: number; // in km
  mode: TravelMode;
  co2_emission: number; // in kg
  createdAt: string;
}

export interface MealLog {
  id: string;
  userId: string;
  foodName: string;
  type: "veg" | "non-veg";
  co2_emission: number; // in kg
  description: string;
  confidence: number;
  imageUrl?: string; // base64 representation or fallback
  createdAt: string;
}

export interface EnergyLog {
  id: string;
  userId: string;
  electricity_bill: number; // kWh
  gas_bill: number; // kg of LPG
  co2_emission: number; // in kg
  createdAt: string;
}

export interface AIInsight {
  summary: string;
  tips: string[];
  generatedAt: string;
  isFallback?: boolean;
}

export interface RewardItem {
  id: string;
  title: string;
  cost: number; // cost in EcoBucks
  description: string;
  provider: string;
  category: "transport" | "energy" | "lifestyle" | "food";
  couponCode?: string;
  redeemedAt?: string;
}
