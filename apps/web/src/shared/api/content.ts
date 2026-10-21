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
export type ListingSubmissionInput = {
  category: ListingCategory;
  title: string;
  description: string;
  price?: number;
  currency: "VND" | "USD" | "RUB";
  address: string;
  district?: "north" | "center" | "south" | "outskirts";
  latitude?: number;
  longitude?: number;
  areaSqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  hasTv?: boolean;
  hasFridge?: boolean;
  hasTables?: boolean;
  amenities?: string[];
  imageUrls: string[];
  contact: string;
};
export type ListingFilters = {
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  currency?: string;
  bedrooms?: string;
  minArea?: string;
  amenity?: string;
  district?: string;
  promotedOnly?: boolean;
  sort?: "new" | "price-asc" | "price-desc";
};
export type Listing = {
  id: string;
  category: ListingCategory;
  title: string;
  description?: string | null;
  price?: string | number | null;
  currency: string;
  address?: string | null;
  district?: string | null;
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

export const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? (import.meta.env.DEV ? "http://localhost:3001/api/v1" : "");
export const isContentApiConfigured = Boolean(apiBase);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isContentApiConfigured) throw new Error("Серверный API ещё не подключён.");
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
  submitListing: (payload: ListingSubmissionInput) => request<{ id: string; published: boolean }>("/content/listings/submissions", { method: "POST", body: JSON.stringify(payload) }),
  uploadListingMedia: async (file: File) => {
    if (!isContentApiConfigured) throw new Error("Загрузка фото будет доступна после подключения API.");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(apiBase + "/content/listing-media", { method: "POST", body: form });
    if (!response.ok) throw new Error("API " + response.status + ": " + await response.text());
    return response.json() as Promise<{ url: string; name: string; size: number; type: string }>;
  },
  listings: (category: ListingCategory, cursor?: string, filters: ListingFilters = {}) => {
    const query = new URLSearchParams({ category, limit: "12" });
    if (cursor) query.set("cursor", cursor);
    if (filters.search) query.set("search", filters.search);
    if (filters.minPrice) query.set("minPrice", filters.minPrice);
    if (filters.maxPrice) query.set("maxPrice", filters.maxPrice);
    if (filters.currency) query.set("currency", filters.currency);
    if (filters.bedrooms) query.set("bedrooms", filters.bedrooms);
    if (filters.minArea) query.set("minArea", filters.minArea);
    if (filters.amenity) query.set("amenity", filters.amenity);
    if (filters.district) query.set("district", filters.district);
    if (filters.promotedOnly) query.set("promotedOnly", "true");
    if (filters.sort) query.set("sort", filters.sort);
    return request<{ items: Listing[]; nextCursor: string | null; districtCounts?: Record<string, number> }>("/content/listings?" + query);
  },
  fleet: (lat?: number, lng?: number) => {
    const query = new URLSearchParams();
    if (lat !== undefined && lng !== undefined) { query.set("lat", String(lat)); query.set("lng", String(lng)); }
    return request<FleetBike[]>("/content/fleet" + (query.size ? "?" + query : ""));
  },
  cashbackTiers: () => request<{ id: string; minimumCompletedTrips: number; cashbackPercent: string | number }[]>("/content/cashback/tiers"),
  locations: () => request<ApprovedLocation[]>("/content/locations"),
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

export type ApprovedLocation = {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  imageUrl?: string | null;
};

export type LocationSubmissionInput = {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  category?: string;
  imageUrl?: string;
};
