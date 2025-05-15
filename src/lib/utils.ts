
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount)
}

// Filter listings based on filter options
export function filterListings(listings: any[], filters: any) {
  return listings.filter(listing => {
    // Text search
    if (filters.search && !listing.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !listing.description.toLowerCase().includes(filters.search.toLowerCase()) &&
        !listing.location.city.toLowerCase().includes(filters.search.toLowerCase()) &&
        !listing.location.state.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Price range
    if (listing.price < filters.priceMin || listing.price > filters.priceMax) {
      return false;
    }
    
    // State filter
    if (filters.state && listing.location.state !== filters.state) {
      return false;
    }
    
    // Number of sites
    if (listing.numSites < filters.sitesMin || listing.numSites > filters.sitesMax) {
      return false;
    }
    
    // Cap rate
    if (listing.capRate < filters.capRateMin) {
      return false;
    }
    
    return true;
  });
}
