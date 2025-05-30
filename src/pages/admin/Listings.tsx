import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus,
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MoreHorizontal,
  Edit,
  Eye,
  Trash,
  AlertCircle
} from 'lucide-react';

// Status type for listings
type ListingStatus = 'pending' | 'approved' | 'rejected' | 'all';

// Listing type
interface Listing {
  id: string;
  title: string;
  price: number;
  status: string;
  createdAt: string;
  location: {
    city: string;
    state: string;
  };
  broker: {
    name: string;
    email: string;
  };
}

const AdminListings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') as ListingStatus || 'all';
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<ListingStatus>(initialFilter);
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ListingStatus | null>(null);
  
  const { toast } = useToast();

  // Update URL when filter changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (activeTab !== 'all') {
      newParams.set('filter', activeTab);
    } else {
      newParams.delete('filter');
    }
    
    if (searchQuery) {
      newParams.set('search', searchQuery);
    } else {
      newParams.delete('search');
    }
    
    setSearchParams(newParams);
  }, [activeTab, searchQuery, setSearchParams]);

  // Fetch listings
  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      
      try {
        let query = supabase
          .from('listings')
          .select(`
            id,
            title,
            price,
            status,
            createdAt,
            city,
            state,
            user_id,
            users (
              email
            )
          `)
          .order('createdAt', { ascending: false });
        
        // Filter by status if not "all"
        if (activeTab !== 'all') {
          query = query.eq('status', activeTab);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        // Transform data to match our expected listing format
        if (data) {
          const formattedListings: Listing[] = data.map(item => {
            // Safely extract email from the users object
            let userEmail = 'No email';
            let userName = 'Unknown';
            
            if (item.users) {
              // Handle if users is an array
              if (Array.isArray(item.users)) {
                userEmail = item.users[0]?.email || 'No email';
                userName = userEmail.split('@')[0] || 'Unknown';
              } 
            }
            
            return {
              id: item.id,
              title: item.title,
              price: item.price,
              status: item.status,
              createdAt: item.createdAt,
              location: {
                city: item.city || '',
                state: item.state || ''
              },
              broker: {
                name: userName,
                email: userEmail
              }
            };
          });
          
          setListings(formattedListings);
          setFilteredListings(formattedListings);
        } else {
          setListings([]);
          setFilteredListings([]);
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
        toast({
          title: "Error",
          description: "Failed to load listings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchListings();
  }, [activeTab, toast]);

  // Filter listings based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredListings(listings);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = listings.filter(listing => 
      listing.title.toLowerCase().includes(query) ||
      listing.location.city?.toLowerCase().includes(query) ||
      listing.location.state?.toLowerCase().includes(query) ||
      listing.broker.name?.toLowerCase().includes(query) ||
      listing.broker.email?.toLowerCase().includes(query)
    );
    
    setFilteredListings(filtered);
  }, [searchQuery, listings]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as ListingStatus);
  };

  // Navigation handlers
  const handleViewListing = (id: string) => {
    navigate(`/listings/${id}`);
  };

  const handleEditListing = (id: string) => {
    navigate(`/admin/listings/${id}/edit`);
  };

  // Open status change dialog
  const openStatusDialog = (listing: Listing, status: ListingStatus) => {
    setSelectedListing(listing);
    setNewStatus(status);
    setIsStatusDialogOpen(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (listing: Listing) => {
    setSelectedListing(listing);
    setIsDeleteDialogOpen(true);
  };

  // Update listing status
  const updateListingStatus = async () => {
    if (!selectedListing || !newStatus) return;
    
    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', selectedListing.id);
      
      if (error) throw error;
      
      // Update local state
      const updatedListings = listings.map(listing => 
        listing.id === selectedListing.id 
          ? { ...listing, status: newStatus } 
          : listing
      );
      
      setListings(updatedListings);
      
      // Apply current filters
      if (activeTab !== 'all' && newStatus !== activeTab) {
        // If we're on a filtered tab and the new status doesn't match, remove this listing from view
        setFilteredListings(prevFiltered => 
          prevFiltered.filter(listing => listing.id !== selectedListing.id)
        );
      } else {
        setFilteredListings(updatedListings.filter(listing => 
          activeTab === 'all' || listing.status === activeTab
        ));
      }
      
      toast({
        title: "Status Updated",
        description: `Listing has been ${newStatus === 'approved' ? 'approved' : 
                                        newStatus === 'rejected' ? 'rejected' : 
                                        'marked as pending'}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update listing status",
        variant: "destructive",
      });
    } finally {
      setIsStatusDialogOpen(false);
    }
  };

  // Delete listing
  const deleteListing = async () => {
    if (!selectedListing) return;
    
    try {
      // First get any images associated with this listing to delete them from storage
      const { data: imageData } = await supabase
        .from('listing_images')
        .select('storage_path')
        .eq('listing_id', selectedListing.id);
        
      if (imageData && imageData.length > 0) {
        // Delete images from storage
        const pathsToDelete = imageData.map(img => img.storage_path);
        await supabase.storage
          .from('listing-images')
          .remove(pathsToDelete);
      }
      
      // Delete the listing itself
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', selectedListing.id);
      
      if (error) throw error;
      
      // Update local state
      const updatedListings = listings.filter(listing => listing.id !== selectedListing.id);
      setListings(updatedListings);
      setFilteredListings(updatedListings);
      
      toast({
        title: "Listing Deleted",
        description: "The listing has been permanently deleted",
      });
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast({
        title: "Error",
        description: "Failed to delete listing",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
      notation: value >= 1000000 ? 'compact' : 'standard'
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Get status badge component
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Listings Management</h1>
        <Button 
          onClick={() => navigate('/listings/new')}
          className="bg-[#f74f4f] hover:bg-[#e43c3c]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Listing
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Tabs and Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <Tabs 
            defaultValue={activeTab} 
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full md:w-auto"
          >
            <TabsList>
              <TabsTrigger value="all" className="text-sm">All Listings</TabsTrigger>
              <TabsTrigger value="pending" className="text-sm">
                Pending 
                <Badge className="ml-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                  {listings.filter(l => l.status === 'pending').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-sm">Approved</TabsTrigger>
              <TabsTrigger value="rejected" className="text-sm">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search listings..."
              className="pl-9 bg-gray-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Listings Table */}
        {isLoading ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#f74f4f]/20 border-t-[#f74f4f] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading listings...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <div className="mb-4 p-3 rounded-full bg-gray-100">
              <Filter className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium">No listings found</h3>
            <p className="text-gray-500 mt-1">
              {searchQuery ? 'Try adjusting your search.' : 'There are no listings in this category yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Listed On</TableHead>
                  <TableHead>Broker</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell className="font-medium">{listing.title}</TableCell>
                    <TableCell>{listing.location.city}, {listing.location.state}</TableCell>
                    <TableCell>{formatCurrency(listing.price)}</TableCell>
                    <TableCell>
                      {getStatusBadge(listing.status)}
                    </TableCell>
                    <TableCell>{formatDate(listing.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{listing.broker.name}</span>
                        <span className="text-xs text-gray-500">{listing.broker.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* Fixed: Use onClick instead of as={Button} */}
                          <DropdownMenuItem onClick={() => handleViewListing(listing.id)}>
                            <div className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" />
                              <span>View</span>
                            </div>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => handleEditListing(listing.id)}>
                            <div className="flex items-center">
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </div>
                          </DropdownMenuItem>
                          
                          {/* Status change options */}
                          {listing.status !== 'approved' && (
                            <DropdownMenuItem 
                              onClick={() => openStatusDialog(listing, 'approved')}
                            >
                              <div className="flex items-center">
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                <span>Approve</span>
                              </div>
                            </DropdownMenuItem>
                          )}
                          
                          {listing.status !== 'rejected' && (
                            <DropdownMenuItem 
                              onClick={() => openStatusDialog(listing, 'rejected')}
                            >
                              <div className="flex items-center">
                                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                <span>Reject</span>
                              </div>
                            </DropdownMenuItem>
                          )}
                          
                          {listing.status !== 'pending' && (
                            <DropdownMenuItem 
                              onClick={() => openStatusDialog(listing, 'pending')}
                            >
                              <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                                <span>Mark as Pending</span>
                              </div>
                            </DropdownMenuItem>
                          )}
                          
                          {/* Delete option */}
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(listing)}
                            className="text-red-600"
                          >
                            <div className="flex items-center">
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Status Change Dialog */}
      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Listing Status</AlertDialogTitle>
            <AlertDialogDescription>
              {newStatus === 'approved' && "This listing will be visible to all users after approval."}
              {newStatus === 'rejected' && "This listing will be hidden from public view."}
              {newStatus === 'pending' && "This listing will be marked as pending review."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={updateListingStatus}
              className={
                newStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' :
                newStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' :
                'bg-yellow-600 hover:bg-yellow-700'
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the listing
              "{selectedListing?.title}" and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteListing}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminListings;