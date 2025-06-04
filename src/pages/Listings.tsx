import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ListingCard } from "@/components/listings/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterOptions, initialFilterOptions, states } from "@/data/mockListings";
import { fetchApprovedListings, Listing as ServiceListing } from "@/services/listingService";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, MapPin, Grid, Map, X, ArrowUpDown, 
  SlidersHorizontal, Save, Clock, Star, Percent, 
  Users, DollarSign, Calendar, Filter, ChevronDown,
  BarChart3, Zap, Bookmark, Eye, Building, Home, AlertCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RangeSlider } from "@/lib/RangeSlider";
import * as SliderPrimitive from '@radix-ui/react-slider';

// Improved component for header spacing

// Updated to use ServiceListing type from the service
type Listing = ServiceListing;

// Extended filter options with additional filters
interface ExtendedFilterOptions extends FilterOptions {
  states: string[];
  types: string[];
  features: string[];
  sitesMin: number;
  sitesMax: number;
  capRateMin: number;
  occupancyRateMin: number;
  revenueMin: number;
  revenueMax: number;
  listedWithinDays: number | null;
  savedSearch: boolean;
  viewedLast: number | null;
}

// Updated initial filters with a 50M maximum price
const initialExtendedFilters: ExtendedFilterOptions = {
  ...initialFilterOptions,
  priceMax: 50000000, // Set maximum price to 50M as requested
  states: [],
  types: [],
  features: [],
  sitesMin: 0,
  sitesMax: 500,
  capRateMin: 0,
  occupancyRateMin: 0,
  revenueMin: 0,
  revenueMax: 5000000,
  listedWithinDays: null,
  savedSearch: false,
  viewedLast: null,
  search: ''
};

// Quick filter presets
const quickFilters = [
  { id: "budget", label: "Budget-Friendly", icon: DollarSign, tooltip: "Properties under $1M" },
  { id: "highCapRate", label: "High Cap Rate", icon: Percent, tooltip: "Cap rates above 8%" },
  { id: "newListings", label: "New This Week", icon: Calendar, tooltip: "Listed in the last 7 days" },
  { id: "largeSites", label: "Large Parks", icon: Users, tooltip: "Properties with 100+ sites" },
  { id: "waterfront", label: "Waterfront", icon: Building, tooltip: "Properties with waterfront access" },
  { id: "trending", label: "Trending", icon: BarChart3, tooltip: "Most viewed in the past week" },
];

// Detailed property types
const propertyTypes = [
  { id: "rv_park", label: "RV Park", icon: Home },
  { id: "campground", label: "Campground", icon: Home },
  { id: "mobile_home", label: "Mobile Home Park", icon: Building },
  { id: "resort", label: "Resort", icon: Building },
  { id: "marina", label: "Marina", icon: Home },
  { id: "mixed", label: "Mixed-Use", icon: Building }
];

// Enhanced features list
const amenityFeatures = [
  "Waterfront", "Pool", "Clubhouse", "WiFi", "Pet Friendly", "Laundry", 
  "Playground", "Boat Ramp", "Fishing", "Hiking Trails", "Store/Shop", 
  "Restaurant", "Full Hookups", "Bathhouse", "Recreation Hall"
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    notation: value >= 1000000 ? 'compact' : 'standard'
  }).format(value);
};

// Example saved searches
const savedSearches = [
  { name: "Florida Waterfront Parks", count: 12, lastUpdated: "2 days ago" },
  { name: "Texas High-Cap Properties", count: 8, lastUpdated: "1 week ago" },
  { name: "Campgrounds Under $2M", count: 23, lastUpdated: "3 days ago" }
];

// Updated price range marks with 50M max
const priceMarks = [
  { value: 0, label: '$0' },
  { value: 10000000, label: '$10M' },
  { value: 20000000, label: '$20M' },
  { value: 30000000, label: '$30M' },
  { value: 40000000, label: '$40M' },
  { value: 50000000, label: '$50M' },
];

const Listings = () => {
  // Base and extended filter states
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    ...initialFilterOptions,
    priceMax: 50000000 // Set maximum price to 50M as requested
  });
  const [extendedFilters, setExtendedFilters] = useState<ExtendedFilterOptions>(initialExtendedFilters);
  
  // State for listings data
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [recentlyViewedListings, setRecentlyViewedListings] = useState<Listing[]>([]);
  
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("all");
  
  // Direct price inputs
  const [priceMinInput, setPriceMinInput] = useState(extendedFilters.priceMin.toString());
  const [priceMaxInput, setPriceMaxInput] = useState(extendedFilters.priceMax.toString());
  
  // Saved filter state
  const [hasSavedCurrentFilter, setHasSavedCurrentFilter] = useState(false);
  const [showRecentlyViewed, setShowRecentlyViewed] = useState(false);
  
  const formatPercent = (value: number) => {
    return `${value}%`;
  };
  
