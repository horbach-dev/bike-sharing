export type Story = {
  id: string;
  title: string;
  posterUrl: string;
  text: string;
  description?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body?: string;
  coverUrl: string;
  publishedAt?: string | null;
};

export type ListingCategory = "BIKE_RENTAL" | "BIKE_SALE" | "HOUSING_RENTAL";
export type Listing = {
  id: string;
  category: ListingCategory;
  title: string;
  description?: string | null;
  price?: string | number | null;
  currency: string;
  address?: string | null;
  areaSqm?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  hasTv?: boolean;
  hasFridge?: boolean;
  hasTables?: boolean;
  amenities?: string[];
  imageUrls?: string[];
  contact?: string | null;
  promotedUntil?: string | null;
};

export type ExchangeRate = {
  id: string;
  baseCode: string;
  quoteCode: string;
  rate: string | number;
  sourceLabel?: string | null;
  checkedAt: string;
  partner?: { name: string; affiliateUrl?: string | null } | null;
};

export type HomeContent = {
  stories: Story[];
  articles: Article[];
  exchangeRates: ExchangeRate[];
  rentals: Listing[];
  saleListings: Listing[];
  housing: Listing[];
};

export const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiBase + path, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (!response.ok) throw new Error("API " + response.status + ": " + await response.text());
  return response.json() as Promise<T>;
}

export const contentApi = {
  home: () => request<HomeContent>("/content/home"),
  stories: () => request<Story[]>("/content/stories"),
  listings: (category: ListingCategory, cursor?: string, search?: string) => {
    const query = new URLSearchParams({ category, limit: "12" });
    if (cursor) query.set("cursor", cursor);
    if (search) query.set("search", search);
    return request<{ items: Listing[]; nextCursor: string | null }>("/content/listings?" + query);
  },
  fleet: (lat?: number, lng?: number) => {
    const query = new URLSearchParams();
    if (lat !== undefined && lng !== undefined) { query.set("lat", String(lat)); query.set("lng", String(lng)); }
    return request<FleetBike[]>("/content/fleet" + (query.size ? "?" + query : ""));
  },
  cashbackTiers: () => request<{ id: string; minimumCompletedTrips: number; cashbackPercent: string | number }[]>("/content/cashback/tiers"),
  submitLocation: (payload: LocationSubmissionInput) => request<{ id: string; status: string }>("/content/locations", { method: "POST", body: JSON.stringify(payload) }),
};

export type FleetBike = {
  id: string;
  code: string;
  model: string;
  year: number;
  fuelPercent?: number | null;
  helmetCount: number;
  hasRainwear: boolean;
  hasRemoteAccess: boolean;
  latitude: number;
  longitude: number;
  distanceKm?: number | null;
  walkingMinutes?: number | null;
  drivingMinutes?: number | null;
};

export type LocationSubmissionInput = {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  category?: string;
  imageUrl?: string;
};
