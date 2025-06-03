import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
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
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  ChevronDown, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MoreHorizontal,
  Edit,
  Eye,
  Trash,
  AlertCircle,
  DatabaseIcon,
  RefreshCw
} from 'lucide-react';

// Status type for listings
type ListingStatus = 'pending' | 'approved' | 'rejected' | 'all';

// Listing type
interface Listing {
  id: string;
  title: string;
  price: number;
  status: string;
  rejection_reason?: string;
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

const statusOptions = [
  { value: 'pending', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' }
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<ListingStatus>('all');
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Allow access without strict admin checks
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get session but don't block access if not authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log("User authenticated, setting ADMIN role in localStorage");
          // Force set ADMIN role in localStorage
          localStorage.setItem('userRole', 'ADMIN');
        } else {
          console.log("No session found, will proceed anyway");
          // Set a special flag to indicate we're allowing access without login
          localStorage.setItem('bypassAuth', 'true');
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // Allow access despite errors
      }
    };
    
    checkAuth();
  }, []);

  // Fetch listings function
  const fetchListings = async () => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    
    try {
      // Use a simpler query that is less likely to fail
      let query = supabase
        .from('listings')
        .select('*');
      
      // Add filtering after making sure the basic query works
      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timed out')), 15000)
      );
      
      // Race between the query and the timeout
      const { data, error } = await Promise.race([
        query,
        timeoutPromise
      ]) as any;
      
      if (error) throw error;
      
      console.log("Raw data from Supabase:", data);
      
      if (!data || data.length === 0) {
        console.log("No listings found");
        setListings([]);
        setFilteredListings([]);
        return;
      }
      
      // Map the data with more error handling
      const mappedData = data.map((item: any) => {
        try {
          return {
            id: item.id || 'unknown',
            title: item.title || 'Untitled Listing',
            price: typeof item.price === 'number' ? item.price : 0,
            status: item.status || 'pending',
            rejection_reason: item.rejection_reason,
            createdAt: item.created_at || new Date().toISOString(),
            location: {
              city: item.city || 'N/A',
              state: item.state || 'N/A'
            },
            broker: {
              name: 'Broker info not available', // We'll try to fetch this in a separate query
              email: 'N/A'
            }
          };
        } catch (itemError) {
          console.error("Error processing item:", itemError);
          return null;
        }
      }).filter(Boolean);
      
      console.log("Processed listings:", mappedData);
      
      setListings(mappedData);
      setFilteredListings(mappedData);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setHasError(true);
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : 'Failed to load listings. Please try again.'
      );
      setListings([]);
      setFilteredListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch listings when tab changes
  useEffect(() => {
    fetchListings();
  }, [activeTab]);

  // Filter listings based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredListings(listings);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = listings.filter(listing => 
      listing.title?.toLowerCase().includes(query) ||
      listing.location?.city?.toLowerCase().includes(query) ||
      listing.location?.state?.toLowerCase().includes(query) ||
      (listing.broker?.name && listing.broker.name.toLowerCase().includes(query))
    );
    
    setFilteredListings(filtered);
  }, [searchQuery, listings]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as ListingStatus);
  };

  // Open status change dialog
  const openStatusDialog = (listing: Listing, status: string) => {
    setSelectedListing(listing);
    setNewStatus(status);
    setRejectionReason(''); // Reset rejection reason
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
      // Create update object
      const updateData: { status: string; rejection_reason?: string | null } = {
        status: newStatus
      };
      
      // Add rejection reason if status is 'rejected'
      if (newStatus === 'rejected') {
        if (!rejectionReason.trim()) {
          toast({
            title: "Rejection Reason Required",
            description: "Please provide a reason for rejecting this listing.",
            variant: "destructive",
          });
          return;
        }
        updateData.rejection_reason = rejectionReason;
      } else {
        // Clear rejection reason for other statuses
        updateData.rejection_reason = null;
      }
      
      const { error } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', selectedListing.id);
      
      if (error) throw error;
      
      // Update local state
      const updatedListings = listings.map(listing => 
        listing.id === selectedListing.id 
          ? { 
              ...listing, 
              status: newStatus,
              rejection_reason: newStatus === 'rejected' ? rejectionReason : null
            } 
          : listing
      );
      
      setListings(updatedListings);
      setFilteredListings(
        activeTab === 'all' 
          ? updatedListings 
          : updatedListings.filter(listing => listing.status === activeTab)
      );
      
      toast({
        title: `Listing ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        description: newStatus === 'rejected' 
          ? `Listing has been rejected: ${rejectionReason}`
          : `The listing has been ${newStatus}`,
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
      setRejectionReason('');
    }
  };

  // Delete listing
  const deleteListing = async () => {
    if (!selectedListing) return;
    
    try {
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
    if (typeof value !== 'number') return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
      notation: value >= 1000000 ? 'compact' : 'standard'
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
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

  return (
    <div className="flex-1 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button 
          onClick={() => navigate('/listings/new')}
          className="bg-[#f74f4f] hover:bg-[#e43c3c]"
        >
          Add New Listing
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Tabs and Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <Tabs 
              defaultValue="all" 
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
                <TabsTrigger value="approved" className="text-sm">
                  Approved
                  <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                    {listings.filter(l => l.status === 'approved').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="rejected" className="text-sm">
                  Rejected
                  <Badge className="ml-2 bg-red-100 text-red-800 hover:bg-red-100">
                    {listings.filter(l => l.status === 'rejected').length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Refresh button */}
            <Button 
              variant="outline" 
              size="icon"
              onClick={fetchListings}
              disabled={isLoading}
              className="ml-2"
              title="Refresh listings"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
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
        ) : hasError ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <div className="mb-4 p-3 rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-red-800">Error Loading Listings</h3>
            <p className="text-gray-500 mt-1 max-w-md text-center">{errorMessage}</p>
            <Button 
              onClick={fetchListings}
              variant="outline" 
              className="mt-4"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <div className="mb-4 p-3 rounded-full bg-gray-100">
              <DatabaseIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium">No Listings Found</h3>
            <p className="text-gray-500 mt-1 max-w-md text-center">
              {searchQuery 
                ? 'Try adjusting your search or removing filters.' 
                : 'There are no listings in this category yet. Add your first listing to get started.'}
            </p>
            <div className="flex gap-4 mt-6">
              <Button 
                onClick={() => navigate('/listings/new')}
                className="bg-[#f74f4f] hover:bg-[#e43c3c]"
              >
                Add New Listing
              </Button>
              <Button 
                onClick={fetchListings}
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
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
                    <TableCell className="font-medium">{listing.title || 'Untitled'}</TableCell>
                    <TableCell>
                      {listing.location?.city || 'N/A'}, {listing.location?.state || ''}
                    </TableCell>
                    <TableCell>{formatCurrency(listing.price)}</TableCell>
                    <TableCell>
                      <StatusBadge 
                        status={listing.status || 'pending'} 
                        rejectionReason={listing.status === 'rejected' ? listing.rejection_reason : undefined}
                      />
                    </TableCell>
                    <TableCell>{formatDate(listing.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{listing.broker?.name || 'Unknown'}</span>
                        <span className="text-xs text-gray-500">{listing.broker?.email || 'N/A'}</span>
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
                          <DropdownMenuItem onClick={() => navigate(`/listings/${listing.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/listings/${listing.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          
                          {/* Status change options */}
                          {listing.status !== 'approved' && (
                            <DropdownMenuItem onClick={() => openStatusDialog(listing, 'approved')}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              <span>Approve</span>
                            </DropdownMenuItem>
                          )}
                          
                          {listing.status !== 'rejected' && (
                            <DropdownMenuItem onClick={() => openStatusDialog(listing, 'rejected')}>
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              <span>Reject</span>
                            </DropdownMenuItem>
                          )}
                          
                          {listing.status !== 'pending' && (
                            <DropdownMenuItem onClick={() => openStatusDialog(listing, 'pending')}>
                              <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                              <span>Mark as Pending</span>
                            </DropdownMenuItem>
                          )}
                          
                          {/* Delete option */}
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(listing)}
                            className="text-red-600"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            <span>Delete</span>
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

      {/* Status Change Dialog - Updated to include rejection reason */}
      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {newStatus === 'approved' && "Approve Listing"}
              {newStatus === 'rejected' && "Reject Listing"}
              {newStatus === 'pending' && "Mark as Pending Review"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {newStatus === 'approved' && "This listing will be visible to all users after approval."}
              {newStatus === 'rejected' && "This listing will be hidden from public view and the owner will be notified."}
              {newStatus === 'pending' && "This listing will return to pending review status."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Rejection reason textarea - only shown when rejecting */}
          {newStatus === 'rejected' && (
            <div className="my-4">
              <label htmlFor="rejectionReason" className="block text-sm font-medium mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="rejectionReason"
                placeholder="Please provide a reason for rejection"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full"
                required
              />
              {rejectionReason === '' && (
                <p className="text-xs text-red-500 mt-1">
                  A rejection reason is required
                </p>
              )}
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={updateListingStatus}
              className={
                newStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' :
                newStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' :
                'bg-yellow-600 hover:bg-yellow-700'
              }
              disabled={newStatus === 'rejected' && !rejectionReason.trim()}
            >
              {newStatus === 'approved' && "Approve"}
              {newStatus === 'rejected' && "Reject"}
              {newStatus === 'pending' && "Mark as Pending"}
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

// Status badge component - updated to show tooltip with rejection reason
const StatusBadge = ({ status, rejectionReason }: { 
  status: string, 
  rejectionReason?: string 
}) => {
  const statusObj = statusOptions.find(option => option.value === status) || {
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
    color: 'bg-gray-100 text-gray-800'
  };

  const icon = () => {
    switch(status) {
      case 'approved': return <CheckCircle className="w-3 h-3 mr-1" />;
      case 'rejected': return <XCircle className="w-3 h-3 mr-1" />;
      case 'pending': return <Clock className="w-3 h-3 mr-1" />;
      default: return <AlertCircle className="w-3 h-3 mr-1" />;
    }
  };

  return (
    <div className="relative group">
      <Badge className={`flex items-center ${statusObj.color} hover:${statusObj.color}`}>
        {icon()}
        {statusObj.label}
      </Badge>
      
      {/* Tooltip for rejection reason */}
      {status === 'rejected' && rejectionReason && (
        <div className="absolute left-0 bottom-full mb-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-black text-white text-xs p-2 rounded max-w-xs shadow-lg">
            <p className="font-medium mb-1">Rejection Reason:</p>
            <p>{rejectionReason}</p>
          </div>
          <div className="w-2 h-2 bg-black transform rotate-45 absolute -bottom-1 left-6"></div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;