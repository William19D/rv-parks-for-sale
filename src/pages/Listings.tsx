
import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingFilters } from "@/components/listings/ListingFilters";
import { filterListings } from "@/lib/utils";
import { mockListings, FilterOptions, initialFilterOptions } from "@/data/mockListings";

const Listings = () => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(initialFilterOptions);
  const [filteredListings, setFilteredListings] = useState(mockListings);
  
  useEffect(() => {
    const filtered = filterListings(mockListings, filterOptions);
    setFilteredListings(filtered);
  }, [filterOptions]);
  
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilterOptions(newFilters);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Page Header */}
      <div className="bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">RV Parks For Sale</h1>
          <p className="text-muted-foreground">
            Browse our curated selection of RV parks and campgrounds for sale across the United States.
          </p>
        </div>
      </div>
      
      {/* Filters and Listings */}
      <div className="container mx-auto px-4 py-8">
        <ListingFilters 
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
        />
        
        {filteredListings.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-2">No listings found</h2>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search criteria to see more results.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-muted-foreground">
              Showing {filteredListings.length} properties
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        )}
      </div>
      
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default Listings;
