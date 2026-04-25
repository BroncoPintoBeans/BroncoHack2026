export interface AppUser {
  id: string;
  email: string;
  full_name?: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  trade_only: boolean;
  condition: "New" | "Good" | "Fair" | "Poor";
  category: "Laptops" | "Bicycles" | "E-Scooters" | "Appliances" | "Other";
  image_url: string;
  seller_id: string;
  created_at: string;
}

export interface RepairCase {
  id: string;
  title: string;
  issue: string;
  status: "Draft" | "Analyzing" | "Verdict Ready";
  repairability_score: number;
  estimated_cost: number;
  image_url: string;
  user_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  listing_id: string | null;
  body: string;
  created_at: string;
}
