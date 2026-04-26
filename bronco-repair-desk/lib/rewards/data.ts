export const REWARDS_STORAGE_KEY = "bronco-token-ledger-v1";
export const REWARDS_CLAIMED_KEY = "bronco-token-claimed-v1";
export const BASE_TOKEN_BALANCE = 1240;
export const DEFAULT_REWARD_USER_ID = "demo-user";
export const REWARD_CO2_KG_PER_ACTION = 2;

export type RewardKind = "repair" | "trade" | "recycle" | "learn" | "marketplace";

export type EarnRule = {
  id: string;
  kind: RewardKind;
  title: string;
  description: string;
  tokens: number;
  impact: string;
  cadence: string;
  accent: string;
};

export type FoodRedemption = {
  id: string;
  vendor: string;
  offer: string;
  tokens: number;
  category: string;
  location: string;
};

export type RewardActivity = {
  id: string;
  label: string;
  detail: string;
  tokens: number;
  date: string;
  kind: RewardKind | "redeem";
};

export type RewardLedgerRecord = {
  id: string;
  userId: string;
  actionId: string;
  kind: RewardKind | "redeem";
  label: string;
  detail: string;
  tokens: number;
  sourceType?: string;
  sourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type RewardSummary = {
  userId: string;
  balance: number;
  earnedThisMonth: number;
  co2AvoidedKg: number;
  actionsLogged: number;
  claimedActionIds: string[];
  nextRedemption?: FoodRedemption;
  activity: RewardActivity[];
  earnRules: EarnRule[];
  foodRedemptions: FoodRedemption[];
};

export type RewardAwardResult = {
  entry: RewardLedgerRecord;
  summary: RewardSummary;
  duplicate: boolean;
};

export type RewardRedemptionResult = {
  entry: RewardLedgerRecord;
  summary: RewardSummary;
  pass: {
    code: string;
    vendor: string;
    offer: string;
    location: string;
  };
};

export const EARN_RULES: EarnRule[] = [
  {
    id: "repair-verdict",
    kind: "repair",
    title: "Run a Repair Verdict",
    description: "Diagnose a damaged item before replacing it.",
    tokens: 30,
    impact: "Keeps repair as the first option",
    cadence: "Per completed case",
    accent: "#1b4332",
  },
  {
    id: "repair-complete",
    kind: "repair",
    title: "Complete a Repair",
    description: "Submit a finished repair with a photo check.",
    tokens: 125,
    impact: "Extends an item's useful life",
    cadence: "Verified repair",
    accent: "#012d1d",
  },
  {
    id: "trade-complete",
    kind: "trade",
    title: "Finish a Campus Trade",
    description: "Swap an item with another student instead of buying new.",
    tokens: 100,
    impact: "Creates a second-life exchange",
    cadence: "Verified pickup",
    accent: "#7d562d",
  },
  {
    id: "recycle-dropoff",
    kind: "recycle",
    title: "Recycle Responsibly",
    description: "Check in at an approved e-waste or donation dropoff.",
    tokens: 80,
    impact: "Diverts waste from landfill",
    cadence: "Verified dropoff",
    accent: "#274e3d",
  },
  {
    id: "learn-module",
    kind: "learn",
    title: "Finish a Repair Lesson",
    description: "Complete a short lesson or quiz on repair basics.",
    tokens: 25,
    impact: "Builds campus repair skills",
    cadence: "Per lesson",
    accent: "#623f18",
  },
  {
    id: "listing-published",
    kind: "marketplace",
    title: "Publish a Reuse Listing",
    description: "List an item for sale, trade, free pickup, or repair parts.",
    tokens: 20,
    impact: "Starts a recirculation path",
    cadence: "Per approved listing",
    accent: "#7a532b",
  },
];

export const FOOD_REDEMPTIONS: FoodRedemption[] = [
  {
    id: "pony-cba",
    vendor: "Pony Express - CBA",
    offer: "$5 snack credit",
    tokens: 140,
    category: "Express",
    location: "College of Business",
  },
  {
    id: "element",
    vendor: "Element Coffee & Food",
    offer: "Coffee or pastry credit",
    tokens: 180,
    category: "Cafe",
    location: "Campus Center",
  },
  {
    id: "starbucks",
    vendor: "Starbucks",
    offer: "Drink credit",
    tokens: 220,
    category: "Cafe",
    location: "University Library",
  },
  {
    id: "pony-express",
    vendor: "Pony Express",
    offer: "Market meal credit",
    tokens: 200,
    category: "Express",
    location: "Campus dining",
  },
  {
    id: "panda",
    vendor: "Panda Express",
    offer: "Entree credit",
    tokens: 360,
    category: "Meal",
    location: "Campus Center",
  },
  {
    id: "takorean",
    vendor: "Takorean",
    offer: "Bowl credit",
    tokens: 320,
    category: "Meal",
    location: "Campus Center",
  },
  {
    id: "fresh-escapes",
    vendor: "Fresh Escapes",
    offer: "Salad or wrap credit",
    tokens: 260,
    category: "Fresh",
    location: "Campus Center",
  },
  {
    id: "carls-junior",
    vendor: "Carl's Junior",
    offer: "Combo credit",
    tokens: 340,
    category: "Meal",
    location: "Campus dining",
  },
  {
    id: "env-caffee",
    vendor: "ENV Caffee",
    offer: "Coffee credit",
    tokens: 160,
    category: "Cafe",
    location: "ENV",
  },
  {
    id: "subway",
    vendor: "Subway",
    offer: "Sandwich credit",
    tokens: 310,
    category: "Meal",
    location: "Campus Center",
  },
];

export const RECENT_REWARD_ACTIVITY: RewardActivity[] = [
  {
    id: "act-1",
    label: "Repaired MacBook display cable",
    detail: "Repair completed",
    tokens: 125,
    date: "Apr 24",
    kind: "repair",
  },
  {
    id: "act-2",
    label: "Traded mini fridge",
    detail: "Campus trade verified",
    tokens: 100,
    date: "Apr 22",
    kind: "trade",
  },
  {
    id: "act-3",
    label: "Recycled swollen battery pack",
    detail: "Safety dropoff verified",
    tokens: 80,
    date: "Apr 19",
    kind: "recycle",
  },
  {
    id: "act-4",
    label: "Finished Repair 101",
    detail: "Learning streak day 3",
    tokens: 25,
    date: "Apr 18",
    kind: "learn",
  },
];
