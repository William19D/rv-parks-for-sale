import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
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
import { Label } from '@/components/ui/label';
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
  UserCircle
} from 'lucide-react';

// Status type for listings
type ListingStatus = 'pending' | 'approved' | 'rejected' | 'all';

// Listing type
interface Listing {
  id: string;
  title: string;
  price: number;
  status: string;
  created_at: string;
  rejection_reason?: string;
  city: string;
  state: string;
  property_type: string;
  user_id: string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  
  const { user, userRole } = useAuth();
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Admin';
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch all listings from Supabase
  useEffect(() => {
    const fetchAllListings = async () => {
      setIsLoading(true);
      
      try {
        console.log('[Admin] Fetching all listings from Supabase...');
        
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('[Admin] Error fetching listings:', error);
          toast({
            title: "Error",
            description: "Failed to fetch listings from database",
            variant: "destructive",
          });
          return;
        }
        
        console.log(`[Admin] Successfully fetched ${data?.length || 0} listings`);
        
        if (data) {
          // Map the data to our interface
          const mappedListings: Listing[] = data.map(item => ({
            id: item.id.toString(),
            title: item.title || 'Untitled',
            price: item.price || 0,
            status: item.status || 'pending',
            created_at: item.created_at,
            rejection_reason: item.rejection_reason,
            city: item.city || 'Unknown',
            state: item.state || 'Unknown',
            property_type: item.property_type || 'RV Park',
            user_id: item.user_id
          }));
          
          // Update listings and counts
          setListings(mappedListings);
          updateStatusCounts(mappedListings);
          
          console.log('[Admin] Listings by status:', {
            total: mappedListings.length,
            pending: mappedListings.filter(l => l.status === 'pending').length,
            approved: mappedListings.filter(l => l.status === 'approved').length,
            rejected: mappedListings.filter(l => l.status === 'rejected').length
          });
        }
      } catch (error) {
        console.error('[Admin] Error in fetchAllListings:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while fetching listings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllListings();
  }, [toast]);

  // Update status counts
  const updateStatusCounts = (listingsData: Listing[]) => {
    const counts = {
      all: listingsData.length,
      pending: listingsData.filter(l => l.status === 'pending').length,
      approved: listingsData.filter(l => l.status === 'approved').length,
      rejected: listingsData.filter(l => l.status === 'rejected').length
    };
    setStatusCounts(counts);
  };

  // Filter listings based on active tab and search query
  useEffect(() => {
    let filtered = listings;
    
    // Filter by status tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(listing => listing.status === activeTab);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(listing => 
        listing.title?.toLowerCase().includes(query) ||
        listing.city?.toLowerCase().includes(query) ||
        listing.state?.toLowerCase().includes(query) ||
        listing.property_type?.toLowerCase().includes(query)
      );
    }
    
    setFilteredListings(filtered);
    console.log(`[Admin] Filtered listings: ${filtered.length} (tab: ${activeTab}, search: "${searchQuery}")`);
  }, [listings, activeTab, searchQuery]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    console.log(`[Admin] Tab changed to: ${value}`);
    setActiveTab(value as ListingStatus);
  };

  // Open status change dialog
  const openStatusDialog = (listing: Listing, status: string) => {
    setSelectedListing(listing);
    setNewStatus(status);
    
    if (status === 'rejected') {
      setRejectionReason(listing.rejection_reason || '');
      setIsRejectDialogOpen(true);
    } else {
      setIsStatusDialogOpen(true);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (listing: Listing) => {
    setSelectedListing(listing);
    setIsDeleteDialogOpen(true);
  };

  // Handle rejection with reason
  const handleReject = async () => {
    if (!selectedListing) return;
    
    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason.trim() || 'No reason provided',
          updated_at: new Date().toISOString()
        })
        .eq('id', parseInt(selectedListing.id));
      
      if (error) throw error;
      
      // Update local state
      const updatedListings = listings.map(listing => 
        listing.id === selectedListing.id 
          ? { 
              ...listing, 
              status: 'rejected',
              rejection_reason: rejectionReason.trim() || 'No reason provided'
            } 
          : listing
      );
      
      setListings(updatedListings);
      updateStatusCounts(updatedListings);
      
      toast({
        title: "Listing Rejected",
        description: "Listing has been rejected with reason provided",
      });
    } catch (error) {
      console.error('Error rejecting listing:', error);
      toast({
        title: "Error",
        description: "Failed to reject listing",
        variant: "destructive",
      });
    } finally {
      setIsRejectDialogOpen(false);
      setRejectionReason('');
    }
  };

  // Update listing status
  const updateListingStatus = async () => {
    if (!selectedListing || !newStatus) return;
    
    try {
      const updateData = newStatus === 'approved' 
        ? { status: newStatus, rejection_reason: null, updated_at: new Date().toISOString() }
        : { status: newStatus, updated_at: new Date().toISOString() };
        
      const { error } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', parseInt(selectedListing.id));
      
      if (error) throw error;
      
      // Update local state
      const updatedListings = listings.map(listing => 
        listing.id === selectedListing.id 
          ? { 
              ...listing, 
              status: newStatus,
              ...(newStatus === 'approved' && { rejection_reason: undefined })
            }
          : listing
      );
      
      setListings(updatedListings);
      updateStatusCounts(updatedListings);
      
      toast({
        title: "Status Updated",
        description: `Listing has been ${newStatus}`,
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
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', parseInt(selectedListing.id));
      
      if (error) throw error;
      
      // Update local state
      const updatedListings = listings.filter(listing => listing.id !== selectedListing.id);
      setListings(updatedListings);
      updateStatusCounts(updatedListings);
      
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
      {/* Header con información del usuario */}
      <div className="flex justify-between items-center mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex items-center">
          <UserCircle className="h-6 w-6 mr-2 text-[#f74f4f]" />
          <div>
            <h2 className="text-sm font-semibold text-gray-600">Admin User:</h2>
            <p className="text-gray-800 font-medium">{userName}</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button 
          onClick={() => navigate('/admin/listings/new')}
          className="bg-[#f74f4f] hover:bg-[#e43c3c]"
        >
          Add New Listing
        </Button>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/listings/${listing.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/listings/${listing.id}/edit`)}>
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

      {/* Rejection Dialog with Reason */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this listing. This information will be visible to the broker.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea 
                id="rejection-reason"
                placeholder="Explain why this listing is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
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
