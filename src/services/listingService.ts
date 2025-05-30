import { supabase } from "@/integrations/supabase/client";

// Define the Listing interface directly in this file
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
  status: string; // For approval status: 'approved', 'pending', 'rejected', etc.
}

// Filter interface for type safety when applying filters
export interface ListingFilters {
  priceMin?: number;
  priceMax?: number;
  state?: string;
  sitesMin?: number;
  sitesMax?: number;
  capRateMin?: number;
  occupancyRateMin?: number;
  search?: string;
  [key: string]: any; // For any additional filters
}

/**
 * Fetches all listings with 'approved' status
 */
export const fetchApprovedListings = async (filters?: ListingFilters): Promise<Listing[]> => {
  try {
    // Start building the query
    let query = supabase
      .from('listings')
      .select(`
        *,
        broker:broker_id (
          id, 
          name, 
          avatar, 
          phone, 
          email, 
          company
        )
      `)
      .eq('status', 'approved'); // This is the key filter - only approved listings

    // Apply additional filters if provided
    if (filters) {
      // Price filters
      if (filters.priceMin !== undefined && filters.priceMin > 0) {
        query = query.gte('price', filters.priceMin);
      }
      
      if (filters.priceMax !== undefined && filters.priceMax < 10000000) {
        query = query.lte('price', filters.priceMax);
      }
      
      // State filter
      if (filters.state && filters.state !== '') {
        query = query.eq('location->state', filters.state);
      }
      
      // Site count filters
      if (filters.sitesMin !== undefined && filters.sitesMin > 0) {
        query = query.gte('numSites', filters.sitesMin);
      }
      
      if (filters.sitesMax !== undefined && filters.sitesMax < 1000) {
        query = query.lte('numSites', filters.sitesMax);
      }
      
      // Cap rate filter
      if (filters.capRateMin !== undefined && filters.capRateMin > 0) {
        query = query.gte('capRate', filters.capRateMin);
      }
      
      // Occupancy rate filter
      if (filters.occupancyRateMin !== undefined && filters.occupancyRateMin > 0) {
        query = query.gte('occupancyRate', filters.occupancyRateMin);
      }
      
      // Search term
      if (filters.search && filters.search.trim() !== '') {
        const searchTerm = `%${filters.search.trim()}%`;
        query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},location->city.ilike.${searchTerm},location->state.ilike.${searchTerm}`);
      }
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to fetch listings:', error);
    return [];
  }
};

/**
 * Fetches featured listings with 'approved' status
 */
export const fetchFeaturedApprovedListings = async (): Promise<Listing[]> => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        broker:broker_id (
          id, 
          name, 
          avatar, 
          phone, 
          email, 
          company
        )
      `)
      .eq('status', 'approved')
      .eq('featured', true)
      .order('createdAt', { ascending: false })
      .limit(3); // Limit to 3 featured listings
    
    if (error) {
      console.error('Error fetching featured listings:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to fetch featured listings:', error);
    return [];
  }
};

/**
 * Fetches a single listing by ID (only if it's approved)
 */
export const fetchApprovedListingById = async (id: string): Promise<Listing | null> => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        broker:broker_id (
          id, 
          name, 
          avatar, 
          phone, 
          email, 
          company
        )
      `)
      .eq('id', id)
      .eq('status', 'approved')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // PostgreSQL error for no rows returned
        return null; // No listing found with that ID or it's not approved
      }
      console.error('Error fetching listing by ID:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Failed to fetch listing with ID ${id}:`, error);
    return null;
  }
};

/**
 * Counts the total number of approved listings
 */
export const countApprovedListings = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');
    
    if (error) {
      console.error('Error counting listings:', error);
      throw error;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Failed to count listings:', error);
    return 0;
  }
};