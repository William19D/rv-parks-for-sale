import { mockListings } from "@/data/mockListings";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Edit, Eye, Trash, Plus, Building, ArrowUpDown, Search, MoreHorizontal, Filter } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Header, HeaderSpacer } from "@/components/layout/Header"; // Importamos Header y HeaderSpacer
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export const BrokerListings = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  
  // Filter listings to simulate those belonging to the current broker
  const brokerListings = mockListings.filter(listing => listing.broker.id === "b1");
  
  const getStatusColor = (status) => {
    switch(status) {
      case "Active":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Sold":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  const getRandomStatus = () => {
    const statuses = ["Active", "Pending", "Sold"];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };
  
  const handleDeleteClick = (id) => {
    toast({
      title: "Listing Deleted",
      description: "The listing has been deleted successfully.",
      variant: "default",
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Agregamos Header y HeaderSpacer para evitar que el contenido quede detrás del header */}
      <Header />
      <HeaderSpacer />
      
      <div className="space-y-8 p-6">
        {/* Dashboard Header */}
        <div className="bg-gradient-to-r from-[#f74f4f] to-[#ff7a45] rounded-xl p-6 shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Your Listings</h1>
              <p className="text-white/90 max-w-2xl">
                Manage your properties, track performance, and update information from your dashboard.
              </p>
            </div>
            <Button 
              className="bg-white text-[#f74f4f] hover:bg-gray-100 shadow-sm border-0 flex items-center gap-2"
              size="lg"
              asChild
            >
              <Link to="/listings/new">
                <Plus className="h-5 w-5" />
                Add New Listing
              </Link>
            </Button>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-sm">
              <div className="text-[#f74f4f] text-sm font-medium mb-1">Total Listings</div>
              <div className="text-3xl font-bold">{brokerListings.length}</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-sm">
              <div className="text-[#f74f4f] text-sm font-medium mb-1">Total Views</div>
              <div className="text-3xl font-bold">{brokerListings.reduce((sum, l) => sum + (Math.floor(Math.random() * 500) + 50), 0)}</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-sm">
              <div className="text-[#f74f4f] text-sm font-medium mb-1">Active Inquiries</div>
              <div className="text-3xl font-bold">{Math.floor(Math.random() * 30) + 5}</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-sm">
              <div className="text-[#f74f4f] text-sm font-medium mb-1">Avg. View Time</div>
              <div className="text-3xl font-bold">2:45</div>
            </div>
          </div>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search listings..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Filter className="h-4 w-4" /> Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>All Listings</DropdownMenuItem>
                  <DropdownMenuItem>Active Listings</DropdownMenuItem>
                  <DropdownMenuItem>Pending Listings</DropdownMenuItem>
                  <DropdownMenuItem>Sold Listings</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <ArrowUpDown className="h-4 w-4" /> Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Latest First</DropdownMenuItem>
                  <DropdownMenuItem>Oldest First</DropdownMenuItem>
                  <DropdownMenuItem>Price: High to Low</DropdownMenuItem>
                  <DropdownMenuItem>Price: Low to High</DropdownMenuItem>
                  <DropdownMenuItem>Most Viewed</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        {brokerListings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
            <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No listings yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Start adding your RV parks and campgrounds for sale to reach potential buyers and investors.
            </p>
            <Button 
              className="bg-[#f74f4f] hover:bg-[#e43c3c] text-white"
              size="lg"
              asChild
            >
              <Link to="/listings/new">
                <Plus className="h-5 w-5 mr-1" />
                Create Your First Listing
              </Link>
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-3 px-4 text-left font-medium text-gray-600 text-sm">Property</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 text-sm">Price</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 text-sm">Views</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 text-sm">Inquiries</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 text-sm">Status</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-600 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {brokerListings.map((listing, index) => {
                    const status = getRandomStatus();
                    const views = Math.floor(Math.random() * 500) + 50;
                    const inquiries = Math.floor(Math.random() * 20);
                    
                    return (
                      <tr 
                        key={listing.id} 
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-16 h-12 overflow-hidden rounded-md flex-shrink-0 border border-gray-200">
                              <img 
                                src={listing.images[0]} 
                                alt={listing.title} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">{listing.title}</div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <span>{listing.location.city}, {listing.location.state}</span>
                                {index % 3 === 0 && (
                                  <Badge className="ml-2 bg-[#f74f4f]/10 text-[#f74f4f] border-[#f74f4f]/20 text-xs" variant="outline">
                                    Featured
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-medium">
                          {formatCurrency(listing.price)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-1">
                            <span className="font-medium">{views}</span>
                            {views > 300 && (
                              <Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs">
                                +12%
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium">{inquiries}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className={`inline-block px-2.5 py-1 text-xs rounded-full border ${getStatusColor(status)}`}>
                            {status}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-end space-x-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                              asChild
                            >
                              <Link to={`/listings/${listing.id}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Link>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="hover:bg-[#f74f4f]/5 text-gray-600 hover:text-[#f74f4f]"
                              asChild
                            >
                              {/* Updated to use the correct path for ListingEdit component */}
                              <Link to={`/listings/${listing.id}/edit`}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Link>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="hover:bg-red-50 text-gray-600 hover:text-red-600"
                              onClick={() => handleDeleteClick(listing.id)}
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="hover:bg-gray-100 text-gray-600"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Analytics</DropdownMenuItem>
                                <DropdownMenuItem>Feature Listing</DropdownMenuItem>
                                <DropdownMenuItem>Generate Reports</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Mark as Sold</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="py-4 px-6 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing 1-{brokerListings.length} of {brokerListings.length} listings
              </div>
              <div className="flex space-x-1">
                <Button variant="outline" size="sm" className="text-xs">
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs bg-[#f74f4f] text-white border-[#f74f4f] hover:bg-[#e43c3c] hover:text-white"
                >
                  1
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};