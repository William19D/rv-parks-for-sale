import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ListingCard } from "@/components/listings/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { filterListings } from "@/lib/utils";
import { mockListings, FilterOptions, initialFilterOptions, states } from "@/data/mockListings";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, MapPin, Grid, Map, X, Filter, ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

// Componente para el espaciado del header
const HeaderSpacer = () => {
  const [height, setHeight] = useState(76); // Valor predeterminado para evitar saltos

  useEffect(() => {
    // Función para actualizar la altura basada en el elemento real
    const updateHeight = () => {
      const headerElement = document.getElementById('main-header');
      if (headerElement) {
        setHeight(headerElement.offsetHeight);
      }
    };

    // Actualizar al montar y cuando cambie el tamaño de ventana
    updateHeight();
    window.addEventListener('resize', updateHeight);

    // Observer para detectar cambios en el header (como al hacer scroll)
    const observer = new MutationObserver(updateHeight);
    const headerElement = document.getElementById('main-header');
    if (headerElement) {
      observer.observe(headerElement, { 
        attributes: true,
        childList: true,
        subtree: true
      });
    }

    return () => {
      window.removeEventListener('resize', updateHeight);
      observer.disconnect();
    };
  }, []);

  return <div style={{ height: `${height}px` }} />;
};

// Tipos personalizados para propiedades adicionales que necesitamos
type ExtendedFilterOptions = FilterOptions & {
  states?: string[];
  types?: string[];
  features?: string[];
};

