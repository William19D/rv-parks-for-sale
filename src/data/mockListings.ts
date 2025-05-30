import { fetchApprovedListings, fetchFeaturedApprovedListings, Listing as ServiceListing } from "@/services/listingService";

// Update the existing interface to include the status field
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
  status?: string; // Add status field to match the service
}

// Keep the mock listings for fallback and development purposes
export const mockListings: Listing[] = [
  {
    id: "1",
    title: "Lakefront RV Resort - 100 Sites",
    description: "Premium lakefront RV resort with excellent cash flow. This well-maintained property features 100 full hookup sites, a private lake with boat ramp, clubhouse, swimming pool, and extensive recreational amenities. High occupancy rate with many long-term residents and strong seasonal bookings. Located in a popular tourist destination with year-round appeal.",
    price: 4500000,
    location: {
      address: "123 Lake Drive",
      city: "Austin",
      state: "TX",
      lat: 30.2672,
      lng: -97.7431
    },
    numSites: 100,
    occupancyRate: 92,
    annualRevenue: 750000,
    capRate: 9.5,
    images: [
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg"
    ],
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    broker: {
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      name: "John Smith",
      phone: "512-555-1234",
      email: "john@rvbrokers.com",
      company: "RV Resort Realty",
      id: "b1"
    },
    createdAt: "2023-01-15T08:00:00Z",
    featured: true,
    status: "approved" // Add status to all mock listings
  },
  {
    id: "2",
    title: "Mountain View RV Park - Great Location",
    description: "Established RV park with breathtaking mountain views. Features 75 full hookup sites, modern bathhouse facilities, laundry, on-site store, and recreation hall. Ideally located near popular hiking trails and tourist attractions. Strong financial performance with opportunity for expansion on additional acreage.",
    price: 2750000,
    location: {
      address: "456 Mountain Road",
      city: "Denver",
      state: "CO",
      lat: 39.7392,
      lng: -104.9903
    },
    numSites: 75,
    occupancyRate: 85,
    annualRevenue: 500000,
    capRate: 8.7,
    images: [
      "/placeholder.svg",
      "/placeholder.svg"
    ],
    broker: {
      avatar: "https://randomuser.me/api/portraits/women/45.jpg",
      name: "Sarah Johnson",
      phone: "303-555-6789",
      email: "sarah@parkbrokers.com",
      company: "Mountain Park Realty",
      id: "b2"
    },
    createdAt: "2023-02-10T10:30:00Z",
    featured: true,
    status: "approved"
  },
  {
    id: "3",
    title: "Desert Oasis RV Resort - Turnkey Operation",
    description: "Turnkey RV resort in a prime desert location. This well-established property features 120 spacious sites, clubhouse with commercial kitchen, heated pool/spa, tennis courts, and expertly landscaped grounds. Consistently high occupancy with strong winter season performance. Excellent reputation with high guest ratings and repeat business.",
    price: 5200000,
    location: {
      address: "789 Desert Road",
      city: "Phoenix",
      state: "AZ",
      lat: 33.4484,
      lng: -112.0740
    },
    numSites: 120,
    occupancyRate: 88,
    annualRevenue: 900000,
    capRate: 10.1,
    images: [
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg"
    ],
    broker: {
      avatar: "https://randomuser.me/api/portraits/men/65.jpg",
      name: "Michael Brown",
      phone: "480-555-9876",
      email: "mike@rvresortbrokers.com",
      company: "Desert Properties",
      id: "b3"
    },
    pdfUrl: "#",
    createdAt: "2023-03-05T14:15:00Z",
    featured: false,
    status: "approved"
  },
  {
    id: "4",
    title: "Coastal RV Park - Development Opportunity",
    description: "Rare coastal property with 50 existing RV sites and approved permits for expansion to 85 sites. Features include beach access, boat ramp, fishing pier, and stunning ocean views. Current operations are profitable with significant upside potential through expansion and amenity upgrades.",
    price: 3800000,
    location: {
      address: "321 Shore Drive",
      city: "Myrtle Beach",
      state: "SC",
      lat: 33.6891,
      lng: -78.8867
    },
    numSites: 50,
    occupancyRate: 90,
    annualRevenue: 600000,
    capRate: 7.9,
    images: [
      "/placeholder.svg",
      "/placeholder.svg"
    ],
    broker: {
      avatar: "https://randomuser.me/api/portraits/women/28.jpg",
      name: "Amanda Wilson",
      phone: "843-555-3456",
      email: "amanda@coastalrvbrokers.com",
      company: "Coastal RV Properties",
      id: "b4"
    },
    createdAt: "2023-04-12T09:45:00Z",
    featured: false,
    status: "approved"
  },
  {
    id: "5",
    title: "Woodland Retreat RV Park - Family Owned",
    description: "Well-maintained family-owned RV park situated on 15 wooded acres. Features 60 full hookup sites, fishing pond, recreation hall, playground, and hiking trails. Strong repeat business with many seasonal campers. Sellers are retiring after 20 years of successful operation.",
    price: 1950000,
    location: {
      address: "567 Forest Lane",
      city: "Asheville",
      state: "NC",
      lat: 35.5951,
      lng: -82.5515
    },
    numSites: 60,
    occupancyRate: 82,
    annualRevenue: 420000,
    capRate: 9.3,
    images: [
      "/placeholder.svg",
      "/placeholder.svg"
    ],
    broker: {
      avatar: "https://randomuser.me/api/portraits/men/42.jpg",
      name: "Robert Chen",
      phone: "828-555-7890",
      email: "robert@mountainproperties.com",
      company: "Mountain Life Realty",
      id: "b5"
    },
    createdAt: "2023-05-20T11:20:00Z",
    featured: false,
    status: "approved"
  }
];

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
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

