import { useState, useEffect } from "react";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle, Eye, EditIcon, TrashIcon, Loader2, Mail, Phone, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

// Define el tipo para una imagen
interface ListingImage {
  id: string;
  storage_path: string;
  is_primary: boolean;
}

// Define el tipo para un listing con imagen
interface Listing {
  id: number;
  title: string;
  price: number;
  city: string;
  state: string;
  status: string;
  created_at: string;
  property_type: string;
  images: ListingImage[];
  primaryImage?: string;
}

// Define el tipo para una consulta (inquiry)
interface Inquiry {
  id: number;
  listing_id: number;
  listing_title: string; // From join
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at: string;
  status: string;
  is_read: boolean;
}

const BrokerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInquiries, setLoadingInquiries] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [activeTab, setActiveTab] = useState("properties");
  
  // Load listings with images
  useEffect(() => {
    const fetchListingsWithImages = async () => {
      if (!user) return;
      
      try {
        // First fetch all listings
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (listingsError) throw listingsError;
        
        if (!listingsData || listingsData.length === 0) {
          setListings([]);
          setLoading(false);
          return;
        }
        
        // For each listing, get its images
        const listingsWithImages = await Promise.all(
          listingsData.map(async (listing) => {
            const { data: imagesData, error: imagesError } = await supabase
              .from('listing_images')
              .select('*')
              .eq('listing_id', listing.id)
              .order('position', { ascending: true });
              
            if (imagesError) {
              console.error(`Error fetching images for listing ${listing.id}:`, imagesError);
              return { ...listing, images: [] };
            }
            
            // Find primary image or use first available
            let primaryImage;
            if (imagesData && imagesData.length > 0) {
              const primary = imagesData.find(img => img.is_primary) || imagesData[0];
              
              // Get public URL for primary image
              const { data: publicUrl } = supabase
                .storage
                .from('listing-images')
                .getPublicUrl(primary.storage_path);
                
              primaryImage = publicUrl?.publicUrl;
            }
            
            return { 
              ...listing, 
              images: imagesData || [],
              primaryImage
            };
          })
        );
        
        setListings(listingsWithImages);
      } catch (error: any) {
        console.error("Error fetching listings with images:", error);
        toast({
          variant: "destructive",
          title: "Error loading properties",
          description: error.message || "Failed to load your property listings"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchListingsWithImages();
  }, [user, toast]);
  
  // Load inquiries for user's listings
  useEffect(() => {
    const fetchInquiries = async () => {
      if (!user) return;
      
      try {
        setLoadingInquiries(true);
        
        // First get all listings by this user
        const { data: userListings, error: listingsError } = await supabase
          .from('listings')
          .select('id')
          .eq('user_id', user.id);
          
        if (listingsError) throw listingsError;
        
        if (!userListings || userListings.length === 0) {
          setInquiries([]);
          setLoadingInquiries(false);
          return;
        }
        
        // Get listing IDs
        const listingIds = userListings.map(listing => listing.id);
        
        // Get all inquiries for these listings
        const { data: inquiryData, error: inquiryError } = await supabase
          .from('inquiry')
          .select(`
            *,
            listings:listing_id (title)
          `)
          .in('listing_id', listingIds)
          .order('created_at', { ascending: false });
          
        if (inquiryError) throw inquiryError;
        
        // Format the inquiries with listing title
        const formattedInquiries = inquiryData.map(inquiry => ({
          id: inquiry.id,
          listing_id: inquiry.listing_id,
          listing_title: inquiry.listings?.title || 'Unknown Property',
          name: inquiry.name,
          email: inquiry.email,
          phone: inquiry.phone,
          message: inquiry.message,
          created_at: inquiry.created_at,
          status: inquiry.status || 'new',
          is_read: inquiry.is_read || false
        }));
        
        setInquiries(formattedInquiries);
      } catch (error: any) {
        console.error("Error fetching inquiries:", error);
        toast({
          variant: "destructive",
          title: "Error loading inquiries",
          description: error.message || "Failed to load property inquiries"
        });
      } finally {
        setLoadingInquiries(false);
      }
    };
    
    fetchInquiries();
  }, [user, toast]);
  
  // Function to delete a listing
  const handleDeleteListing = async (id: number) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update the list after deletion
      setListings(listings.filter(listing => listing.id !== id));
      
      toast({
        title: "Listing deleted",
        description: "Your property listing has been successfully deleted"
      });
    } catch (error: any) {
      console.error("Error deleting listing:", error);
      toast({
        variant: "destructive",
        title: "Error deleting listing",
        description: error.message || "Failed to delete the listing"
      });
    }
  };
  
  // Function to mark an inquiry as read
  const markInquiryAsRead = async (id: number) => {
    try {
      const { error } = await supabase
        .from('inquiry')
        .update({ is_read: true })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update inquiries in state
      setInquiries(inquiries.map(inquiry => 
        inquiry.id === id ? { ...inquiry, is_read: true } : inquiry
      ));
      
    } catch (error: any) {
      console.error("Error marking inquiry as read:", error);
    }
  };
  
  // Function to view inquiry details
  const handleViewInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    
    // Mark as read if not already
    if (!inquiry.is_read) {
      markInquiryAsRead(inquiry.id);
    }
  };
  
  // Format helpers
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };
  
  // Function to get status badge color
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published':
      case 'approved':
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case 'pending':
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case 'rejected':
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case 'draft':
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  // Get unread count for tab badge
  const unreadCount = inquiries.filter(inquiry => !inquiry.is_read).length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <HeaderSpacer />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Broker Dashboard</h1>
            <p className="text-gray-500">Manage your property listings and inquiries</p>
          </div>
          <Button 
            asChild 
            className="mt-4 md:mt-0 bg-[#f74f4f] hover:bg-[#e43c3c] text-white flex items-center gap-2"
          >
            <Link to="/listings/new">
              <Plus className="h-4 w-4" />
              Add New Listing
            </Link>
          </Button>
        </div>
        
        {/* Inquiry Detail Modal */}
        <Dialog open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Inquiry for {selectedInquiry?.listing_title}</DialogTitle>
              <DialogDescription>
                Received on {selectedInquiry?.created_at && formatDate(selectedInquiry.created_at)}
              </DialogDescription>
            </DialogHeader>

            {selectedInquiry && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">From:</span>
                      <span>{selectedInquiry.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <a href={`mailto:${selectedInquiry.email}`} className="text-blue-600 hover:underline">
                        {selectedInquiry.email}
                      </a>
                    </div>
                    {selectedInquiry.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <a href={`tel:${selectedInquiry.phone}`} className="text-blue-600 hover:underline">
                          {selectedInquiry.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="border p-4 rounded-md">
                    <h4 className="font-medium mb-2">Message:</h4>
                    <p className="whitespace-pre-wrap">{selectedInquiry.message}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    asChild
                    variant="outline"
                  >
                    <a href={`mailto:${selectedInquiry.email}?subject=RE: Inquiry about ${selectedInquiry.listing_title}`}>
                      Reply via Email
                    </a>
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => setSelectedInquiry(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        <Tabs defaultValue="properties" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="properties">Your Properties</TabsTrigger>
            <TabsTrigger value="inquiries" className="relative">
              Inquiries
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#f74f4f] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="properties" className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold">Your Properties</h2>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">Loading your listings...</p>
                  </div>
                ) : listings.length === 0 ? (
                  // Message when no listings
                  <div className="text-center py-8">
                    <div className="mb-4 text-gray-400">
                      <MessageCircle className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No listings yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-4">
                      Start adding your properties for sale to reach potential buyers and investors.
                    </p>
                    <Button 
                      className="bg-[#f74f4f] hover:bg-[#e43c3c] text-white"
                      asChild
                    >
                      <Link to="/listings/new">
                        <Plus className="h-4 w-4 mr-1" />
                        Create Your First Listing
                      </Link>
                    </Button>
                  </div>
                ) : (
                  // Table of listings
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Image</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listings.map((listing) => (
                          <TableRow key={listing.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="w-16 h-12 relative rounded-md overflow-hidden">
                                {listing.primaryImage ? (
                                  <img 
                                    src={listing.primaryImage}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                    <span className="text-xs">No image</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {listing.title.length > 30 
                                ? `${listing.title.substring(0, 30)}...` 
                                : listing.title}
                            </TableCell>
                            <TableCell>{listing.city}, {listing.state}</TableCell>
                            <TableCell>{formatPrice(listing.price)}</TableCell>
                            <TableCell>{listing.property_type || "RV Park"}</TableCell>
                            <TableCell>
                              <Badge 
                                className={getStatusBadgeVariant(listing.status)} 
                                variant="outline"
                              >
                                {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end items-center gap-2">
                                <Link 
                                  to={`/listings/${listing.id}`} 
                                  className="p-1.5 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                                  title="View listing"
                                >
                                  <Eye className="h-4 w-4" />
                                </Link>
                                <Link 
                                  to={`/listings/${listing.id}/edit`} 
                                  className="p-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                                  title="Edit listing"
                                >
                                  <EditIcon className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => handleDeleteListing(listing.id)}
                                  className="p-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                                  title="Delete listing"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="inquiries" className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold">Recent Inquiries</h2>
                <p className="text-gray-500 mt-1">Messages from potential buyers interested in your properties</p>
              </div>
              <div className="p-6">
                {loadingInquiries ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">Loading inquiries...</p>
                  </div>
                ) : inquiries.length === 0 ? (
                  // No inquiries message
                  <div className="text-center py-8">
                    <div className="mb-4 text-gray-400">
                      <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No inquiries yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-4">
                      When potential buyers inquire about your listings, they will appear here.
                    </p>
                    <Button variant="outline" asChild>
                      <Link to="/listings">View Your Listings</Link>
                    </Button>
                  </div>
                ) : (
                  // Inquiries Table
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inquiries.map((inquiry) => (
                          <TableRow 
                            key={inquiry.id} 
                            className={inquiry.is_read ? "hover:bg-gray-50" : "hover:bg-gray-50 bg-blue-50/30"}
                          >
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                <span className="text-sm">{formatDate(inquiry.created_at)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {inquiry.name}
                              {!inquiry.is_read && (
                                <Badge variant="default" className="ml-2 bg-blue-500">
                                  New
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                                  {inquiry.email}
                                </div>
                                {inquiry.phone && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                                    {inquiry.phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{inquiry.listing_title}</TableCell>
                            <TableCell>
                              <Badge
                                className={getStatusBadgeVariant(inquiry.status)}
                                variant="outline"
                              >
                                {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewInquiry(inquiry)}
                                  className="h-8"
                                >
                                  View Message
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default BrokerDashboard;