// Initial fetch of all approved listings
useEffect(() => {
  const loadListings = async () => {
    setIsLoading(true);
    try {
      console.log('[Listings] Starting to fetch approved listings');
      
      // Create a minimal filter to avoid complex queries initially
      const data = await fetchApprovedListings({ 
        priceMax: 50000000,
        sitesMax: 500 // Keep this simple
      });
      
      console.log(`[Listings] Received ${data.length} listings from service`);
      setListings(data);
      setFilteredListings(data);
      
      if (data.length > 0) {
        const recentViewed = data.slice(0, Math.min(3, data.length)).map(listing => ({
          ...listing,
          viewedOn: new Date().toLocaleDateString()
        }));
        setRecentlyViewedListings(recentViewed);
      }
      
      setError(null);
    } catch (err) {
      console.error('[Listings] Error loading listings:', err);
      setError('Failed to load listings. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  loadListings();
}, []);  
  // Track active filters
  useEffect(() => {
    const active: string[] = [];
    if (extendedFilters.priceMin > initialExtendedFilters.priceMin) active.push("Min Price");
    if (extendedFilters.priceMax < initialExtendedFilters.priceMax) active.push("Max Price");
    if (extendedFilters.states.length > 0) active.push("States");
    if (extendedFilters.types.length > 0) active.push("Property Types");
    if (extendedFilters.features.length > 0) active.push("Features");
    if (extendedFilters.sitesMin > initialExtendedFilters.sitesMin) active.push("Min Sites");
    if (extendedFilters.sitesMax < initialExtendedFilters.sitesMax) active.push("Max Sites");
    if (extendedFilters.capRateMin > initialExtendedFilters.capRateMin) active.push("Cap Rate");
    if (extendedFilters.occupancyRateMin > initialExtendedFilters.occupancyRateMin) active.push("Occupancy");
    if (extendedFilters.listedWithinDays) active.push("Date Listed");
    if (search || extendedFilters.search) active.push("Search");
    setActiveFilters(active);
  }, [extendedFilters, search]);

  // Apply filters using the listing service
  useEffect(() => {
    const applyFilters = async () => {
      setIsLoading(true);
      
      try {
        // Build filter object for Supabase query
        // Note: status filtering is handled internally by fetchApprovedListings
        const filterObject = {
          priceMin: extendedFilters.priceMin,
          priceMax: extendedFilters.priceMax,
          sitesMin: extendedFilters.sitesMin,
          sitesMax: extendedFilters.sitesMax,
          capRateMin: extendedFilters.capRateMin,
          occupancyRateMin: extendedFilters.occupancyRateMin,
          search: search || extendedFilters.search,
          state: undefined  // Add this property with undefined default
        };

        // Now set the state property if applicable
        if (extendedFilters.states.length === 1) {
          filterObject.state = extendedFilters.states[0];
        }
              
        // Fetch filtered listings - only approved listings will be returned
        let filtered = await fetchApprovedListings(filterObject);
        
        // Apply any client-side filters that can't be done efficiently in the DB
        
        // Filter by multiple states if more than one selected
        if (extendedFilters.states.length > 1) {
          filtered = filtered.filter(listing => 
            extendedFilters.states.includes(listing.location.state)
          );
        }
        
        // Filter by property types
        if (extendedFilters.types.length > 0) {
          filtered = filtered.filter(listing => {
            const listingType = listing.title.includes("RV") ? "RV Park" : 
                             listing.title.includes("Camp") ? "Campground" : "Resort";
            return extendedFilters.types.includes(listingType);
          });
        }
        
        // Filter by features/amenities
        if (extendedFilters.features.length > 0) {
          filtered = filtered.filter(listing => {
            return extendedFilters.features.some(feature => 
              listing.description.toLowerCase().includes(feature.toLowerCase())
            );
          });
        }
        
        // Filter by listing date
        if (extendedFilters.listedWithinDays) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - extendedFilters.listedWithinDays);
          filtered = filtered.filter(listing => new Date(listing.createdAt) >= cutoffDate);
        }
        
        // Filter by annual revenue
        if (extendedFilters.revenueMin > initialExtendedFilters.revenueMin || 
            extendedFilters.revenueMax < initialExtendedFilters.revenueMax) {
          filtered = filtered.filter(listing => {
            const revenue = listing.annualRevenue || listing.price * 0.1;
            return revenue >= extendedFilters.revenueMin && revenue <= extendedFilters.revenueMax;
          });
        }
        
        // Apply sorting
        filtered = sortListings(filtered, sortBy);
        
        setFilteredListings(filtered);
        setError(null);
      } catch (err) {
        console.error('Error applying filters:', err);
        setError('Failed to filter listings. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce filter changes to prevent too many API calls
    const timeoutId = setTimeout(applyFilters, 300);
    return () => clearTimeout(timeoutId);
    
  }, [filterOptions, extendedFilters, sortBy, search]);
  
  const handleFilterChange = (updates: Partial<ExtendedFilterOptions>) => {
    setExtendedFilters(prev => ({
      ...prev,
      ...updates
    }));
    
    // If price inputs are updated, update the input fields too
    if (updates.priceMin !== undefined) {
      setPriceMinInput(updates.priceMin.toString());
    }
    if (updates.priceMax !== undefined) {
      setPriceMaxInput(updates.priceMax.toString());
    }
    
    // Reset saved state when filters change
    setHasSavedCurrentFilter(false);
  };
  
  const clearFilters = () => {
    setExtendedFilters(initialExtendedFilters);
    setFilterOptions({
      ...initialFilterOptions,
      priceMax: 50000000 // Maintain the 50M max price when clearing filters
    });
    setSearch('');
    setPriceMinInput(initialExtendedFilters.priceMin.toString());
    setPriceMaxInput(initialExtendedFilters.priceMax.toString());
    setHasSavedCurrentFilter(false);
  };
  
  const removeFilter = (filter: string) => {
    switch(filter) {
      case "Min Price":
        handleFilterChange({ priceMin: initialExtendedFilters.priceMin });
        break;
      case "Max Price":
        handleFilterChange({ priceMax: initialExtendedFilters.priceMax });
        break;
      case "States":
        handleFilterChange({ states: [] });
        break;
      case "Property Types":
        handleFilterChange({ types: [] });
        break;
      case "Features":
        handleFilterChange({ features: [] });
        break;
      case "Min Sites":
        handleFilterChange({ sitesMin: initialExtendedFilters.sitesMin });
        break;
      case "Max Sites":
        handleFilterChange({ sitesMax: initialExtendedFilters.sitesMax });
        break;
      case "Cap Rate":
        handleFilterChange({ capRateMin: initialExtendedFilters.capRateMin });
        break;
      case "Occupancy":
        handleFilterChange({ occupancyRateMin: initialExtendedFilters.occupancyRateMin });
        break;
      case "Date Listed":
        handleFilterChange({ listedWithinDays: null });
        break;
      case "Search":
        setSearch('');
        handleFilterChange({ search: '' });
        break;
      default:
        break;
    }
  };
  
  const sortListings = (listings: Listing[], sortType: string) => {
    const sorted = [...listings];
    switch (sortType) {
      case "newest":
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "oldest":
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case "priceHigh":
        return sorted.sort((a, b) => b.price - a.price);
      case "priceLow":
        return sorted.sort((a, b) => a.price - b.price);
      case "sizeLarge":
        return sorted.sort((a, b) => b.numSites - a.numSites);
      case "sizeSmall":
        return sorted.sort((a, b) => a.numSites - b.numSites);
      case "capRate":
        return sorted.sort((a, b) => b.capRate - a.capRate);
      default:
        return sorted;
    }
  };
  
  const applyQuickFilter = (filterId: string) => {
    let updates: Partial<ExtendedFilterOptions> = {};
    
    switch (filterId) {
      case "budget":
        updates = { priceMax: 1000000 };
        break;
      case "highCapRate":
        updates = { capRateMin: 8 };
        break;
      case "newListings":
        updates = { listedWithinDays: 7 };
        break;
      case "largeSites":
        updates = { sitesMin: 100 };
        break;
      case "waterfront":
        updates = { features: ["Waterfront"] };
        break;
      case "trending":
        // This would normally hit an API for trending properties
        setSortBy("newest");
        break;
    }
    
    handleFilterChange(updates);
  };
  
  const handlePriceInputChange = (isMin: boolean, value: string) => {
    // Only update the text input, we'll apply the filter when blurred
    if (isMin) {
      setPriceMinInput(value);
    } else {
      setPriceMaxInput(value);
    }
  };
  
  const applyPriceInput = (isMin: boolean) => {
    try {
      const numValue = isMin 
        ? Math.max(0, Number(priceMinInput.replace(/[^\d]/g, ''))) 
        : Math.max(0, Number(priceMaxInput.replace(/[^\d]/g, '')));
      
      // Enforce the 50M maximum price
      const finalValue = isMin 
        ? numValue 
        : Math.min(numValue, 50000000);
      
      if (!isNaN(finalValue)) {
        handleFilterChange(isMin ? { priceMin: finalValue } : { priceMax: finalValue });
      }
    } catch (e) {
      // Reset to current filter value on error
      if (isMin) {
        setPriceMinInput(extendedFilters.priceMin.toString());
      } else {
        setPriceMaxInput(extendedFilters.priceMax.toString());
      }
    }
  };
  
  const saveCurrentFilter = () => {
    // This would normally save to user profile or local storage
    setHasSavedCurrentFilter(true);
    
    // Show notification or feedback
    setTimeout(() => {
      // Reset saved state
      setHasSavedCurrentFilter(false);
    }, 3000);
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.05 
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Fixed Header with z-index */}
        <div 
          id="main-header" 
          className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm"
        >
          <Header />
        </div>
        
        {/* Improved HeaderSpacer to create space for the fixed header */}
        
        {/* Hero Header with enhanced gradient */}
        <div className="relative bg-gradient-to-r from-[#f74f4f] to-[#ff7a45] py-12 md:py-16">
          <div className="absolute inset-0 overflow-hidden opacity-20">
            <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white rounded-full blur-3xl"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                RV Parks & Campgrounds For Sale
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-6">
                Find the perfect investment opportunity from our curated selection of properties across the United States.
              </p>
              
              {/* Enhanced search bar */}
              <div className="relative max-w-2xl">
                <div className="relative">
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by location, name, or features..."
                    className="pl-10 pr-12 py-6 rounded-lg bg-white/95 backdrop-blur-sm border-0 ring-2 ring-white/20 focus:ring-white text-gray-800 placeholder-gray-500 shadow-lg w-full transition-shadow"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  
                  {/* Quick filter access */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                    {search && (
                      <button 
                        onClick={() => setSearch('')}
                        className="mr-2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-gray-500 hover:text-[#f74f4f] p-1 rounded-md hover:bg-gray-100/50">
                          <SlidersHorizontal className="h-5 w-5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-[300px] p-3">
                        <div className="space-y-4 pt-1">
                          <h3 className="font-medium">Quick Filters</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {quickFilters.map(filter => (
                              <Tooltip key={filter.id}>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => applyQuickFilter(filter.id)}
                                    className="flex justify-start items-center gap-2 h-auto py-2"
                                  >
                                    <filter.icon className="h-4 w-4 text-[#f74f4f]" />
                                    <span>{filter.label}</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{filter.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="container mx-auto px-4 py-6">
          {/* Error message if API call fails */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Error</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          )}
          
          {/* Recently viewed section (collapsible) */}
          {showRecentlyViewed && recentlyViewedListings.length > 0 && (
            <div className="mb-6 bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-[#f74f4f] mr-2" />
                  <h3 className="font-medium">Recently Viewed</h3>
                </div>
                <button 
                  onClick={() => setShowRecentlyViewed(false)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentlyViewedListings.map((listing) => (
                  <div key={listing.id} className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                      <img 
                        src={listing.images[0]} 
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{listing.title}</p>
                      <p className="text-[#f74f4f] text-sm font-semibold">{formatCurrency(listing.price)}</p>
                      <p className="text-gray-500 text-xs">Viewed on {(listing as any).viewedOn || 'recently'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Toolbar and filter indicators */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-4 w-4 text-[#f74f4f]" />
                <h2 className="text-lg font-medium">
                  {isLoading 
                    ? "Loading properties..." 
                    : `Showing ${filteredListings.length} properties`}
                </h2>
                {!showRecentlyViewed && recentlyViewedListings.length > 0 && (
                  <button 
                    onClick={() => setShowRecentlyViewed(true)}
                    className="text-xs text-[#f74f4f] hover:underline ml-2 flex items-center"
                  >
                    <Eye className="h-3 w-3 mr-1" /> View Recently Viewed
                  </button>
                )}
              </div>
              
              {/* Enhanced active filters display */}
              <div className="flex flex-wrap gap-2 items-center">
                {activeFilters.length > 0 && (
                  <span className="text-sm text-gray-500">Filters:</span>
                )}
                {activeFilters.map((filter) => (
                  <Badge 
                    key={filter}
                    variant="outline" 
                    className="bg-[#f74f4f]/10 text-[#f74f4f] border-[#f74f4f]/20 flex items-center gap-1 font-medium"
                  >
                    {filter}
                    <button 
                      onClick={() => removeFilter(filter)} 
                      className="ml-1 hover:bg-[#f74f4f]/20 rounded-full p-0.5"
                      aria-label={`Remove ${filter} filter`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {activeFilters.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="text-[#f74f4f] hover:bg-[#f74f4f]/10 text-xs h-7"
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </div>
          
            {/* Action buttons area */}
            <div className="flex items-center space-x-3 self-end md:self-auto">
              {/* Save current filter */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={hasSavedCurrentFilter ? "default" : "outline"} 
                    size="sm"
                    onClick={saveCurrentFilter}
                    disabled={hasSavedCurrentFilter || activeFilters.length === 0}
                    className={hasSavedCurrentFilter 
                      ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                      : "border-gray-300"
                    }
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {hasSavedCurrentFilter ? "Saved" : "Save Filter"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save current search for future use</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Advanced filters for mobile */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="md:hidden border-[#f74f4f] text-[#f74f4f]"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {activeFilters.length > 0 && (
                      <span className="ml-1 w-5 h-5 rounded-full bg-[#f74f4f] text-white text-xs flex items-center justify-center">
                        {activeFilters.length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md p-0" side="right">
                  <SheetHeader className="px-4 py-6 border-b">
                    <SheetTitle>Filter Properties</SheetTitle>
                    <SheetDescription>
                      Refine your search results
                    </SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-10rem)]">
                    <div className="p-4">
                      <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid grid-cols-3 mb-4">
                          <TabsTrigger value="all">All</TabsTrigger>
                          <TabsTrigger value="property">Property</TabsTrigger>
                          <TabsTrigger value="financial">Financial</TabsTrigger>
                        </TabsList>
                        
                        {/* All filters tab */}
                        <TabsContent value="all" className="space-y-6">
                          {/* Price Range */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-base font-medium">Price Range</Label>
                              <div className="flex gap-2 items-center">
                                <Input
                                  type="text"
                                  value={priceMinInput}
                                  onChange={(e) => handlePriceInputChange(true, e.target.value)}
                                  onBlur={() => applyPriceInput(true)}
                                  placeholder="Min"
                                  className="w-24 text-xs h-8"
                                />
                                <span className="text-sm text-gray-500">to</span>
                                <Input
                                  type="text"
                                  value={priceMaxInput}
                                  onChange={(e) => handlePriceInputChange(false, e.target.value)}
                                  onBlur={() => applyPriceInput(false)}
                                  placeholder="Max"
                                  className="w-24 text-xs h-8"
                                />
                              </div>
                            </div>
                            <RangeSlider
                              min={0}
                              max={50000000}
                              step={1000000}
                              value={[extendedFilters.priceMin, extendedFilters.priceMax]}
                              onValueChange={(value) => {
                                handleFilterChange({
                                  priceMin: value[0],
                                  priceMax: value[1]
                                });
                              }}
                              formatValue={formatCurrency}
                              showValues={false}
                              marks={priceMarks}
                            />
                          </div>
                          
                          <Separator />
                          
                          {/* Location Section */}
                          <div className="space-y-4">
                            <Label className="text-base font-medium">Location</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {states.slice(0, 8).map((state) => (
                                <div key={state} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`mobile-state-${state}`}
                                    checked={extendedFilters.states.includes(state)}
                                    onCheckedChange={(checked) => {
                                      const newStates = checked
                                        ? [...extendedFilters.states, state]
                                        : extendedFilters.states.filter(s => s !== state);
                                      handleFilterChange({ states: newStates });
                                    }}
                                    className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                                  />
                                  <label htmlFor={`mobile-state-${state}`} className="text-sm cursor-pointer">
                                    {state}
                                  </label>
                                </div>
                              ))}
                            </div>
                            {states.length > 8 && (
                              <Button variant="link" size="sm" className="text-[#f74f4f] p-0">
                                View all states
                              </Button>
                            )}
                          </div>
                          
                          <Separator />
                          
                          {/* Property Type Section */}
                          <div className="space-y-4">
                            <Label className="text-base font-medium">Property Type</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {propertyTypes.map((type) => (
                                <div key={type.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`mobile-type-${type.id}`}
                                    checked={extendedFilters.types.includes(type.label)}
                                    onCheckedChange={(checked) => {
                                      const newTypes = checked
                                        ? [...extendedFilters.types, type.label]
                                        : extendedFilters.types.filter(t => t !== type.label);
                                      handleFilterChange({ types: newTypes });
                                    }}
                                    className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                                  />
                                  <label htmlFor={`mobile-type-${type.id}`} className="text-sm cursor-pointer flex items-center gap-1">
                                    <type.icon className="h-3.5 w-3.5 text-gray-500" />
                                    {type.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <Separator />
                          
                          {/* Site Count Range */}
                          <div className="space-y-4">
                            <Label className="text-base font-medium">Number of Sites</Label>
                            <RangeSlider
                              min={0}
                              max={500}
                              step={10}
                              value={[extendedFilters.sitesMin, extendedFilters.sitesMax]}
                              onValueChange={(value) => {
                                handleFilterChange({
                                  sitesMin: value[0],
                                  sitesMax: value[1]
                                });
                              }}
                              formatValue={(value) => `${value} sites`}
                            />
                          </div>
                          
                          <Separator />
                          
                          {/* Financial Metrics */}
                          <div className="space-y-4">
                            <Label className="text-base font-medium">Cap Rate</Label>
                            <RangeSlider
                              min={0}
                              max={15}
                              step={0.5}
                              value={[extendedFilters.capRateMin]}
                              onValueChange={(value) => {
                                handleFilterChange({
                                  capRateMin: value[0]
                                });
                              }}
                              formatValue={formatPercent}
                              marks={[
                                { value: 0, label: '0%' },
                                { value: 15, label: '15%+' },
                              ]}
                            />
                          </div>
                          
                          <Separator />
                          
                          {/* Date Listed */}
                          <div className="space-y-4">
                            <Label className="text-base font-medium">Date Listed</Label>
                            <Select
                              value={extendedFilters.listedWithinDays?.toString() || ""}
                              onValueChange={(value) => {
                                handleFilterChange({
                                  listedWithinDays: value ? parseInt(value) : null
                                });
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Any time" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="any">Any time</SelectItem>
                                <SelectItem value="7">Last 7 days</SelectItem>
                                <SelectItem value="30">Last 30 days</SelectItem>
                                <SelectItem value="90">Last 90 days</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TabsContent>
                        
                        {/* Property-specific filters tab */}
                        <TabsContent value="property" className="space-y-6">
                          {/* Property Types with Icons */}
                          <div className="space-y-4">
                            <Label className="text-base font-medium">Property Type</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {propertyTypes.map((type) => (
                                <div key={type.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`prop-type-${type.id}`}
                                    checked={extendedFilters.types.includes(type.label)}
                                    onCheckedChange={(checked) => {
                                      const newTypes = checked
                                        ? [...extendedFilters.types, type.label]
                                        : extendedFilters.types.filter(t => t !== type.label);
                                      handleFilterChange({ types: newTypes });
                                    }}
                                    className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                                  />
                                  <label htmlFor={`prop-type-${type.id}`} className="text-sm cursor-pointer flex items-center gap-1">
                                    <type.icon className="h-3.5 w-3.5 text-gray-500" />
                                    {type.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <Separator />
                          
                          {/* Sites Range */}
                          <div className="space-y-4">
                            <Label className="text-base font-medium">Number of Sites</Label>
                            <RangeSlider
                              min={0}
                              max={500}
                              step={10}
                              value={[extendedFilters.sitesMin, extendedFilters.sitesMax]}
                              onValueChange={(value) => {
                                handleFilterChange({
                                  sitesMin: value[0],
                                  sitesMax: value[1]
                                });
                              }}
                              formatValue={(value) => `${value} sites`}
                            />
                          </div>
                          
                          <Separator />
                          
                          {/* Amenities/Features */}
                          <div className="space-y-4">
                            <Label className="text-base font-medium">Amenities & Features</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {amenityFeatures.slice(0, 10).map((feature) => (
                                <div key={feature} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`feature-${feature}`}
                                    checked={extendedFilters.features.includes(feature)}
                                    onCheckedChange={(checked) => {
                                      const newFeatures = checked
                                        ? [...extendedFilters.features, feature]
                                        : extendedFilters.features.filter(f => f !== feature);
                                      handleFilterChange({ features: newFeatures });
                                    }}
                                    className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                                  />
                                  <label htmlFor={`feature-${feature}`} className="text-sm cursor-pointer">
                                    {feature}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <Separator />
                          
                          {/* States */}
                          <div className="space-y-4">
                            <Label className="text-base font-medium">Location</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {states.slice(0, 8).map((state) => (
                                <div key={state} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`prop-state-${state}`}
                                    checked={extendedFilters.states.includes(state)}
                                    onCheckedChange={(checked) => {
                                      const newStates = checked
                                        ? [...extendedFilters.states, state]
                                        : extendedFilters.states.filter(s => s !== state);
                                      handleFilterChange({ states: newStates });
                                    }}
                                    className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                                  />
                                  <label htmlFor={`prop-state-${state}`} className="text-sm cursor-pointer">
                                    {state}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                        
                        {/* Financial metrics tab */}
                        <TabsContent value="financial" className="space-y-6">
                          {/* Price Range */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-base font-medium">Price Range</Label>
                              <div className="flex gap-2 items-center">
                                <Input
                                  type="text"
                                  value={priceMinInput}
                                  onChange={(e) => handlePriceInputChange(true, e.target.value)}
                                  onBlur={() => applyPriceInput(true)}
                                  placeholder="Min"
                                  className="w-24 text-xs h-8"
                                />
                                <span className="text-sm text-gray-500">to</span>
                                <Input
                                  type="text"
                                  value={priceMaxInput}
                                  onChange={(e) => handlePriceInputChange(false, e.target.value)}
                                  onBlur={() => applyPriceInput(false)}
                                  placeholder="Max"
                                  className="w-24 text-xs h-8"
                                />
                              </div>
                            </div>
                            <RangeSlider
                              min={0}
                              max={50000000}
                              step={1000000}
                              value={[extendedFilters.priceMin, extendedFilters.priceMax]}
                              onValueChange={(value) => {
                                handleFilterChange({
                                  priceMin: value[0],
                                  priceMax: value[1]
                                });
                              }}
                              formatValue={formatCurrency}
                              showValues={false}
                              marks={priceMarks}
                            />
                          </div>
                          
                          <Separator />
                          
                          {/* Cap Rate */}
                          <div className="space-y-4">
                            <Label className="text-base font-medium">Minimum Cap Rate</Label>
                            <RangeSlider
                              min={0}
                              max={15}
                              step={0.5}
                              value={[extendedFilters.capRateMin]}
                              onValueChange={(value) => {
                                handleFilterChange({
                                  capRateMin: value[0]
                                });
                              }}
                              formatValue={formatPercent}
                              marks={[
                                { value: 0, label: '0%' },
                                { value: 5, label: '5%' },
                                { value: 10, label: '10%' },
                                { value: 15, label: '15%+' },
                              ]}
                            />
                          </div>
                          
                          <Separator />
                          
                          {/* Occupancy Rate */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Minimum Occupancy Rate</Label>
                              <span className="text-sm font-medium">
                                {extendedFilters.occupancyRateMin}%+
                              </span>
                            </div>
                            <RangeSlider
                              min={0}
                              max={100}
                              step={5}
                              value={[extendedFilters.occupancyRateMin]}
                              onValueChange={(value) => {
                                handleFilterChange({
                                  occupancyRateMin: value[0]
                                });
                              }}
                              formatValue={formatPercent}
                              marks={[
                                { value: 0, label: '0%' },
                                { value: 50, label: '50%' },
                                { value: 100, label: '100%' },
                              ]}
                            />
                          </div>
                          
                          <Separator />
                          
                          {/* Annual Revenue */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Annual Revenue</Label>
                              <div className="text-xs text-gray-500">
                                {formatCurrency(extendedFilters.revenueMin)} - {formatCurrency(extendedFilters.revenueMax)}
                              </div>
                            </div>
                            <RangeSlider
                              min={0}
                              max={5000000}
                              step={100000}
                              value={[extendedFilters.revenueMin, extendedFilters.revenueMax]}
                              onValueChange={(value) => {
                                handleFilterChange({
                                  revenueMin: value[0],
                                  revenueMax: value[1]
                                });
                              }}
                              formatValue={formatCurrency}
                            />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </ScrollArea>
                  <SheetFooter className="p-4 border-t flex-row justify-between">
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                    >
                      Clear All
                    </Button>
                    <SheetClose asChild>
                      <Button 
                        className="bg-[#f74f4f] hover:bg-[#e43c3c]"
                      >
                        Show Results ({filteredListings.length})
                      </Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
              
              {/* Sort dropdown with enhanced options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-gray-300">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Sort Properties</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("newest")} className={sortBy === "newest" ? "bg-[#f74f4f]/10 text-[#f74f4f]" : ""}>
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("oldest")} className={sortBy === "oldest" ? "bg-[#f74f4f]/10 text-[#f74f4f]" : ""}>
                    Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("priceHigh")} className={sortBy === "priceHigh" ? "bg-[#f74f4f]/10 text-[#f74f4f]" : ""}>
                    Price: High to Low
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("priceLow")} className={sortBy === "priceLow" ? "bg-[#f74f4f]/10 text-[#f74f4f]" : ""}>
                    Price: Low to High
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("capRate")} className={sortBy === "capRate" ? "bg-[#f74f4f]/10 text-[#f74f4f]" : ""}>
                    Highest Cap Rate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("sizeLarge")} className={sortBy === "sizeLarge" ? "bg-[#f74f4f]/10 text-[#f74f4f]" : ""}>
                    Most Sites
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* View toggle with icons */}
              <div className="hidden sm:flex items-center border rounded-md overflow-hidden">
                <button 
                  className={`p-1.5 ${view === 'grid' ? 'bg-[#f74f4f] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setView('grid')}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button 
                  className={`p-1.5 ${view === 'map' ? 'bg-[#f74f4f] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setView('map')}
                >
                  <Map className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Enhanced desktop filters with tabs */}
          <div className="hidden md:block mb-6 bg-white rounded-lg shadow-sm border overflow-hidden">
            <Tabs defaultValue="main" className="w-full">
              <div className="px-4 pt-4 pb-0 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-lg">Filters</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-600 hover:text-[#f74f4f] text-xs h-7"
                  >
                    Clear all filters
                  </Button>
                </div>
                <TabsList className="bg-transparent border-b-0 p-0">
                  <TabsTrigger value="main" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#f74f4f] data-[state=active]:text-[#f74f4f] rounded-none h-9 px-4">
                    Main
                  </TabsTrigger>
                  <TabsTrigger value="amenities" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#f74f4f] data-[state=active]:text-[#f74f4f] rounded-none h-9 px-4">
                    Features & Amenities
                  </TabsTrigger>
                  <TabsTrigger value="financial" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#f74f4f] data-[state=active]:text-[#f74f4f] rounded-none h-9 px-4">
                    Financial
                  </TabsTrigger>
                  <TabsTrigger value="saved" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#f74f4f] data-[state=active]:text-[#f74f4f] rounded-none h-9 px-4">
                    Saved Searches
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="main" className="p-4 border-0 mt-0">
                <div className="flex flex-wrap gap-6">
                  {/* Price Range Slider with Input Fields */}
                  <div className="w-72">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-sm font-medium">Price Range (up to $50M)</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="text"
                          value={priceMinInput}
                          onChange={(e) => handlePriceInputChange(true, e.target.value)}
                          onBlur={() => applyPriceInput(true)}
                          placeholder="Min"
                          className="w-20 text-xs h-7"
                        />
                        <span className="text-xs text-gray-500">to</span>
                        <Input
                          type="text"
                          value={priceMaxInput}
                          onChange={(e) => handlePriceInputChange(false, e.target.value)}
                          onBlur={() => applyPriceInput(false)}
                          placeholder="Max"
                          className="w-20 text-xs h-7"
                        />
                      </div>
                    </div>
                    <RangeSlider
                      min={0}
                      max={50000000}
                      step={1000000}
                      value={[extendedFilters.priceMin, extendedFilters.priceMax]}
                      onValueChange={(value) => {
                        handleFilterChange({
                          priceMin: value[0],
                          priceMax: value[1]
                        });
                      }}
                      formatValue={formatCurrency}
                      showValues={false}
                      marks={priceMarks}
                    />
                  </div>
                  
                  {/* Location with multi-select */}
                  <div className="w-48">
                    <Label className="text-sm font-medium mb-2 block">Location</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between text-left font-normal">
                          {extendedFilters.states.length 
                            ? extendedFilters.states.length > 1 
                                            ? `${extendedFilters.states.length} States` 
              : extendedFilters.states[0]
            : "All States"}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <ScrollArea className="h-80">
          <div className="p-4 grid grid-cols-2 gap-2">
            {states.map((state) => (
              <div key={state} className="flex items-center space-x-2">
                <Checkbox
                  id={`desktop-state-${state}`}
                  checked={extendedFilters.states.includes(state)}
                  onCheckedChange={(checked) => {
                    const newStates = checked
                      ? [...extendedFilters.states, state]
                      : extendedFilters.states.filter(s => s !== state);
                    handleFilterChange({ states: newStates });
                  }}
                  className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                />
                <label htmlFor={`desktop-state-${state}`} className="text-sm cursor-pointer">
                  {state}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  </div>
  
  {/* Property Types */}
  <div className="w-48">
    <Label className="text-sm font-medium mb-2 block">Property Type</Label>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between text-left font-normal">
          {extendedFilters.types.length 
            ? extendedFilters.types.length > 1 
              ? `${extendedFilters.types.length} Types` 
              : extendedFilters.types[0]
            : "All Types"}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <div className="p-4">
          {propertyTypes.map((type) => (
            <div key={type.id} className="flex items-center space-x-2 mb-2">
              <Checkbox
                id={`desktop-type-${type.id}`}
                checked={extendedFilters.types.includes(type.label)}
                onCheckedChange={(checked) => {
                  const newTypes = checked
                    ? [...extendedFilters.types, type.label]
                    : extendedFilters.types.filter(t => t !== type.label);
                  handleFilterChange({ types: newTypes });
                }}
                className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
              />
              <label htmlFor={`desktop-type-${type.id}`} className="text-sm cursor-pointer flex items-center gap-1">
                <type.icon className="h-3.5 w-3.5 text-gray-500" />
                {type.label}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  </div>

  {/* Number of sites */}
  <div className="w-48">
    <Label className="text-sm font-medium mb-2 block">Number of Sites</Label>
    <div className="flex justify-between text-xs text-gray-500 mb-2">
      <span>{extendedFilters.sitesMin} - {extendedFilters.sitesMax} sites</span>
    </div>
    <RangeSlider
      min={0}
      max={500}
      step={10}
      value={[extendedFilters.sitesMin, extendedFilters.sitesMax]}
      onValueChange={(value) => {
        handleFilterChange({
          sitesMin: value[0],
          sitesMax: value[1]
        });
      }}
      formatValue={(value) => `${value} sites`}
    />
  </div>
</div>
</TabsContent>

<TabsContent value="amenities" className="p-4 border-0 mt-0">
<div className="grid grid-cols-3 gap-6">
  <div className="col-span-3 mb-2">
    <h3 className="font-medium text-sm text-gray-700">Available Amenities & Features</h3>
    <p className="text-xs text-gray-500">Select the features you're looking for in a property</p>
  </div>
  
  {amenityFeatures.map((feature) => (
    <div key={feature} className="flex items-center space-x-2">
      <Checkbox
        id={`desktop-feature-${feature}`}
        checked={extendedFilters.features.includes(feature)}
        onCheckedChange={(checked) => {
          const newFeatures = checked
            ? [...extendedFilters.features, feature]
            : extendedFilters.features.filter(f => f !== feature);
          handleFilterChange({ features: newFeatures });
        }}
        className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
      />
      <label htmlFor={`desktop-feature-${feature}`} className="text-sm cursor-pointer">
        {feature}
      </label>
    </div>
  ))}
</div>
</TabsContent>

<TabsContent value="financial" className="p-4 border-0 mt-0">
<div className="grid grid-cols-2 gap-8">
  {/* Cap Rate */}
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium">Minimum Cap Rate</Label>
      <span className="text-sm font-medium">
        {extendedFilters.capRateMin}%+
      </span>
    </div>
    <RangeSlider
      min={0}
      max={15}
      step={0.5}
      value={[extendedFilters.capRateMin]}
      onValueChange={(value) => {
        handleFilterChange({
          capRateMin: value[0]
        });
      }}
      formatValue={formatPercent}
      marks={[
        { value: 0, label: '0%' },
        { value: 5, label: '5%' },
        { value: 10, label: '10%' },
        { value: 15, label: '15%+' },
      ]}
    />
  </div>
  
  {/* Occupancy Rate */}
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium">Minimum Occupancy Rate</Label>
      <span className="text-sm font-medium">
        {extendedFilters.occupancyRateMin}%+
      </span>
    </div>
    <RangeSlider
      min={0}
      max={100}
      step={5}
      value={[extendedFilters.occupancyRateMin]}
      onValueChange={(value) => {
        handleFilterChange({
          occupancyRateMin: value[0]
        });
      }}
      formatValue={formatPercent}
      marks={[
        { value: 0, label: '0%' },
        { value: 50, label: '50%' },
        { value: 100, label: '100%' },
      ]}
    />
  </div>
  
  {/* Annual Revenue */}
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium">Annual Revenue</Label>
      <div className="text-xs text-gray-500">
        {formatCurrency(extendedFilters.revenueMin)} - {formatCurrency(extendedFilters.revenueMax)}
      </div>
    </div>
    <RangeSlider
      min={0}
      max={5000000}
      step={100000}
      value={[extendedFilters.revenueMin, extendedFilters.revenueMax]}
      onValueChange={(value) => {
        handleFilterChange({
          revenueMin: value[0],
          revenueMax: value[1]
        });
      }}
      formatValue={formatCurrency}
    />
  </div>
  
  {/* Date Listed */}
  <div className="space-y-4">
    <Label className="text-sm font-medium">Date Listed</Label>
    <Select
      value={extendedFilters.listedWithinDays?.toString() || ""}
      onValueChange={(value) => {
        handleFilterChange({
          listedWithinDays: value ? parseInt(value) : null
        });
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Any time" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="any">Any time</SelectItem>
        <SelectItem value="7">Last 7 days</SelectItem>
        <SelectItem value="30">Last 30 days</SelectItem>
        <SelectItem value="90">Last 90 days</SelectItem>
        <SelectItem value="180">Last 6 months</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
</TabsContent>

<TabsContent value="saved" className="p-4 border-0 mt-0">
  {savedSearches.length > 0 ? (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Your saved searches</p>
      
      {savedSearches.map((savedSearch, index) => (
        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md hover:bg-gray-100">
          <div>
            <h4 className="font-medium text-sm">{savedSearch.name}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <span>{savedSearch.count} properties</span>
              <span>•</span>
              <span>Updated {savedSearch.lastUpdated}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <Zap className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Apply this search</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete saved search</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      ))}
      
      <Button variant="outline" size="sm" className="mt-2 w-full">
        <Bookmark className="h-4 w-4 mr-2" />
        Save current search
      </Button>
    </div>
  ) : (
    <div className="text-center py-8">
      <Bookmark className="h-8 w-8 text-gray-400 mx-auto mb-2" />
      <h3 className="font-medium mb-1">No saved searches</h3>
      <p className="text-sm text-gray-500 mb-4">Save your favorite searches for quick access later</p>
      <Button 
        variant="outline" 
        size="sm"
        onClick={saveCurrentFilter}
        disabled={activeFilters.length === 0}
      >
        <Save className="mr-2 h-4 w-4" />
        Save current search
      </Button>
    </div>
  )}
</TabsContent>
</Tabs>
</div>

{/* Results */}
<div className="mb-10">
  {isLoading ? (
    <div className="py-10 flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#f74f4f]/20 border-t-[#f74f4f] rounded-full animate-spin mb-4"></div>
      <p className="text-muted-foreground">Searching for properties...</p>
    </div>
  ) : error ? (
    <div className="bg-white rounded-lg border py-16 text-center">
      <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Error Loading Listings</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {error}
      </p>
      <Button onClick={() => window.location.reload()} className="bg-[#f74f4f] hover:bg-[#e43c3c]">
        Try Again
      </Button>
    </div>
  ) : filteredListings.length === 0 ? (
    <div className="bg-white rounded-lg border py-16 text-center">
      <div className="mx-auto w-16 h-16 bg-[#f74f4f]/10 rounded-full flex items-center justify-center mb-4">
        <Search className="h-8 w-8 text-[#f74f4f]" />
      </div>
      <h2 className="text-2xl font-bold mb-2">No listings found</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        We couldn't find any properties matching your criteria. Try adjusting your filters or search terms.
      </p>
      <Button onClick={clearFilters} className="bg-[#f74f4f] hover:bg-[#e43c3c]">
        Clear all filters
      </Button>
    </div>
  ) : view === 'grid' ? (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {filteredListings.map(listing => (
          <motion.div 
            key={listing.id} 
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            layout
          >
            <ListingCard listing={listing} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  ) : (
    <div className="relative h-[600px] bg-gray-100 rounded-lg border overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Map className="h-10 w-10 text-gray-400 mb-2 mx-auto" />
          <h3 className="font-medium mb-1">Map View</h3>
          <p className="text-gray-500 text-sm">Interactive map would be displayed here</p>
        </div>
      </div>
    </div>
  )}
</div>

{/* Enhanced pagination with stats */}
{filteredListings.length > 0 && (
  <div className="flex flex-col md:flex-row justify-between items-center my-8">
    <p className="text-sm text-gray-500 mb-4 md:mb-0">
      Showing <span className="font-medium">{Math.min(1, filteredListings.length)}-{Math.min(12, filteredListings.length)}</span> of <span className="font-medium">{filteredListings.length}</span> properties
    </p>
    
    <nav className="inline-flex rounded-md shadow-sm">
      <Button variant="outline" size="sm" className="rounded-r-none">
        Previous
      </Button>
      <Button variant="outline" size="sm" className="rounded-none border-l-0 bg-[#f74f4f] text-white border-[#f74f4f]">
        1
      </Button>
      <Button variant="outline" size="sm" className="rounded-none border-l-0">
        2
      </Button>
      <Button variant="outline" size="sm" className="rounded-none border-l-0">
        3
      </Button>
      <Button variant="outline" size="sm" className="rounded-l-none border-l-0">
        Next
      </Button>
    </nav>
  </div>
)}
</div>

{/* Enhanced CTA Section */}
<div className="bg-[#2d3748] py-12 mt-auto">
  <div className="container mx-auto px-4">
    <div className="bg-gradient-to-r from-[#f74f4f] to-[#ff7a45] rounded-xl p-8 md:p-10 shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Looking for a specific RV park?</h2>
        <p className="text-white/90 mb-8 text-lg">
          Tell us what you're looking for and we'll help you find the perfect property. Join our buyers list for early access to new listings.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <Input
            placeholder="Email address"
            className="bg-white/90 border-0 focus:ring-2 focus:ring-white text-gray-800 placeholder-gray-500 h-12"
          />
          <Button className="bg-white text-[#f74f4f] hover:bg-gray-100 h-12 px-6">
            Join Buyer List
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>

<Footer />
</div>
</TooltipProvider>
);
};

export default Listings; 
                