import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Tabs, 
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
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MoreHorizontal,
  Edit,
  Eye,
  Trash,
  AlertCircle,
  RefreshCw,
  Settings,
  Loader2,
  DatabaseIcon,
  CheckCheck,
  XIcon
} from 'lucide-react';

// Status type for listings
type ListingStatus = 'pending' | 'approved' | 'rejected' | 'all';

// Updated Listing type matching your actual database schema
interface Listing {
  id: string | number;
  title: string;
  price: number;
  status: string;
  created_at: string;
  rejection_reason?: string;
  city: string;
  state: string;
  property_type: string;
  user_id: string;
  description?: string;
  address?: string;
  num_sites?: number;
  occupancy_rate?: number;
  annual_revenue?: number;
  cap_rate?: number;
}

// Sample rejection reasons for quick selection
const REJECTION_REASONS = [
  "Missing required information",
  "Photos don't meet quality standards",
  "Pricing information is incorrect or missing",
  "Location details are incomplete",
  "Property doesn't meet marketplace requirements"
];

const statusOptions = [
  { value: 'pending', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' }
];

// Configuration for fetching
const MAX_RETRY_ATTEMPTS = 3;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<ListingStatus>('all');
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedReasonIndex, setSelectedReasonIndex] = useState<number | null>(null);
  
  // Fetch state management
  const [retryCount, setRetryCount] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Stats tracking
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // For tracking if the component is mounted
  const isMountedRef = useRef(true);
  // For managing fetch timeouts
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Select a predefined rejection reason
  const selectReason = (index: number) => {
    setSelectedReasonIndex(index);
    setRejectionReason(REJECTION_REASONS[index]);
  };

  // Simpler, more reliable fetch function with retry capability
  const fetchAllListings = async (isRetry = false) => {
    // If this is a fresh fetch (not a retry), reset state
    if (!isRetry) {
      setRetryCount(0);
      setFetchError(null);
    }
    
    // Clear any previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsLoading(true);
    
    // Set a timeout to retry if needed
    timeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      // Only retry if we haven't reached max attempts
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        console.log(`[Admin] Fetch timeout - retrying (${retryCount + 1}/${MAX_RETRY_ATTEMPTS})...`);
        
        setRetryCount(prev => prev + 1);
        fetchAllListings(true);
      } else {
        setIsLoading(false);
        setFetchError("Connection timed out. The server is taking too long to respond.");
        
        toast({
          title: "Connection Issue",
          description: "Failed to load listings after multiple attempts.",
          variant: "destructive",
        });
      }
    }, 15000); // 15 second timeout (increased from 10s for slower connections)
    
    try {
      console.log(`[Admin] Fetching listings${isRetry ? ` (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})` : ''}...`);
      
      // Use Promise.race to implement our own timeout mechanism instead of AbortController
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, price, status, created_at, rejection_reason, city, state, property_type, user_id')
        .order('created_at', { ascending: false });
      
      // Clear the timeout since we got a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (!isMountedRef.current) return; // Don't update state if component unmounted
      
      if (error) {
        console.error('[Admin] Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log(`[Admin] Successfully fetched ${data?.length || 0} total listings`);
      
      if (!data || data.length === 0) {
        setAllListings([]);
        setFilteredListings([]);
        setStatusCounts({
          all: 0,
          pending: 0, 
          approved: 0,
          rejected: 0
        });
        setIsLoading(false);
        setDataLoaded(true);
        return;
      }
      
      // Process the listings data
      const processedListings: Listing[] = data.map(item => ({
        id: item.id,
        title: item.title || 'Untitled Listing',
        price: Number(item.price) || 0,
        status: item.status || 'pending',
        created_at: item.created_at || new Date().toISOString(),
        rejection_reason: item.rejection_reason,
        city: item.city || 'Unknown',
        state: item.state || 'Unknown',
        property_type: item.property_type || 'RV Park',
        user_id: item.user_id,
      }));
      
      // Update all states
      setAllListings(processedListings);
      updateFilteredListings(processedListings, activeTab);
      updateStatusCounts(processedListings);
      
      // Clear any error state
      setFetchError(null);
      setDataLoaded(true);
      
      // Show success toast if this was a retry
      if (isRetry) {
        toast({
          title: "Connection Restored",
          description: "Successfully loaded listings data.",
        });
      }
    } catch (error: any) {
      // Clear the timeout since we got a response (even if it's an error)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (!isMountedRef.current) return; // Don't update state if component unmounted
      
      console.error('[Admin] Error in fetchAllListings:', error);
      
      // Retry logic if not reached max attempts
      if (retryCount < MAX_RETRY_ATTEMPTS - 1) {
        setRetryCount(prev => prev + 1);
        
        toast({
          title: "Error Loading Data",
          description: `Retrying... (Attempt ${retryCount + 2}/${MAX_RETRY_ATTEMPTS})`,
        });
        
        // Wait 2 seconds before retrying
        setTimeout(() => {
          if (isMountedRef.current) {
            fetchAllListings(true);
          }
        }, 2000);
      } else {
        // Max retries reached, show error
        setIsLoading(false);
        setFetchError(error.message || "Failed to load listings data");
        
        toast({
          title: "Error",
          description: "Could not load listings. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      // If this is the last attempt or we succeeded, set loading false
      if (retryCount >= MAX_RETRY_ATTEMPTS - 1 || !fetchError) {
        setIsLoading(false);
      }
    }
  };
  
  // Helper to update filtered listings based on active tab
  const updateFilteredListings = (listings: Listing[], tab: ListingStatus) => {
    if (tab === 'all') {
      setFilteredListings(listings);
    } else {
      setFilteredListings(listings.filter(listing => listing.status === tab));
    }
  };
  
  // Helper to calculate status counts
  const updateStatusCounts = (listings: Listing[]) => {
    setStatusCounts({
      all: listings.length,
      pending: listings.filter(l => l.status === 'pending').length,
      approved: listings.filter(l => l.status === 'approved').length,
      rejected: listings.filter(l => l.status === 'rejected').length
    });
  };

  // Load ALL listings when component mounts
  useEffect(() => {
    fetchAllListings();
  }, []);
  
  // Handle tab changes - filter the existing data
  useEffect(() => {
    if (allListings.length > 0) {
      updateFilteredListings(allListings, activeTab);
    }
  }, [activeTab, allListings]);

  // Handle search filtering
  useEffect(() => {
    if (allListings.length === 0) return;
    
    if (!searchQuery.trim()) {
      updateFilteredListings(allListings, activeTab);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    // First filter by active tab
    const tabFilteredListings = activeTab === 'all'
      ? allListings
      : allListings.filter(listing => listing.status === activeTab);
    
    // Then filter by search query
    const searchFilteredListings = tabFilteredListings.filter(listing => 
      listing.title?.toLowerCase().includes(query) ||
      listing.city?.toLowerCase().includes(query) ||
      listing.state?.toLowerCase().includes(query) ||
      listing.property_type?.toLowerCase().includes(query)
    );
    
    setFilteredListings(searchFilteredListings);
  }, [searchQuery, allListings, activeTab]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as ListingStatus);
  };

  // Open status change dialog
  const openStatusDialog = (listing: Listing, status: string) => {
    setSelectedListing(listing);
    setNewStatus(status);
    
    if (status === 'rejected') {
      // Pre-fill with existing rejection reason if available
      setRejectionReason(listing.rejection_reason || '');
      setSelectedReasonIndex(null);
      setIsRejectDialogOpen(true);
    } else {
      setIsStatusDialogOpen(true);
    }
  };
  
  // Direct reject handler (opens reject dialog)
  const handleRejectClick = (listing: Listing) => {
    setSelectedListing(listing);
    setRejectionReason(listing.rejection_reason || '');
    setSelectedReasonIndex(null);
    setIsRejectDialogOpen(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (listing: Listing) => {
    setSelectedListing(listing);
    setIsDeleteDialogOpen(true);
  };

  // View listing function
  const viewListing = (listing: Listing) => {
    // Using a safe approach with multiple fallbacks
    try {
      const listingId = listing.id;
      console.log(`[Admin] Navigating to public listing: /listings/${listingId}`);
      
      // First try direct navigation
      navigate(`/listings/${listingId}`);
    } catch (err) {
      console.error("[Admin] Navigation failed:", err);
      
      // Fallback to window.open
      try {
        window.open(`/listings/${listing.id}`, '_blank');
      } catch (fallbackErr) {
        console.error("[Admin] Fallback navigation failed:", fallbackErr);
        toast({
          variant: "destructive",
          title: "Navigation Error",
          description: "Could not open the listing page."
        });
      }
    }
  };

  // Edit listing
  const editListing = (listing: Listing) => {
    try {
      navigate(`/admin/listings/${listing.id}/edit`);
    } catch (err) {
      console.error("[Admin] Failed to navigate to edit view:", err);
      toast({
        variant: "destructive",
        title: "Navigation Error",
        description: "Could not open the listing edit page."
      });
    }
  };

  // Handle rejection
  const handleReject = async () => {
    if (!selectedListing) return;
    
    try {
      // Convert ID to number if needed
      const listingId = typeof selectedListing.id === 'string' && /^\d+$/.test(selectedListing.id)
        ? parseInt(selectedListing.id)
        : selectedListing.id;
      
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason.trim() || 'No reason provided',
          updated_at: new Date().toISOString()
        })
        .eq('id', listingId);
      
      if (error) throw error;
      
      toast({
        title: "Listing Rejected",
        description: "Listing has been rejected with reason provided.",
      });
      
      // Update local state immediately for better UX
      const updatedListings = allListings.map(listing => 
        listing.id === selectedListing.id 
          ? { 
              ...listing, 
              status: 'rejected', 
              rejection_reason: rejectionReason.trim() || 'No reason provided' 
            } 
          : listing
      );
      
      setAllListings(updatedListings);
      updateFilteredListings(updatedListings, activeTab);
      updateStatusCounts(updatedListings);
      
    } catch (error) {
      console.error('Error rejecting listing:', error);
      toast({
        title: "Error",
        description: "Failed to reject listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedReasonIndex(null);
    }
  };

  // Update listing status
  const updateListingStatus = async () => {
    if (!selectedListing || !newStatus) return;
    
    try {
      // Convert ID if needed
      const listingId = typeof selectedListing.id === 'string' && /^\d+$/.test(selectedListing.id)
        ? parseInt(selectedListing.id)
        : selectedListing.id;
      
      const updateData = newStatus === 'approved' 
        ? { status: newStatus, rejection_reason: null, updated_at: new Date().toISOString() }
        : { status: newStatus, updated_at: new Date().toISOString() };
        
      const { error } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listingId);
      
      if (error) throw error;
      
      toast({
        title: "Status Updated",
        description: `Listing status changed to ${newStatus}`,
      });
      
      // Update local state for better UX
      const updatedListings = allListings.map(listing => 
        listing.id === selectedListing.id 
          ? { 
              ...listing, 
              status: newStatus,
              rejection_reason: newStatus === 'approved' ? null : listing.rejection_reason 
            } 
          : listing
      );
      
      setAllListings(updatedListings);
      updateFilteredListings(updatedListings, activeTab);
      updateStatusCounts(updatedListings);
      
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
      // Convert ID if needed
      const listingId = typeof selectedListing.id === 'string' && /^\d+$/.test(selectedListing.id)
        ? parseInt(selectedListing.id)
        : selectedListing.id;
      
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);
      
      if (error) throw error;
      
      toast({
        title: "Listing Deleted",
        description: "The listing has been permanently deleted",
      });
      
      // Update local state
      const updatedListings = allListings.filter(listing => listing.id !== selectedListing.id);
      setAllListings(updatedListings);
      updateFilteredListings(updatedListings, activeTab);
      updateStatusCounts(updatedListings);
      
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
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => fetchAllListings()}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </Button>
          <Button 
            onClick={() => navigate('/admin/listings/new')}
            className="bg-[#f74f4f] hover:bg-[#e43c3c]"
          >
            Add New Listing
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm mb-1">Total Listings</h3>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">{statusCounts.all}</span>
            <Badge className="bg-gray-100 text-gray-800">All</Badge>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm mb-1">Pending Review</h3>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">{statusCounts.pending}</span>
            <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm mb-1">Approved</h3>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">{statusCounts.approved}</span>
            <Badge className="bg-green-100 text-green-800">Approved</Badge>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm mb-1">Rejected</h3>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">{statusCounts.rejected}</span>
            <Badge className="bg-red-100 text-red-800">Rejected</Badge>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Tabs and Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <Tabs 
            defaultValue="all" 
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full md:w-auto"
          >
            <TabsList>
              <TabsTrigger value="all" className="text-sm">
                All Listings
                <Badge className="ml-2 bg-gray-100 text-gray-800 hover:bg-gray-100">
                  {statusCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-sm">
                Pending 
                <Badge className="ml-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                  {statusCounts.pending}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-sm">
                Approved
                <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                  {statusCounts.approved}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-sm">
                Rejected
                <Badge className="ml-2 bg-red-100 text-red-800 hover:bg-red-100">
                  {statusCounts.rejected}
                </Badge>
              </TabsTrigger>
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
        
        {/* Loading State */}
        {isLoading && (
          <div className="py-10 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 text-[#f74f4f] animate-spin mb-4" />
            <p className="text-gray-500 font-medium">
              Loading listings{retryCount > 0 ? ` (Attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})` : ''}...
            </p>
            <p className="text-gray-400 text-sm mt-1">
              This may take a few moments
            </p>
          </div>
        )}
        
        {/* Error State */}
        {!isLoading && fetchError && (
          <div className="py-10 flex flex-col items-center justify-center">
            <div className="mb-4 p-4 rounded-full bg-red-50 text-red-600">
              <DatabaseIcon className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Connection Issue</h3>
            <p className="text-gray-600 mb-5 text-center max-w-md">
              {fetchError || "We couldn't load your listings data. This might be due to a connection issue."}
            </p>
            <Button 
              onClick={() => fetchAllListings()}
              className="flex items-center bg-[#f74f4f] hover:bg-[#e43c3c] text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
        
        {/* Empty State */}
        {!isLoading && !fetchError && dataLoaded && filteredListings.length === 0 && (
          <div className="py-10 flex flex-col items-center justify-center">
            <div className="mb-4 p-3 rounded-full bg-gray-100">
              <Filter className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium">No listings found</h3>
            <p className="text-gray-500 mt-1">
              {searchQuery ? 'Try adjusting your search.' : 'There are no listings in this category yet.'}
            </p>
          </div>
        )}
        
        {/* Data Table */}
        {!isLoading && !fetchError && filteredListings.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Listed On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell className="font-medium">{listing.title}</TableCell>
                    <TableCell>{listing.city}, {listing.state}</TableCell>
                    <TableCell>{formatCurrency(listing.price)}</TableCell>
                    <TableCell>{listing.property_type}</TableCell>
                    <TableCell>
                      <StatusBadge status={listing.status} />
                      {listing.status === 'rejected' && listing.rejection_reason && (
                        <div className="text-xs text-gray-600 mt-1 truncate max-w-[200px]" title={listing.rejection_reason}>
                          Reason: {listing.rejection_reason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(listing.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-2">
                        {/* View button */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => viewListing(listing)}
                          title="View public listing"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {/* Edit button */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                          onClick={() => editListing(listing)}
                          title="Edit listing details"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        {/* ADDED: Direct Approve/Reject buttons for pending listings */}
                        {listing.status === 'pending' && (
                          <>
                            {/* Approve button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                              onClick={() => openStatusDialog(listing, 'approved')}
                              title="Approve listing"
                            >
                              <CheckCheck className="h-4 w-4" />
                            </Button>
                            
                            {/* Direct Reject button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => handleRejectClick(listing)}
                              title="Reject listing"
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {/* More options dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                              title="More actions"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Status change options */}
                            {listing.status !== 'approved' && (
                              <DropdownMenuItem onClick={() => openStatusDialog(listing, 'approved')}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                <span>Approve</span>
                              </DropdownMenuItem>
                            )}
                            
                            {listing.status !== 'rejected' && (
                              <DropdownMenuItem onClick={() => handleRejectClick(listing)}>
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
                      </div>
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
              {newStatus === 'pending' && "This listing will be marked as pending review."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={updateListingStatus}
              className={
                newStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' :
                'bg-yellow-600 hover:bg-yellow-700'
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* IMPROVED: Rejection Dialog with Reason Selection */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this listing. This information will be visible to the broker.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Quick selection reasons */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-500">Common Rejection Reasons:</Label>
              <div className="flex flex-wrap gap-2">
                {REJECTION_REASONS.map((reason, index) => (
                  <Badge 
                    key={index}
                    variant="outline"
                    className={`cursor-pointer ${
                      selectedReasonIndex === index 
                        ? 'bg-red-50 border-red-200 text-red-800' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => selectReason(index)}
                  >
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea 
                id="rejection-reason"
                placeholder="Explain why this listing is being rejected..."
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  setSelectedReasonIndex(null);
                }}
                rows={4}
                className="resize-none"
                autoFocus
              />
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Listing
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

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
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
    <Badge className={`flex items-center ${statusObj.color} hover:${statusObj.color}`}>
      {icon()}
      {statusObj.label}
    </Badge>
  );
};

export default AdminDashboard;