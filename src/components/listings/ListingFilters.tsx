import { useState, useEffect, useCallback } from "react";
import { FilterOptions, states } from "@/data/mockListings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  Map, 
  DollarSign, 
  Percent, 
  Calendar, 
  CheckCircle2, 
  Users, 
  Star, 
  Trash2,
  SlidersHorizontal,
  ListFilter
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

// Custom debounce function (instead of lodash.debounce)
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutRef = useState<NodeJS.Timeout | null>(null)[0];

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef) clearTimeout(timeoutRef);
      timeoutRef = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
}

// Extended filter options with more fields
interface ExtendedFilterOptions extends FilterOptions {
  propertyTypes: string[];
  features: string[];
  occupancyRateMin: number;
  revenueMin: number;
  revenueMax: number;
  listedWithinDays: number | null;
  statesSelected: string[];
  onlyFeatured: boolean;
  onlyWithImages: boolean;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

// Property type options
const propertyTypeOptions = [
  "RV Park",
  "Campground",
  "Mobile Home Park",
  "Resort",
  "Marina",
  "Mixed-Use"
];

// Feature options
const featureOptions = [
  "Waterfront",
  "Pool",
  "Laundry",
  "Clubhouse",
  "WiFi",
  "Store",
  "Pet Friendly",
  "Fishing Access",
  "Hiking Trails",
  "Full Hookups"
];

// Sort options
const sortOptions = [
  { value: "price-desc", label: "Price: High to Low" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "sites-desc", label: "Most Sites" },
  { value: "sites-asc", label: "Fewest Sites" },
  { value: "capRate-desc", label: "Highest Cap Rate" }
];

// Quick filters
const quickFilters = [
  { id: "featured", label: "Featured Listings", icon: Star },
  { id: "highCapRate", label: "High Cap Rate (8%+)", icon: Percent },
  { id: "newListings", label: "New This Week", icon: Calendar },
  { id: "largeSites", label: "Large Parks (100+ Sites)", icon: Users },
  { id: "waterfront", label: "Waterfront Properties", icon: Map }
];

// Initial extended filters
const initialExtendedFilters: ExtendedFilterOptions = {
  priceMin: 0,
  priceMax: 10000000,
  state: '',
  statesSelected: [],
  sitesMin: 0,
  sitesMax: 1000,
  capRateMin: 0,
  search: '',
  propertyTypes: [],
  features: [],
  occupancyRateMin: 0,
  revenueMin: 0,
  revenueMax: 10000000,
  listedWithinDays: null,
  onlyFeatured: false,
  onlyWithImages: false,
  sortBy: "newest",
  sortDirection: 'desc'
};

interface ListingFiltersProps {
  filterOptions: FilterOptions;
  onFilterChange: (newFilters: FilterOptions) => void;
  onSortChange?: (sort: { by: string, direction: 'asc' | 'desc' }) => void;
  totalListings?: number;
  filteredCount?: number; 
}

export const ListingFilters = ({ 
  filterOptions, 
  onFilterChange,
  onSortChange,
  totalListings = 0,
  filteredCount 
}: ListingFiltersProps) => {
  // Convert base filter options to extended options
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [localFilters, setLocalFilters] = useState<ExtendedFilterOptions>({
    ...initialExtendedFilters,
    ...filterOptions,
    statesSelected: filterOptions.state ? [filterOptions.state] : []
  });
  
  // Track active filters for showing filter tags
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [savedFilters, setSavedFilters] = useState<{name: string, filters: ExtendedFilterOptions}[]>([]);
  const [searchInputValue, setSearchInputValue] = useState(filterOptions.search || '');

  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    
    if (localFilters.search) count++;
    if (localFilters.priceMin > initialExtendedFilters.priceMin) count++;
    if (localFilters.priceMax < initialExtendedFilters.priceMax) count++;
    if (localFilters.statesSelected.length > 0) count++;
    if (localFilters.sitesMin > initialExtendedFilters.sitesMin) count++;
    if (localFilters.sitesMax < initialExtendedFilters.sitesMax) count++;
    if (localFilters.capRateMin > initialExtendedFilters.capRateMin) count++;
    if (localFilters.propertyTypes.length > 0) count++;
    if (localFilters.features.length > 0) count++;
    if (localFilters.occupancyRateMin > initialExtendedFilters.occupancyRateMin) count++;
    if (localFilters.revenueMin > initialExtendedFilters.revenueMin) count++;
    if (localFilters.revenueMax < initialExtendedFilters.revenueMax) count++;
    if (localFilters.listedWithinDays) count++;
    if (localFilters.onlyFeatured) count++;
    if (localFilters.onlyWithImages) count++;
    
    setActiveFilterCount(count);
  }, [localFilters]);

  // Search handling with debounce
  const applySearch = (searchTerm: string) => {
    setLocalFilters(prev => ({ ...prev, search: searchTerm }));
    onFilterChange({ ...filterOptions, search: searchTerm });
  };
  
  const debouncedSearch = useDebounce(applySearch, 400);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setSearchInputValue(searchTerm);
    debouncedSearch(searchTerm);
  };
  
  // Handle state selection (multi-select)
  const handleStateToggle = (state: string, checked: boolean) => {
    let newStates = [...localFilters.statesSelected];
    
    if (checked) {
      newStates.push(state);
    } else {
      newStates = newStates.filter(s => s !== state);
    }
    
    setLocalFilters(prev => ({
      ...prev,
      statesSelected: newStates,
      state: newStates.length === 1 ? newStates[0] : ''
    }));
  };
  
  // Handle property type toggling
  const handlePropertyTypeToggle = (type: string, checked: boolean) => {
    let newTypes = [...localFilters.propertyTypes];
    
    if (checked) {
      newTypes.push(type);
    } else {
      newTypes = newTypes.filter(t => t !== type);
    }
    
    setLocalFilters(prev => ({
      ...prev,
      propertyTypes: newTypes
    }));
  };
  
  // Handle features toggling
  const handleFeatureToggle = (feature: string, checked: boolean) => {
    let newFeatures = [...localFilters.features];
    
    if (checked) {
      newFeatures.push(feature);
    } else {
      newFeatures = newFeatures.filter(f => f !== feature);
    }
    
    setLocalFilters(prev => ({
      ...prev,
      features: newFeatures
    }));
  };
  
  // Price slider handler
  const handlePriceChange = (value: number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      priceMin: value[0],
      priceMax: value[1]
    }));
  };
  
  // Sites slider handler
  const handleSitesChange = (value: number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      sitesMin: value[0],
      sitesMax: value[1]
    }));
  };
  
  // Cap rate slider handler
  const handleCapRateChange = (value: number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      capRateMin: value[0]
    }));
  };
  
  // Revenue slider handler
  const handleRevenueChange = (value: number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      revenueMin: value[0],
      revenueMax: value[1]
    }));
  };
  
  // Occupancy rate slider handler
  const handleOccupancyChange = (value: number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      occupancyRateMin: value[0]
    }));
  };
  
  // Listed within days handler
  const handleListedWithinDaysChange = (days: number | null) => {
    setLocalFilters(prev => ({
      ...prev,
      listedWithinDays: days
    }));
  };
  
  // Toggle featured only
  const handleFeaturedToggle = (checked: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      onlyFeatured: checked
    }));
  };
  
  // Toggle with images only
  const handleWithImagesToggle = (checked: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      onlyWithImages: checked
    }));
  };
  
  // Handle sort change
  const handleSortChange = (value: string) => {
    const [sortBy, direction] = value.split('-');
    setLocalFilters(prev => ({
      ...prev,
      sortBy,
      sortDirection: (direction as 'asc' | 'desc') || 'desc'
    }));
    
    if (onSortChange) {
      onSortChange({
        by: sortBy,
        direction: (direction as 'asc' | 'desc') || 'desc'
      });
    }
  };
  
  // Apply all filters
  const applyFilters = () => {
    const baseFilters: FilterOptions = {
      priceMin: localFilters.priceMin,
      priceMax: localFilters.priceMax,
      state: localFilters.statesSelected.length === 1 ? localFilters.statesSelected[0] : '',
      sitesMin: localFilters.sitesMin,
      sitesMax: localFilters.sitesMax,
      capRateMin: localFilters.capRateMin,
      search: localFilters.search,
    };
    
    onFilterChange(baseFilters);
    setIsOpen(false);
    setIsMobileFiltersOpen(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    setLocalFilters(initialExtendedFilters);
    setSearchInputValue('');
    onFilterChange({
      priceMin: initialExtendedFilters.priceMin,
      priceMax: initialExtendedFilters.priceMax,
      state: '',
      sitesMin: initialExtendedFilters.sitesMin,
      sitesMax: initialExtendedFilters.sitesMax,
      capRateMin: initialExtendedFilters.capRateMin,
      search: '',
    });
  };
  
  // Save current filter configuration
  const saveCurrentFilters = () => {
    const filterName = `Filter ${savedFilters.length + 1}`;
    setSavedFilters([
      ...savedFilters,
      { name: filterName, filters: {...localFilters} }
    ]);
  };
  
  // Apply a saved filter
  const applySavedFilter = (filters: ExtendedFilterOptions) => {
    setLocalFilters(filters);
    setSearchInputValue(filters.search || '');
    
    const baseFilters: FilterOptions = {
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      state: filters.statesSelected.length === 1 ? filters.statesSelected[0] : '',
      sitesMin: filters.sitesMin,
      sitesMax: filters.sitesMax,
      capRateMin: filters.capRateMin,
      search: filters.search,
    };
    
    onFilterChange(baseFilters);
  };
  
  // Apply quick filter
  const applyQuickFilter = (filterId: string) => {
    let updatedFilters = { ...localFilters };
    
    switch (filterId) {
      case "featured":
        updatedFilters.onlyFeatured = true;
        break;
      case "highCapRate":
        updatedFilters.capRateMin = 8;
        break;
      case "newListings":
        updatedFilters.listedWithinDays = 7;
        break;
      case "largeSites":
        updatedFilters.sitesMin = 100;
        break;
      case "waterfront":
        updatedFilters.features = [...updatedFilters.features, "Waterfront"];
        break;
    }
    
    setLocalFilters(updatedFilters);
    
    // Apply only the standard FilterOptions
    const baseFilters: FilterOptions = {
      priceMin: updatedFilters.priceMin,
      priceMax: updatedFilters.priceMax,
      state: updatedFilters.statesSelected.length === 1 ? updatedFilters.statesSelected[0] : '',
      sitesMin: updatedFilters.sitesMin,
      sitesMax: updatedFilters.sitesMax,
      capRateMin: updatedFilters.capRateMin,
      search: updatedFilters.search,
    };
    
    onFilterChange(baseFilters);
  };
  
  // Remove an active filter
  const removeFilter = (filterType: string) => {
    let updatedFilters = { ...localFilters };
    
    switch (filterType) {
      case "search":
        updatedFilters.search = '';
        setSearchInputValue('');
        break;
      case "price":
        updatedFilters.priceMin = initialExtendedFilters.priceMin;
        updatedFilters.priceMax = initialExtendedFilters.priceMax;
        break;
      case "states":
        updatedFilters.statesSelected = [];
        updatedFilters.state = '';
        break;
      case "sites":
        updatedFilters.sitesMin = initialExtendedFilters.sitesMin;
        updatedFilters.sitesMax = initialExtendedFilters.sitesMax;
        break;
      case "capRate":
        updatedFilters.capRateMin = initialExtendedFilters.capRateMin;
        break;
      case "propertyTypes":
        updatedFilters.propertyTypes = [];
        break;
      case "features":
        updatedFilters.features = [];
        break;
      case "occupancy":
        updatedFilters.occupancyRateMin = initialExtendedFilters.occupancyRateMin;
        break;
      case "revenue":
        updatedFilters.revenueMin = initialExtendedFilters.revenueMin;
        updatedFilters.revenueMax = initialExtendedFilters.revenueMax;
        break;
      case "listed":
        updatedFilters.listedWithinDays = null;
        break;
      case "featured":
        updatedFilters.onlyFeatured = false;
        break;
      case "withImages":
        updatedFilters.onlyWithImages = false;
        break;
      default:
        break;
    }
    
    setLocalFilters(updatedFilters);
    
    // Apply only the standard FilterOptions
    const baseFilters: FilterOptions = {
      priceMin: updatedFilters.priceMin,
      priceMax: updatedFilters.priceMax,
      state: updatedFilters.statesSelected.length === 1 ? updatedFilters.statesSelected[0] : '',
      sitesMin: updatedFilters.sitesMin,
      sitesMax: updatedFilters.sitesMax,
      capRateMin: updatedFilters.capRateMin,
      search: updatedFilters.search,
    };
    
    onFilterChange(baseFilters);
  };
  
  // Build filter tags based on active filters
  const renderFilterTags = () => {
    const tags = [];
    
    if (localFilters.search) {
      tags.push(
        <Badge 
          key="search" 
          variant="outline" 
          className="bg-[#f74f4f]/10 text-[#f74f4f] border-[#f74f4f]/30"
        >
          Search: {localFilters.search}
          <X 
            className="ml-1 h-3 w-3 cursor-pointer hover:text-[#f74f4f]/80" 
            onClick={() => removeFilter("search")}
          />
        </Badge>
      );
    }
    
    if (localFilters.priceMin > initialExtendedFilters.priceMin || 
        localFilters.priceMax < initialExtendedFilters.priceMax) {
      tags.push(
        <Badge 
          key="price" 
          variant="outline"
          className="bg-[#f74f4f]/10 text-[#f74f4f] border-[#f74f4f]/30"
        >
          Price: {formatCurrency(localFilters.priceMin)} - {formatCurrency(localFilters.priceMax)}
          <X 
            className="ml-1 h-3 w-3 cursor-pointer hover:text-[#f74f4f]/80" 
            onClick={() => removeFilter("price")}
          />
        </Badge>
      );
    }
    
    if (localFilters.statesSelected.length > 0) {
      const stateDisplay = localFilters.statesSelected.length > 1 
        ? `${localFilters.statesSelected.length} States` 
        : localFilters.statesSelected[0];
      
      tags.push(
        <Badge 
          key="states" 
          variant="outline"
          className="bg-[#f74f4f]/10 text-[#f74f4f] border-[#f74f4f]/30"
        >
          State: {stateDisplay}
          <X 
            className="ml-1 h-3 w-3 cursor-pointer hover:text-[#f74f4f]/80" 
            onClick={() => removeFilter("states")}
          />
        </Badge>
      );
    }
    
    if (localFilters.sitesMin > initialExtendedFilters.sitesMin || 
        localFilters.sitesMax < initialExtendedFilters.sitesMax) {
      tags.push(
        <Badge 
          key="sites" 
          variant="outline"
          className="bg-[#f74f4f]/10 text-[#f74f4f] border-[#f74f4f]/30"
        >
          Sites: {localFilters.sitesMin} - {localFilters.sitesMax}
          <X 
            className="ml-1 h-3 w-3 cursor-pointer hover:text-[#f74f4f]/80" 
            onClick={() => removeFilter("sites")}
          />
        </Badge>
      );
    }
    
    if (localFilters.capRateMin > initialExtendedFilters.capRateMin) {
      tags.push(
        <Badge 
          key="capRate" 
          variant="outline"
          className="bg-[#f74f4f]/10 text-[#f74f4f] border-[#f74f4f]/30"
        >
          Cap Rate: ≥{localFilters.capRateMin}%
          <X 
            className="ml-1 h-3 w-3 cursor-pointer hover:text-[#f74f4f]/80" 
            onClick={() => removeFilter("capRate")}
          />
        </Badge>
      );
    }
    
    if (localFilters.propertyTypes.length > 0) {
      const typeDisplay = localFilters.propertyTypes.length > 1 
        ? `${localFilters.propertyTypes.length} Types` 
        : localFilters.propertyTypes[0];
        
      tags.push(
        <Badge 
          key="propertyTypes" 
          variant="outline"
          className="bg-[#f74f4f]/10 text-[#f74f4f] border-[#f74f4f]/30"
        >
          Type: {typeDisplay}
          <X 
            className="ml-1 h-3 w-3 cursor-pointer hover:text-[#f74f4f]/80" 
            onClick={() => removeFilter("propertyTypes")}
          />
        </Badge>
      );
    }
    
    if (localFilters.features.length > 0) {
      const featureDisplay = localFilters.features.length > 1 
        ? `${localFilters.features.length} Features` 
        : localFilters.features[0];
        
      tags.push(
        <Badge 
          key="features" 
          variant="outline"
          className="bg-[#f74f4f]/10 text-[#f74f4f] border-[#f74f4f]/30"
        >
          Features: {featureDisplay}
          <X 
            className="ml-1 h-3 w-3 cursor-pointer hover:text-[#f74f4f]/80" 
            onClick={() => removeFilter("features")}
          />
        </Badge>
      );
    }
    
    if (localFilters.occupancyRateMin > initialExtendedFilters.occupancyRateMin) {
      tags.push(
        <Badge 
          key="occupancy" 
          variant="outline"
          className="bg-[#f74f4f]/10 text-[#f74f4f] border-[#f74f4f]/30"
        >
          Occupancy: ≥{localFilters.occupancyRateMin}%
          <X 
            className="ml-1 h-3 w-3 cursor-pointer hover:text-[#f74f4f]/80" 
            onClick={() => removeFilter("occupancy")}
          />
        </Badge>
      );
    }
    
    if (localFilters.revenueMin > initialExtendedFilters.revenueMin || 
        localFilters.revenueMax < initialExtendedFilters.revenueMax) {
      tags.push(
        <Badge 
          key="revenue" 
          variant="outline"
          className="bg-[#f74f4f]/10 text-[#f74f4f] border-[#f74f4f]/30"
        >
          Revenue: {formatCurrency(localFilters.revenueMin)} - {formatCurrency(localFilters.revenueMax)}
          <X 
            className="ml-1 h-3 w-3 cursor-pointer hover:text-[#f74f4f]/80" 
            onClick={() => removeFilter("revenue")}
          />
        </Badge>
      );
    }
    
    if (localFilters.listedWithinDays) {
      tags.push(
        <Badge 
          key="listed" 
          variant="outline"
          className="bg-[#f74f4f]/10 text-[#f74f4f] border-[#f74f4f]/30"
        >
          Listed: Last {localFilters.listedWithinDays} days
          <X 
            className="ml-1 h-3 w-3 cursor-pointer hover:text-[#f74f4f]/80" 
            onClick={() => removeFilter("listed")}
          />
        </Badge>
      );
    }
    
    if (localFilters.onlyFeatured) {
      tags.push(
        <Badge 
          key="featured" 
          variant="outline"
          className="bg-[#f74f4f]/10 text-[#f74f4f] border-[#f74f4f]/30"
        >
          Featured Only
          <X 
            className="ml-1 h-3 w-3 cursor-pointer hover:text-[#f74f4f]/80" 
            onClick={() => removeFilter("featured")}
          />
        </Badge>
      );
    }
    
    if (localFilters.onlyWithImages) {
      tags.push(
        <Badge 
          key="withImages" 
          variant="outline"
          className="bg-[#f74f4f]/10 text-[#f74f4f] border-[#f74f4f]/30"
        >
          With Images Only
          <X 
            className="ml-1 h-3 w-3 cursor-pointer hover:text-[#f74f4f]/80" 
            onClick={() => removeFilter("withImages")}
          />
        </Badge>
      );
    }
    
    return tags;
  };
  
  // Mobile view filter drawer content
  const renderMobileFilterContent = () => (
    <>
      <SheetHeader className="px-6 py-4 border-b">
        <SheetTitle className="text-xl">Filter Properties</SheetTitle>
        <SheetDescription>
          Customize your search results
        </SheetDescription>
      </SheetHeader>
      
      <ScrollArea className="h-[calc(100vh-14rem)] py-2">
        <div className="px-6 py-2 space-y-6">
          {/* Tabs for filter categories */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All Filters</TabsTrigger>
              <TabsTrigger value="property" className="text-xs sm:text-sm">Property</TabsTrigger>
              <TabsTrigger value="business" className="text-xs sm:text-sm">Business</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-6">
              {/* Price Range */}
              <div className="space-y-3">
                <Label className="font-medium text-lg">Price Range</Label>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{formatCurrency(localFilters.priceMin)}</span>
                  <span className="font-medium">{formatCurrency(localFilters.priceMax)}</span>
                </div>
                <Slider 
                  min={0} 
                  max={10000000} 
                  step={100000}
                  value={[localFilters.priceMin, localFilters.priceMax]} 
                  onValueChange={handlePriceChange}
                  className="my-6 [&>span]:bg-[#f74f4f]"
                />
              </div>
              
              <Separator />
              
              {/* Property Types */}
              <div className="space-y-3">
                <Label className="font-medium text-lg">Property Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {propertyTypeOptions.map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`mobile-type-${type}`} 
                        checked={localFilters.propertyTypes.includes(type)}
                        onCheckedChange={checked => handlePropertyTypeToggle(type, checked === true)}
                        className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                      />
                      <Label htmlFor={`mobile-type-${type}`} className="text-sm cursor-pointer">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* States */}
              <div className="space-y-3">
                <Label className="font-medium text-lg">States</Label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {states.map(state => (
                    <div key={state} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`mobile-state-${state}`} 
                        checked={localFilters.statesSelected.includes(state)}
                        onCheckedChange={checked => handleStateToggle(state, checked === true)}
                        className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                      />
                      <Label htmlFor={`mobile-state-${state}`} className="text-sm cursor-pointer">
                        {state}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Number of Sites */}
              <div className="space-y-3">
                <Label className="font-medium text-lg">Number of Sites</Label>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{localFilters.sitesMin} sites</span>
                  <span className="font-medium">{localFilters.sitesMax} sites</span>
                </div>
                <Slider 
                  min={0} 
                  max={1000} 
                  step={10}
                  value={[localFilters.sitesMin, localFilters.sitesMax]} 
                  onValueChange={handleSitesChange}
                  className="my-6 [&>span]:bg-[#f74f4f]"
                />
              </div>
              
              <Separator />
              
              {/* Features */}
              <div className="space-y-3">
                <Label className="font-medium text-lg">Features & Amenities</Label>
                <div className="grid grid-cols-2 gap-2">
                  {featureOptions.map(feature => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`mobile-feature-${feature}`} 
                        checked={localFilters.features.includes(feature)}
                        onCheckedChange={checked => handleFeatureToggle(feature, checked === true)}
                        className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                      />
                      <Label htmlFor={`mobile-feature-${feature}`} className="text-sm cursor-pointer">
                        {feature}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Cap Rate */}
              <div className="space-y-3">
                <Label className="font-medium text-lg">Minimum Cap Rate</Label>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{localFilters.capRateMin}%</span>
                  <span className="font-medium">15%+</span>
                </div>
                <Slider 
                  min={0} 
                  max={15} 
                  step={0.5}
                  value={[localFilters.capRateMin]} 
                  onValueChange={handleCapRateChange}
                  className="my-6 [&>span]:bg-[#f74f4f]"
                />
              </div>
              
              <Separator />
              
              {/* Listing Age */}
              <div className="space-y-3">
                <Label className="font-medium text-lg">Listing Age</Label>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="mobile-listed-7" 
                      checked={localFilters.listedWithinDays === 7}
                      onCheckedChange={checked => handleListedWithinDaysChange(checked ? 7 : null)}
                      className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                    />
                    <Label htmlFor="mobile-listed-7" className="text-sm cursor-pointer">
                      Listed in the last 7 days
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="mobile-listed-30" 
                      checked={localFilters.listedWithinDays === 30}
                      onCheckedChange={checked => handleListedWithinDaysChange(checked ? 30 : null)}
                      className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                    />
                    <Label htmlFor="mobile-listed-30" className="text-sm cursor-pointer">
                      Listed in the last 30 days
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="mobile-listed-90" 
                      checked={localFilters.listedWithinDays === 90}
                      onCheckedChange={checked => handleListedWithinDaysChange(checked ? 90 : null)}
                      className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                    />
                    <Label htmlFor="mobile-listed-90" className="text-sm cursor-pointer">
                      Listed in the last 90 days
                    </Label>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Additional Options */}
              <div className="space-y-4">
                <Label className="font-medium text-lg">Additional Options</Label>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mobile-featured" className="cursor-pointer">
                    Featured listings only
                  </Label>
                  <Switch 
                    id="mobile-featured"
                    checked={localFilters.onlyFeatured}
                    onCheckedChange={handleFeaturedToggle}
                    className="data-[state=checked]:bg-[#f74f4f]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mobile-with-images" className="cursor-pointer">
                    Properties with images only
                  </Label>
                  <Switch 
                    id="mobile-with-images"
                    checked={localFilters.onlyWithImages}
                    onCheckedChange={handleWithImagesToggle}
                    className="data-[state=checked]:bg-[#f74f4f]"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="property" className="space-y-6">
              {/* Property Types */}
              <div className="space-y-3">
                <Label className="font-medium text-lg">Property Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {propertyTypeOptions.map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`mobile-prop-type-${type}`} 
                        checked={localFilters.propertyTypes.includes(type)}
                        onCheckedChange={checked => handlePropertyTypeToggle(type, checked === true)}
                        className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                      />
                      <Label htmlFor={`mobile-prop-type-${type}`} className="text-sm cursor-pointer">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* States */}
              <div className="space-y-3">
                <Label className="font-medium text-lg">States</Label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {states.map(state => (
                    <div key={state} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`mobile-prop-state-${state}`} 
                        checked={localFilters.statesSelected.includes(state)}
                        onCheckedChange={checked => handleStateToggle(state, checked === true)}
                        className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                      />
                      <Label htmlFor={`mobile-prop-state-${state}`} className="text-sm cursor-pointer">
                        {state}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Number of Sites */}
              <div className="space-y-3">
                <Label className="font-medium text-lg">Number of Sites</Label>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{localFilters.sitesMin} sites</span>
                  <span className="font-medium">{localFilters.sitesMax} sites</span>
                </div>
                <Slider 
                  min={0} 
                  max={1000} 
                  step={10}
                  value={[localFilters.sitesMin, localFilters.sitesMax]} 
                  onValueChange={handleSitesChange}
                  className="my-6 [&>span]:bg-[#f74f4f]"
                />
              </div>
              
              <Separator />
              
              {/* Features */}
              <div className="space-y-3">
                <Label className="font-medium text-lg">Features & Amenities</Label>
                <div className="grid grid-cols-2 gap-2">
                  {featureOptions.map(feature => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`mobile-prop-feature-${feature}`} 
                        checked={localFilters.features.includes(feature)}
                        onCheckedChange={checked => handleFeatureToggle(feature, checked === true)}
                        className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                      />
                      <Label htmlFor={`mobile-prop-feature-${feature}`} className="text-sm cursor-pointer">
                        {feature}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="business" className="space-y-6">
              {/* Price Range */}
              <div className="space-y-3">
                <Label className="font-medium text-lg">Price Range</Label>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{formatCurrency(localFilters.priceMin)}</span>
                  <span className="font-medium">{formatCurrency(localFilters.priceMax)}</span>
                </div>
                <Slider 
                  min={0} 
                  max={10000000} 
                  step={100000}
                  value={[localFilters.priceMin, localFilters.priceMax]} 
                  onValueChange={handlePriceChange}
                  className="my-6 [&>span]:bg-[#f74f4f]"
                />
              </div>
              
              <Separator />
              
              {/* Cap Rate */}
              <div className="space-y-3">
                <Label className="font-medium text-lg">Minimum Cap Rate</Label>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{localFilters.capRateMin}%</span>
                  <span className="font-medium">15%+</span>
                </div>
                <Slider 
                  min={0} 
                  max={15} 
                  step={0.5}
                  value={[localFilters.capRateMin]} 
                  onValueChange={handleCapRateChange}
                  className="my-6 [&>span]:bg-[#f74f4f]"
                />
              </div>
              
              <Separator />
              
              {/* Occupancy Rate */}
              <div className="space-y-3">
                <Label className="font-medium text-lg">Minimum Occupancy Rate</Label>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{localFilters.occupancyRateMin}%</span>
                  <span className="font-medium">100%</span>
                </div>
                <Slider 
                  min={0} 
                  max={100} 
                  step={5}
                  value={[localFilters.occupancyRateMin]} 
                  onValueChange={handleOccupancyChange}
                  className="my-6 [&>span]:bg-[#f74f4f]"
                />
              </div>
              
              <Separator />
              
              {/* Annual Revenue */}
              <div className="space-y-3">
                <Label className="font-medium text-lg">Annual Revenue</Label>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{formatCurrency(localFilters.revenueMin)}</span>
                  <span className="font-medium">{formatCurrency(localFilters.revenueMax)}</span>
                </div>
                <Slider 
                  min={0} 
                  max={10000000} 
                  step={100000}
                  value={[localFilters.revenueMin, localFilters.revenueMax]} 
                  onValueChange={handleRevenueChange}
                  className="my-6 [&>span]:bg-[#f74f4f]"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
      
      <SheetFooter className="px-6 py-4 border-t flex-row justify-between">
        <Button 
          variant="outline" 
          onClick={resetFilters}
          className="flex items-center gap-1"
        >
          <Trash2 className="h-4 w-4" />
          <span>Reset All</span>
        </Button>
        <SheetClose asChild>
          <Button 
            className="bg-[#f74f4f] hover:bg-[#e43c3c]"
            onClick={applyFilters}
          >
            Show Results ({filteredCount !== undefined ? filteredCount : totalListings})
          </Button>
        </SheetClose>
      </SheetFooter>
    </>
  );

  return (
    <div className="space-y-4">
      {/* Main search and filter bar */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4 lg:items-center">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, location or description..."
              value={searchInputValue}
              onChange={handleSearchChange}
              className="pl-9 w-full border-gray-300 focus-within:border-[#f74f4f] focus-within:ring-[#f74f4f]"
            />
          </div>
          
          {/* Filter types dropdown - Desktop */}
          <div className="hidden lg:flex lg:items-center lg:space-x-3">
            {/* Desktop popover filters */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 border-gray-300">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>All Filters</span>
                  {activeFilterCount > 0 && (
                    <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-[#f74f4f] text-white">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[850px] p-6" align="start">
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12">
                    <h3 className="text-xl font-semibold">Filter Properties</h3>
                    <p className="text-sm text-gray-500 mt-1">Narrow down your search with specific criteria</p>
                  </div>
                  
                  {/* Desktop filter grid layout */}
                  <div className="col-span-4 space-y-6">
                    {/* Price Range */}
                    <div className="space-y-3">
                      <Label className="font-medium">Price Range</Label>
                      <div className="flex justify-between text-sm">
                        <span>{formatCurrency(localFilters.priceMin)}</span>
                        <span>{formatCurrency(localFilters.priceMax)}</span>
                      </div>
                      <Slider 
                        min={0} 
                        max={10000000} 
                        step={100000}
                        value={[localFilters.priceMin, localFilters.priceMax]} 
                        onValueChange={handlePriceChange}
                        className="[&>span]:bg-[#f74f4f]"
                      />
                    </div>
                    
                    {/* States - Multi-select */}
                    <div className="space-y-3">
                      <Label className="font-medium">States</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
                        {states.slice(0, 16).map(state => (
                          <div key={state} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`state-${state}`} 
                              checked={localFilters.statesSelected.includes(state)}
                              onCheckedChange={checked => handleStateToggle(state, checked === true)}
                              className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                            />
                            <Label htmlFor={`state-${state}`} className="text-sm cursor-pointer">
                              {state}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {states.length > 16 && (
                        <Button variant="link" size="sm" className="text-[#f74f4f] p-0 h-auto">
                          View all states
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-span-4 space-y-6">
                    {/* Property Types */}
                    <div className="space-y-3">
                      <Label className="font-medium">Property Type</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {propertyTypeOptions.map(type => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`type-${type}`} 
                              checked={localFilters.propertyTypes.includes(type)}
                              onCheckedChange={checked => handlePropertyTypeToggle(type, checked === true)}
                              className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                            />
                            <Label htmlFor={`type-${type}`} className="text-sm cursor-pointer">
                              {type}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Features */}
                    <div className="space-y-3">
                      <Label className="font-medium">Features & Amenities</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {featureOptions.slice(0, 8).map(feature => (
                          <div key={feature} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`feature-${feature}`} 
                              checked={localFilters.features.includes(feature)}
                              onCheckedChange={checked => handleFeatureToggle(feature, checked === true)}
                              className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                            />
                            <Label htmlFor={`feature-${feature}`} className="text-sm cursor-pointer">
                              {feature}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-4 space-y-6">
                    {/* Business metrics */}
                    <div className="space-y-3">
                      <Label className="font-medium">Minimum Cap Rate</Label>
                      <div className="flex justify-between text-sm">
                        <span>{localFilters.capRateMin}%</span>
                        <span>15%+</span>
                      </div>
                      <Slider 
                        min={0} 
                        max={15} 
                        step={0.5}
                        value={[localFilters.capRateMin]} 
                        onValueChange={handleCapRateChange}
                        className="[&>span]:bg-[#f74f4f]"
                      />
                    </div>
                    
                    {/* Number of Sites */}
                    <div className="space-y-3">
                      <Label className="font-medium">Number of Sites</Label>
                      <div className="flex justify-between text-sm">
                        <span>{localFilters.sitesMin} sites</span>
                        <span>{localFilters.sitesMax} sites</span>
                      </div>
                      <Slider 
                        min={0} 
                        max={1000} 
                        step={10}
                        value={[localFilters.sitesMin, localFilters.sitesMax]} 
                        onValueChange={handleSitesChange}
                        className="[&>span]:bg-[#f74f4f]"
                      />
                    </div>
                    
                    {/* Additional Options */}
                    <div className="space-y-3">
                      <Label className="font-medium">Additional Options</Label>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="featured-only" className="text-sm cursor-pointer">
                          Featured listings only
                        </Label>
                        <Switch 
                          id="featured-only"
                          checked={localFilters.onlyFeatured}
                          onCheckedChange={handleFeaturedToggle}
                          className="data-[state=checked]:bg-[#f74f4f]"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="images-only" className="text-sm cursor-pointer">
                          Properties with images only
                        </Label>
                        <Switch 
                          id="images-only"
                          checked={localFilters.onlyWithImages}
                          onCheckedChange={handleWithImagesToggle}
                          className="data-[state=checked]:bg-[#f74f4f]"
                        />
                      </div>
                    </div>
                    
                    {/* Listing Age */}
                    <div className="space-y-1">
                      <Label className="font-medium">Listing Age</Label>
                      <Select
                        value={localFilters.listedWithinDays?.toString() || ""}
                        onValueChange={(value) => handleListedWithinDaysChange(value ? parseInt(value) : null)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Any time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any time</SelectItem>
                          <SelectItem value="7">Last 7 days</SelectItem>
                          <SelectItem value="30">Last 30 days</SelectItem>
                          <SelectItem value="90">Last 90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="col-span-12 flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" onClick={resetFilters} className="flex items-center gap-1">
                        <Trash2 className="h-4 w-4" />
                        <span>Reset</span>
                      </Button>
                      
                      <Button variant="ghost" onClick={saveCurrentFilters} className="text-[#f74f4f]">
                        Save Filter
                      </Button>
                    </div>
                    
                    <Button className="bg-[#f74f4f] hover:bg-[#e43c3c]" onClick={applyFilters}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Sort dropdown */}
            <Select
              value={`${localFilters.sortBy}-${localFilters.sortDirection}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="min-w-[180px] border-gray-300">
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4" />
                  <SelectValue placeholder="Sort By" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Mobile view filter button */}
          <div className="flex items-center space-x-2 lg:hidden">
            {/* Sort button for mobile */}
            <Select
              value={`${localFilters.sortBy}-${localFilters.sortDirection}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="flex-1 border-gray-300">
                <div className="flex items-center justify-center gap-2">
                  <ListFilter className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only">Sort</span>
                </div>
              </SelectTrigger>
              <SelectContent align="end">
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Filter button for mobile */}
            <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex-1 flex justify-center items-center gap-2 border-gray-300">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only">Filters</span>
                  {activeFilterCount > 0 && (
                    <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-[#f74f4f] text-white">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md p-0" side="right">
                {renderMobileFilterContent()}
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* Quick filters - Desktop */}
        <div className="hidden lg:flex mt-4 space-x-2 overflow-x-auto pb-2">
          {quickFilters.map(filter => (
            <Button
              key={filter.id}
              variant="outline"
              size="sm"
              onClick={() => applyQuickFilter(filter.id)}
              className="flex items-center gap-1 whitespace-nowrap border-gray-200 hover:bg-[#f74f4f]/5 hover:text-[#f74f4f] hover:border-[#f74f4f]/30"
            >
              <filter.icon className="h-3.5 w-3.5" />
              <span>{filter.label}</span>
            </Button>
          ))}
          
          {/* Saved filters */}
          {savedFilters.length > 0 && (
            <>
              <div className="h-5 border-l border-gray-200 mx-1" />
              
              {savedFilters.map((savedFilter, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => applySavedFilter(savedFilter.filters)}
                  className="flex items-center gap-1 whitespace-nowrap bg-[#f74f4f]/5 text-[#f74f4f] border-[#f74f4f]/30"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{savedFilter.name}</span>
                </Button>
              ))}
            </>
          )}
        </div>
      </div>
      
      {/* Active filters display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Active filters:</span>
          {renderFilterTags()}
          {activeFilterCount > 1 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters}
              className="text-[#f74f4f] hover:bg-[#f74f4f]/10 text-xs h-7"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
