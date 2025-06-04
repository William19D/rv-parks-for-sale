
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingFilters } from "@/components/listings/ListingFilters";
import { fetchApprovedListings, ListingFilters as FilterType, Listing } from "@/services/listingService";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Listings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterType>({});

  // Initialize filters from URL parameters
  useEffect(() => {
    const initialFilters: FilterType = {};
    
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const state = searchParams.get('state');
    const sitesMin = searchParams.get('sitesMin');
    const sitesMax = searchParams.get('sitesMax');
    const capRateMin = searchParams.get('capRateMin');
    const occupancyRateMin = searchParams.get('occupancyRateMin');
    const search = searchParams.get('search');

    if (priceMin) initialFilters.priceMin = parseInt(priceMin);
    if (priceMax) initialFilters.priceMax = parseInt(priceMax);
    if (state) initialFilters.state = state;
    if (sitesMin) initialFilters.sitesMin = parseInt(sitesMin);
    if (sitesMax) initialFilters.sitesMax = parseInt(sitesMax);
    if (capRateMin) initialFilters.capRateMin = parseFloat(capRateMin);
    if (occupancyRateMin) initialFilters.occupancyRateMin = parseFloat(occupancyRateMin);
    if (search) initialFilters.search = search;

    setFilters(initialFilters);
  }, [searchParams]);

  // Fetch approved listings whenever filters change
  useEffect(() => {
    const loadApprovedListings = async () => {
      setIsLoading(true);
      try {
        console.log('[Listings] Loading approved listings with filters:', filters);
        const approvedListings = await fetchApprovedListings(filters);
        console.log('[Listings] Loaded listings count:', approvedListings.length);
        setListings(approvedListings);
        setFilteredListings(approvedListings);
      } catch (error) {
        console.error('[Listings] Error loading listings:', error);
        setListings([]);
        setFilteredListings([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadApprovedListings();
  }, [filters]);

  // Handle filter changes - changed from onFiltersChange to onFilterChange
  const handleFilterChange = (newFilters: FilterType) => {
    console.log('[Listings] Filters changed:', newFilters);
    setFilters(newFilters);
    
    // Update URL parameters
    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        newSearchParams.set(key, value.toString());
      }
    });
    
    setSearchParams(newSearchParams);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#f74f4f] to-[#ff7a45] py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                RV Park Investment Opportunities
              </h1>
              <p className="text-xl text-white/90 mb-8">
                Discover premium RV parks and campgrounds for sale across the United States. 
                All listings are carefully vetted and ready for investment.
              </p>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
                <p className="text-lg">
                  <span className="font-semibold">{filteredListings.length}</span> approved properties available
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Filters and Listings */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters Sidebar */}
              <aside className="lg:w-80 flex-shrink-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4">
                  <ListingFilters onFilterChange={handleFilterChange} initialFilters={filters} />
                </div>
              </aside>

              {/* Listings Grid */}
              <div className="flex-1">
                {isLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-12 w-12 text-[#f74f4f] animate-spin mb-4" />
                      <p className="text-gray-500 text-lg">Loading approved listings...</p>
                    </div>
                  </div>
                ) : filteredListings.length > 0 ? (
                  <>
                    {/* Results header */}
                    <div className="mb-6 flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {filteredListings.length === 1 
                          ? "1 Property Found" 
                          : `${filteredListings.length} Properties Found`
                        }
                      </h2>
                      <p className="text-gray-600">
                        All listings are approved and ready for investment
                      </p>
                    </div>

                    {/* Listings grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredListings.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                    <div className="flex flex-col items-center">
                      <div className="bg-gray-100 rounded-full p-4 mb-4">
                        <MapPin className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">No Approved Properties Found</h3>
                      <p className="text-gray-500 max-w-lg mx-auto mb-6">
                        No approved properties match your current filters. Try adjusting your search criteria or browse all available listings.
                      </p>
                      <Button 
                        onClick={() => {
                          setFilters({});
                          setSearchParams(new URLSearchParams());
                        }}
                        className="bg-[#f74f4f] hover:bg-[#e43c3c]"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Listings;
