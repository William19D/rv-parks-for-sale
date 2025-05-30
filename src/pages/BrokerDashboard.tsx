import { useState, useEffect } from "react";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle, Eye, EditIcon, TrashIcon, Loader2, BarChart, DollarSign, ListChecks } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

// Interfaz para las estadísticas
interface BrokerStatistics {
  totalListings: number;
  publishedListings: number;
  pendingListings: number;
  totalValue: number;
  averagePrice: number;
}

const BrokerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BrokerStatistics>({
    totalListings: 0,
    publishedListings: 0,
    pendingListings: 0,
    totalValue: 0,
    averagePrice: 0
  });
  
  // Cargar listados del usuario y sus imágenes
  useEffect(() => {
    const fetchListingsWithImages = async () => {
      if (!user) return;
      
      try {
        // Primero cargamos todos los listados
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
        
        // Calcular las estadísticas
        const publishedCount = listingsData.filter(l => l.status === 'published').length;
        const pendingCount = listingsData.filter(l => l.status === 'pending').length;
        const totalPrice = listingsData.reduce((sum, listing) => sum + (listing.price || 0), 0);
        const avgPrice = listingsData.length > 0 ? totalPrice / listingsData.length : 0;
        
        setStats({
          totalListings: listingsData.length,
          publishedListings: publishedCount,
          pendingListings: pendingCount,
          totalValue: totalPrice,
          averagePrice: avgPrice
        });
        
        // Para cada listado, buscamos sus imágenes
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
            
            // Buscar la imagen primaria o usar la primera disponible
            let primaryImage;
            if (imagesData && imagesData.length > 0) {
              const primary = imagesData.find(img => img.is_primary) || imagesData[0];
              
              // Obtener URL pública para la imagen primaria
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
  
  // Función para eliminar un listado
  const handleDeleteListing = async (id: number) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Actualizar la lista de listados después de eliminar
      setListings(listings.filter(listing => listing.id !== id));
      
      // Actualizar estadísticas
      const deletedListing = listings.find(l => l.id === id);
      if (deletedListing) {
        setStats(prev => ({
          ...prev,
          totalListings: prev.totalListings - 1,
          publishedListings: deletedListing.status === 'published' ? prev.publishedListings - 1 : prev.publishedListings,
          pendingListings: deletedListing.status === 'pending' ? prev.pendingListings - 1 : prev.pendingListings,
          totalValue: prev.totalValue - deletedListing.price,
          averagePrice: (prev.totalListings - 1) > 0 ? (prev.totalValue - deletedListing.price) / (prev.totalListings - 1) : 0
        }));
      }
      
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
  
  // Función para formatear el precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Función para obtener el color de la badge según el estado
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published':
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
            {/* Updated to use the correct path for new listing */}
            <Link to="/listings/new">
              <Plus className="h-4 w-4" />
              Add New Listing
            </Link>
          </Button>
        </div>
        
        <div className="space-y-8">
          {/* Real-time Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalListings}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.publishedListings} published, {stats.pendingListings} pending
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(stats.totalValue)}</div>
                <p className="text-xs text-muted-foreground">
                  Across {stats.totalListings} properties
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Price</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(stats.averagePrice)}</div>
                <p className="text-xs text-muted-foreground">
                  Per property listing
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Listing Status</CardTitle>
                <ListChecks className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalListings > 0 
                    ? `${Math.round((stats.publishedListings / stats.totalListings) * 100)}%` 
                    : "0%"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Published listings rate
                </p>
              </CardContent>
            </Card>
          </div>
          
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
                // Mensaje cuando no hay listados
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
                    {/* Updated to use the correct path for new listing */}
                    <Link to="/listings/new">
                      <Plus className="h-4 w-4 mr-1" />
                      Create Your First Listing
                    </Link>
                  </Button>
                </div>
              ) : (
                // Tabla de listados cuando hay listados
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
                              {/* Updated to use the correct path for editing a listing */}
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
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-6">Recent Inquiries</h2>
            
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
          </div>
        </div>
      </div>
      
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default BrokerDashboard;