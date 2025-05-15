
import { useState } from "react";
import { FilterOptions, states } from "@/data/mockListings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency } from "@/lib/utils";

interface ListingFiltersProps {
  filterOptions: FilterOptions;
  onFilterChange: (newFilters: FilterOptions) => void;
}

export const ListingFilters = ({ filterOptions, onFilterChange }: ListingFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filterOptions);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    setLocalFilters(prev => ({ ...prev, search }));
    onFilterChange({ ...localFilters, search });
  };
  
  const handleStateChange = (state: string) => {
    setLocalFilters(prev => ({ ...prev, state }));
  };
  
  const handlePriceChange = (value: number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      priceMin: value[0],
      priceMax: value[1]
    }));
  };
  
  const handleSitesChange = (value: number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      sitesMin: value[0],
      sitesMax: value[1]
    }));
  };
  
  const handleCapRateChange = (value: number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      capRateMin: value[0]
    }));
  };
  
  const applyFilters = () => {
    onFilterChange(localFilters);
    setIsOpen(false);
  };
  
  const resetFilters = () => {
    const resetFilters = {
      priceMin: 0,
      priceMax: 10000000,
      state: '',
      sitesMin: 0,
      sitesMax: 1000,
      capRateMin: 0,
      search: localFilters.search
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
    setIsOpen(false);
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, location or description..."
            value={localFilters.search}
            onChange={handleSearchChange}
            className="pl-9 w-full"
          />
        </div>
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] md:w-[500px] p-5">
            <div className="space-y-5">
              <h3 className="font-medium text-lg">Filters</h3>
              
              <div className="space-y-3">
                <Label>Price Range</Label>
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
                />
              </div>
              
              <div className="space-y-3">
                <Label>Number of Sites</Label>
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
                />
              </div>
              
              <div className="space-y-3">
                <Label>Minimum Cap Rate</Label>
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
                />
              </div>
              
              <div className="space-y-2">
                <Label>State</Label>
                <Select 
                  value={localFilters.state} 
                  onValueChange={handleStateChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any State</SelectItem>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex space-x-2 pt-4 justify-end">
                <Button variant="outline" onClick={resetFilters}>Reset</Button>
                <Button onClick={applyFilters}>Apply Filters</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