/**
 * Filter listings based on given filter options.
 * This function still exists for backward compatibility but now attempts
 * to use the Supabase service first.
 */
export const filterListings = async (listings: Listing[], options: FilterOptions): Promise<Listing[]> => {
  try {
    // Try to use the Supabase service first with the filter options
    const filters = {
      priceMin: options.priceMin,
      priceMax: options.priceMax,
      state: options.state,
      sitesMin: options.sitesMin,
      sitesMax: options.sitesMax,
      capRateMin: options.capRateMin,
      search: options.search
    };
    
    // Fetch from Supabase
    const serviceListings = await fetchApprovedListings(filters);
    
    // If we got results from the service, use those
    if (serviceListings && serviceListings.length > 0) {
      return serviceListings as Listing[];
    }
    
    // Fall back to filtering mock data if the service failed or returned no results
    console.warn('Falling back to mock listings - no results from service');
  } catch (error) {
    console.error('Error fetching from service, falling back to mock data:', error);
  }
  
  // Legacy filter function using mock data
  return listings.filter(listing => {
    // Apply price filter
    if (listing.price < options.priceMin || listing.price > options.priceMax) {
      return false;
    }
    
    // Apply state filter
    if (options.state && options.state !== '' && listing.location.state !== options.state) {
      return false;
    }
    
    // Apply sites filter
    if (listing.numSites < options.sitesMin || listing.numSites > options.sitesMax) {
      return false;
    }
    
    // Apply cap rate filter
    if (listing.capRate < options.capRateMin) {
      return false;
    }
    
    // Apply search filter
    if (options.search && options.search !== '') {
      const searchLower = options.search.toLowerCase();
      const titleMatch = listing.title.toLowerCase().includes(searchLower);
      const descriptionMatch = listing.description.toLowerCase().includes(searchLower);
      const locationMatch = 
        listing.location.city.toLowerCase().includes(searchLower) || 
        listing.location.state.toLowerCase().includes(searchLower);
      
      return titleMatch || descriptionMatch || locationMatch;
    }
    
    return true;
  }).filter(listing => listing.status === 'approved' || !listing.status);
};

/**
 * Gets featured listings either from the service or mock data
 */
export const getFeaturedListings = async (): Promise<Listing[]> => {
  try {
    // Try to get featured listings from service
    const featuredListings = await fetchFeaturedApprovedListings();
    if (featuredListings && featuredListings.length > 0) {
      return featuredListings as Listing[];
    }
    
    // Fallback to mock data
    console.warn('Falling back to mock featured listings');
  } catch (error) {
    console.error('Error fetching featured listings from service:', error);
  }
  
  // Return featured mock listings
  return mockListings.filter(listing => listing.featured && (listing.status === 'approved' || !listing.status));
};