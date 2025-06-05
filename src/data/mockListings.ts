import { fetchApprovedListings, fetchFeaturedApprovedListings, Listing as ServiceListing } from "@/services/listingService";

// Interface for listings - must match service interface
export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  location: {
    address: string;
    city: string;
    state: string;
    lat: number;
    lng: number;
  };
  numSites: number;
  occupancyRate: number;
  annualRevenue: number;
  capRate: number;
  images: string[];
  videoUrl?: string;
  broker: {
    avatar: string;
    name: string;
    phone: string;
    email: string;
    company: string;
    id: string;
  };
  pdfUrl?: string;
  createdAt: string;
  featured: boolean;
  status?: string;
}

// Empty mock listings array - we'll use real data from Supabase
export const mockListings: Listing[] = [];

export interface FilterOptions {
  priceMin: number;
  priceMax: number;
  state: string;
  sitesMin: number;
  sitesMax: number;
  capRateMin: number;
  search: string;
}

export const initialFilterOptions: FilterOptions = {
  priceMin: 0,
  priceMax: 10000000,
  state: '',
  sitesMin: 0,
  sitesMax: 1000,
  capRateMin: 0,
  search: '',
};

export const states = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", 
  "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", 
  "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

/**
 * Filter listings based on given filter options.
 * Only returns approved listings.
 */
export const filterListings = async (listings: Listing[], options: FilterOptions): Promise<Listing[]> => {
  try {
    // Create a filters object for the service
    const filters = {
      priceMin: options.priceMin,
      priceMax: options.priceMax,
      state: options.state,
      sitesMin: options.sitesMin,
      sitesMax: options.sitesMax,
      capRateMin: options.capRateMin,
      search: options.search
    };
    
    // Fetch approved listings from the service
    const approvedListings = await fetchApprovedListings(filters);
    
    // Return only approved listings
    return approvedListings;
    
  } catch (error) {
    // Don't log errors that might expose listing data
    return [];
  }
};

/**
 * Gets featured listings that are approved
 */
export const getFeaturedListings = async (): Promise<Listing[]> => {
  try {
    // Get featured listings that are approved from the service
    const approvedFeaturedListings = await fetchFeaturedApprovedListings();
    
    // Return only approved featured listings
    return approvedFeaturedListings;
    
  } catch (error) {
    // Don't log errors that might expose listing data
    return [];
  }
};