const Listings = () => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(initialFilterOptions);
  const [extendedFilters, setExtendedFilters] = useState<{
    states: string[];
    types: string[];
    features: string[];
  }>({
    states: [],
    types: [],
    features: []
  });
  const [filteredListings, setFilteredListings] = useState(mockListings);
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Track number of active filters
  useEffect(() => {
    const active: string[] = [];
    if (filterOptions.priceMin > initialFilterOptions.priceMin) active.push("Price (Min)");
    if (filterOptions.priceMax < initialFilterOptions.priceMax) active.push("Price (Max)");
    if (extendedFilters.states.length > 0) active.push("States");
    if (extendedFilters.types.length > 0) active.push("Property Types");
    if (extendedFilters.features.length > 0) active.push("Features");
    if (search || filterOptions.search) active.push("Search");
    setActiveFilters(active);
  }, [filterOptions, extendedFilters, search]);

  // Apply filters with loading state
  useEffect(() => {
    const applyFilters = async () => {
      setIsLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the search in filterOptions
      const updatedFilterOptions = {
        ...filterOptions,
        search: search || filterOptions.search
      };
      
      let filtered = filterListings(mockListings, updatedFilterOptions);
      
      // Apply additional filters not in the original FilterOptions interface
      if (extendedFilters.states.length > 0) {
        filtered = filtered.filter(listing => 
          extendedFilters.states.includes(listing.location.state)
        );
      }
      
      // Apply property type filters (assuming you have a type field in your listings)
      // You may need to adjust this based on your actual data structure
      if (extendedFilters.types.length > 0) {
        filtered = filtered.filter(listing => {
          // Mock implementation - adjust for your actual data
          const listingType = listing.title.includes("RV") ? "RV Park" : 
                             listing.title.includes("Camp") ? "Campground" : "Resort";
          return extendedFilters.types.includes(listingType);
        });
      }
      
      // Apply features filters (assuming you can extract features from description)
      if (extendedFilters.features.length > 0) {
        filtered = filtered.filter(listing => {
          // Mock implementation - check if any features are mentioned in description
          return extendedFilters.features.some(feature => 
            listing.description.toLowerCase().includes(feature.toLowerCase())
          );
        });
      }
      
      // Apply sorting
      filtered = sortListings(filtered, sortBy);
      
      setFilteredListings(filtered);
      setIsLoading(false);
    };
    
    applyFilters();
  }, [filterOptions, extendedFilters, sortBy, search]);
  
  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilterOptions(prev => ({
      ...prev,
      ...newFilters
    }));
  };
  
  const handleExtendedFilterChange = (key: keyof typeof extendedFilters, value: string[]) => {
    setExtendedFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const clearFilters = () => {
    setFilterOptions(initialFilterOptions);
    setExtendedFilters({
      states: [],
      types: [],
      features: []
    });
    setSearch('');
  };
  
  const removeFilter = (filter: string) => {
    if (filter === "Price (Min)") {
      handleFilterChange({ priceMin: initialFilterOptions.priceMin });
    } else if (filter === "Price (Max)") {
      handleFilterChange({ priceMax: initialFilterOptions.priceMax });
    } else if (filter === "States") {
      handleExtendedFilterChange("states", []);
    } else if (filter === "Property Types") {
      handleExtendedFilterChange("types", []);
    } else if (filter === "Features") {
      handleExtendedFilterChange("features", []);
    } else if (filter === "Search") {
      setSearch('');
      handleFilterChange({ search: '' });
    }
  };
  
  const sortListings = (listings: typeof mockListings, sortType: string) => {
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
      default:
        return sorted;
    }
  };
  
  // Simulated states and property types data
  const availableStates = ["Alabama", "Alaska", "Arizona", "California", "Colorado", "Florida", "Georgia", "Texas", "Oregon"];
  const propertyTypes = ["RV Park", "Campground", "Mobile Home Park", "Resort"];
  const features = ["Waterfront", "Pool", "Laundry", "Clubhouse", "WiFi", "Pet Friendly"];
  
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header con ID para que HeaderSpacer pueda referenciarlo */}
      <Header id="main-header" />
      
      {/* HeaderSpacer para crear el espacio necesario */}
      <HeaderSpacer />
      
      {/* Hero Header */}
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
            
            {/* Search bar */}
            <div className="relative max-w-2xl">
              <div className="relative">
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by location, name, or features..."
                  className="pl-10 pr-4 py-6 rounded-lg bg-white/95 backdrop-blur-sm border-0 ring-2 ring-white/20 focus:ring-white text-gray-800 placeholder-gray-500 shadow-lg w-full"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters and Listings */}
      <div className="container mx-auto px-4 py-6">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-4 w-4 text-[#f74f4f]" />
              <h2 className="text-lg font-medium">
                Showing {filteredListings.length} properties
              </h2>
            </div>
            
            {/* Active filters */}
            <div className="flex flex-wrap gap-2 items-center">
              {activeFilters.length > 0 && (
                <span className="text-sm text-gray-500">Filters:</span>
              )}
              {activeFilters.map((filter) => (
                <Badge 
                  key={filter}
                  variant="outline" 
                  className="bg-[#f74f4f]/10 text-[#f74f4f] border-[#f74f4f]/20 flex items-center gap-1"
                >
                  {filter}
                  <button onClick={() => removeFilter(filter)} className="ml-1 hover:bg-[#f74f4f]/20 rounded-full p-0.5">
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
        
          <div className="flex items-center space-x-3 self-end md:self-auto">
            {/* Filter button for mobile */}
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
                  <div className="p-6 space-y-6">
                    <div className="space-y-2">
                      <h3 className="font-medium">Price Range</h3>
                      <div className="space-y-6 pt-2">
                        <div>
                          <div className="flex justify-between mb-2 text-sm">
                            <span>Min: ${filterOptions.priceMin.toLocaleString()}</span>
                            <span>Max: ${filterOptions.priceMax.toLocaleString()}</span>
                          </div>
                          <Slider
                            defaultValue={[filterOptions.priceMin, filterOptions.priceMax]}
                            min={100000}
                            max={10000000}
                            step={50000}
                            value={[filterOptions.priceMin, filterOptions.priceMax]}
                            onValueChange={(value) => {
                              handleFilterChange({
                                priceMin: value[0],
                                priceMax: value[1],
                              });
                            }}
                            className="[&>span:first-child]:bg-[#f74f4f]"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">States</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {availableStates.map((state) => (
                          <div key={state} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`state-${state}`} 
                              checked={extendedFilters.states.includes(state)}
                              onCheckedChange={(checked) => {
                                const newStates = checked 
                                  ? [...extendedFilters.states, state]
                                  : extendedFilters.states.filter(s => s !== state);
                                handleExtendedFilterChange("states", newStates);
                              }}
                              className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                            />
                            <label htmlFor={`state-${state}`} className="text-sm cursor-pointer">
                              {state}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Property Type</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {propertyTypes.map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`type-${type}`} 
                              checked={extendedFilters.types.includes(type)}
                              onCheckedChange={(checked) => {
                                const newTypes = checked 
                                  ? [...extendedFilters.types, type]
                                  : extendedFilters.types.filter(t => t !== type);
                                handleExtendedFilterChange("types", newTypes);
                              }}
                              className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                            />
                            <label htmlFor={`type-${type}`} className="text-sm cursor-pointer">
                              {type}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Features</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {features.map((feature) => (
                          <div key={feature} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`feature-${feature}`} 
                              checked={extendedFilters.features.includes(feature)}
                              onCheckedChange={(checked) => {
                                const newFeatures = checked 
                                  ? [...extendedFilters.features, feature]
                                  : extendedFilters.features.filter(f => f !== feature);
                                handleExtendedFilterChange("features", newFeatures);
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
            
            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-gray-300">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setSortBy("newest")} className={sortBy === "newest" ? "bg-[#f74f4f]/10 text-[#f74f4f]" : ""}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")} className={sortBy === "oldest" ? "bg-[#f74f4f]/10 text-[#f74f4f]" : ""}>
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("priceHigh")} className={sortBy === "priceHigh" ? "bg-[#f74f4f]/10 text-[#f74f4f]" : ""}>
                  Price (High to Low)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("priceLow")} className={sortBy === "priceLow" ? "bg-[#f74f4f]/10 text-[#f74f4f]" : ""}>
                  Price (Low to High)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("sizeLarge")} className={sortBy === "sizeLarge" ? "bg-[#f74f4f]/10 text-[#f74f4f]" : ""}>
                  Size (Large to Small)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("sizeSmall")} className={sortBy === "sizeSmall" ? "bg-[#f74f4f]/10 text-[#f74f4f]" : ""}>
                  Size (Small to Large)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* View toggle */}
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
        
        {/* Desktop filters */}
        <div className="hidden md:flex mb-6 bg-white rounded-lg shadow-sm border p-4 gap-4 flex-wrap">
          <div className="w-56">
            <p className="text-sm font-medium mb-1">Price Range</p>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1 text-xs text-gray-500">
                  <span>${filterOptions.priceMin.toLocaleString()}</span>
                  <span>${filterOptions.priceMax.toLocaleString()}</span>
                </div>
                <Slider
                  defaultValue={[filterOptions.priceMin, filterOptions.priceMax]}
                  min={100000}
                  max={10000000}
                  step={50000}
                  value={[filterOptions.priceMin, filterOptions.priceMax]}
                  onValueChange={(value) => {
                    handleFilterChange({
                      priceMin: value[0],
                      priceMax: value[1],
                    });
                  }}
                  className="[&>span:first-child]:bg-[#f74f4f]"
                />
              </div>
            </div>
          </div>
          
          <div className="w-40">
            <p className="text-sm font-medium mb-1">State</p>
            <Select
              value={extendedFilters.states.length ? extendedFilters.states.join(',') : undefined}
              onValueChange={(value) => {
                handleExtendedFilterChange(
                  "states", 
                  value ? value.split(',') : []
                );
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {availableStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-44">
            <p className="text-sm font-medium mb-1">Property Type</p>
            <Select
              value={extendedFilters.types.length ? extendedFilters.types.join(',') : undefined}
              onValueChange={(value) => {
                handleExtendedFilterChange(
                  "types", 
                  value ? value.split(',') : []
                );
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-44">
            <p className="text-sm font-medium mb-1">Features</p>
            <Select
              value={extendedFilters.features.length ? extendedFilters.features.join(',') : undefined}
              onValueChange={(value) => {
                handleExtendedFilterChange(
                  "features", 
                  value ? value.split(',') : []
                );
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Features" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {features.map((feature) => (
                    <SelectItem key={feature} value={feature}>{feature}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="text-[#f74f4f] border-[#f74f4f] hover:bg-[#f74f4f]/10"
            >
              Clear All
            </Button>
          </div>
        </div>
        
        {/* Results */}
        <div className="mb-10">
          {isLoading ? (
            <div className="py-10 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-[#f74f4f]/20 border-t-[#f74f4f] rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground">Searching for properties...</p>
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
        
        {/* Pagination (simplified) */}
        {filteredListings.length > 0 && (
          <div className="flex justify-center my-8">
            <nav className="inline-flex space-x-1">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" className="bg-[#f74f4f] text-white border-[#f74f4f]">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                3
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </nav>
          </div>
        )}
      </div>
      
      {/* Looking for specific CTA */}
      <div className="bg-[#2d3748] py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-[#f74f4f] to-[#ff7a45] rounded-xl p-8 shadow-lg">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Looking for a specific RV park?</h2>
              <p className="text-white/90 mb-6 text-lg">
                Tell us what you're looking for and we'll help you find the perfect property.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  placeholder="Email address"
                  className="bg-white/90 border-0 focus:ring-2 focus:ring-white text-gray-800 placeholder-gray-500"
                />
                <Button className="bg-white text-[#f74f4f] hover:bg-gray-100">
                  Join Buyer List
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Listings;