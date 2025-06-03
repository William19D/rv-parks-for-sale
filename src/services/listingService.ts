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
 * Fetches only approved listings
 */
export const fetchApprovedListings = async (filters?: ListingFilters): Promise<Listing[]> => {
  try {
    // Always include the approved filter in all queries
    let query = supabase
      .from('listings')
      .select(`
        *,
        listing_images(storage_path, is_primary),
        user:user_id (
          id, 
          email,
          full_name,
          avatar_url, 
          phone, 
          company_name
        )
      `)
      .eq('status', 'approved'); // Only fetch approved listings

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
        query = query.eq('state', filters.state);
      }
      
      // Site count filters
      if (filters.sitesMin !== undefined && filters.sitesMin > 0) {
        query = query.gte('num_sites', filters.sitesMin);
      }
      
      if (filters.sitesMax !== undefined && filters.sitesMax < 1000) {
        query = query.lte('num_sites', filters.sitesMax);
      }
      
      // Cap rate filter
      if (filters.capRateMin !== undefined && filters.capRateMin > 0) {
        query = query.gte('cap_rate', filters.capRateMin);
      }
      
      // Occupancy rate filter
      if (filters.occupancyRateMin !== undefined && filters.occupancyRateMin > 0) {
        query = query.gte('occupancy_rate', filters.occupancyRateMin);
      }
      
      // Search term
      if (filters.search && filters.search.trim() !== '') {
        const searchTerm = `%${filters.search.trim()}%`;
        query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},city.ilike.${searchTerm},state.ilike.${searchTerm}`);
      }
    }

    const { data, error } = await query;
    
    if (error) {
      // Don't log error details that might contain listing information
      return [];
    }
    
    // Transform data to match the Listing interface
    if (data) {
      return data.map(listing => {
        // Process images to get URLs
        const images = listing.listing_images?.map(img => {
          return supabase.storage.from('listing-images').getPublicUrl(img.storage_path).data.publicUrl;
        }) || [];
        
        // Sort images with primary first
        const primaryImageIndex = listing.listing_images?.findIndex(img => img.is_primary);
        if (primaryImageIndex > 0 && images.length > 0) {
          const primaryImage = images[primaryImageIndex];
          images.splice(primaryImageIndex, 1);
          images.unshift(primaryImage);
        }
        
        return {
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          location: {
            address: listing.address || '',
            city: listing.city,
            state: listing.state,
            lat: listing.latitude || 0,
            lng: listing.longitude || 0
          },
          numSites: listing.num_sites,
          occupancyRate: listing.occupancy_rate,
          annualRevenue: listing.annual_revenue,
          capRate: listing.cap_rate,
          images: images,
          broker: {
            id: listing.user?.id || '',
            name: listing.user?.full_name || 'Unknown',
            email: listing.user?.email || '',
            phone: listing.user?.phone || '',
            company: listing.user?.company_name || '',
            avatar: listing.user?.avatar_url || '/default-avatar.png'
          },
          createdAt: listing.created_at,
          featured: !!listing.featured,
          status: listing.status
        };
      });
    }
    
    return [];
  } catch (error) {
    // Don't log error details
    return [];
  }
};

/**
 * Fetches featured listings that are approved
 */
export const fetchFeaturedApprovedListings = async (): Promise<Listing[]> => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        listing_images(storage_path, is_primary),
        user:user_id (
          id, 
          email,
          full_name, 
          avatar_url, 
          phone, 
          company_name
        )
      `)
      .eq('status', 'approved')  // Only approved listings
      .eq('featured', true)      // Only featured listings
      .order('created_at', { ascending: false })
      .limit(3); // Limit to top 3 featured listings
    
    if (error) {
      // Don't log error details
      return [];
    }
    
    // Transform data to match the Listing interface (same as in fetchApprovedListings)
    if (data) {
      return data.map(listing => {
        // Process images to get URLs
        const images = listing.listing_images?.map(img => {
          return supabase.storage.from('listing-images').getPublicUrl(img.storage_path).data.publicUrl;
        }) || [];
        
        // Sort images with primary first
        const primaryImageIndex = listing.listing_images?.findIndex(img => img.is_primary);
        if (primaryImageIndex > 0 && images.length > 0) {
          const primaryImage = images[primaryImageIndex];
          images.splice(primaryImageIndex, 1);
          images.unshift(primaryImage);
        }
        
        return {
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          location: {
            address: listing.address || '',
            city: listing.city,
            state: listing.state,
            lat: listing.latitude || 0,
            lng: listing.longitude || 0
          },
          numSites: listing.num_sites,
          occupancyRate: listing.occupancy_rate,
          annualRevenue: listing.annual_revenue,
          capRate: listing.cap_rate,
          images: images,
          broker: {
            id: listing.user?.id || '',
            name: listing.user?.full_name || 'Unknown',
            email: listing.user?.email || '',
            phone: listing.user?.phone || '',
            company: listing.user?.company_name || '',
            avatar: listing.user?.avatar_url || '/default-avatar.png'
          },
          createdAt: listing.created_at,
          featured: true,
          status: listing.status
        };
      });
    }
    
    return [];
  } catch (error) {
    // Don't log error details
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
        listing_images(storage_path, is_primary),
        user:user_id (
          id, 
          email,
          full_name,
          avatar_url, 
          phone, 
          company_name
        )
      `)
      .eq('id', id)
      .eq('status', 'approved')  // Only return if approved
      .single();
    
    if (error) {
      return null;
    }
    
    if (data) {
      // Process images to get URLs
      const images = data.listing_images?.map(img => {
        return supabase.storage.from('listing-images').getPublicUrl(img.storage_path).data.publicUrl;
      }) || [];
      
      // Sort images with primary first
      const primaryImageIndex = data.listing_images?.findIndex(img => img.is_primary);
      if (primaryImageIndex > 0 && images.length > 0) {
        const primaryImage = images[primaryImageIndex];
        images.splice(primaryImageIndex, 1);
        images.unshift(primaryImage);
      }
      
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        price: data.price,
        location: {
          address: data.address || '',
          city: data.city,
          state: data.state,
          lat: data.latitude || 0,
          lng: data.longitude || 0
        },
        numSites: data.num_sites,
        occupancyRate: data.occupancy_rate,
        annualRevenue: data.annual_revenue,
        capRate: data.cap_rate,
        images: images,
        broker: {
          id: data.user?.id || '',
          name: data.user?.full_name || 'Unknown',
          email: data.user?.email || '',
          phone: data.user?.phone || '',
          company: data.user?.company_name || '',
          avatar: data.user?.avatar_url || '/default-avatar.png'
        },
        createdAt: data.created_at,
        featured: !!data.featured,
        status: data.status
      };
    }
    
    return null;
  } catch (error) {
    // Don't log error details
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
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    return 0;
  }
};