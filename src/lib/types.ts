export type Activity = {
  time: string;
  title: string;
  description: string;
  category: "history" | "food" | "lifestyle" | "nature" | "other";
  estimatedCost: number;
};

export type ItineraryDay = {
  date: string;
  location: string;
  activities: Activity[];
};

export type TravelItinerary = {
  summary: string;
  totalDays: number;
  dailyBudget: number;
  days: ItineraryDay[];
  tips: string[];
};

export type ChatRequest = {
  destinations: string[];
  startDate: string;
  endDate: string;
  interests: string[];
  budget: number;
  additionalContext?: string;
};
