import { useState, useEffect } from "react";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useParams, Link } from "react-router-dom";
import { mockListings } from "@/data/mockListings";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Download, MapPin, Share2, Heart, 
  Calendar, Users, PercentSquare, DollarSign, 
  Building, ChevronLeft, ChevronRight, Maximize2, 
  Star, ExternalLink, MessageSquare, Phone, Mail,
  Loader2, FileText, FileDown
} from "lucide-react";
import { ListingCard } from "@/components/listings/ListingCard";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ContactForm } from "@/components/listings/ContactForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Interface for broker information
interface BrokerInfo {
  id: string;
  name: string;
  email: string;
  company?: string;
  avatar?: string;
  phone?: string;
}

// Interface for both mock and Supabase listings
interface ListingData {
  id: string | number;
  title: string;
  description?: string;
  price: number;
  images: string[];
  broker?: BrokerInfo;
  location: {
    city: string;
    state: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  num_sites?: number;
  occupancy_rate?: number;
  annual_revenue?: number;
  cap_rate?: number;
  videoUrl?: string;
  pdfUrl?: string;
  status?: string;
  documents?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  property_type?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

// Current user and date information
const CURRENT_USER = "Daniel Esteban Muñoz Hernandez";
const CURRENT_DATE = "2025-05-30 14:26:42";

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<ListingData | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch listing data from mock data or Supabase
  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First check if we have it in mock listings
        const mockListing = mockListings.find(l => l.id === id);
        
        if (mockListing) {
          // Add location coordinates for map display
          const enhancedMockListing = {
            ...mockListing,
            location: {
              ...mockListing.location,
              latitude: mockListing.location.lat || 30.2672, // Use Austin, TX as default
              longitude: mockListing.location.lng || -97.7431
            },
            documents: [
              {
                name: "Property Brochure.pdf",
                url: "/sample-documents/property-brochure.pdf",
                type: "pdf"
              },
              {
                name: "Financial Summary.xlsx",
                url: "/sample-documents/financial-summary.xlsx",
                type: "excel"
              },
              {
                name: "Site Map.jpg",
                url: "/sample-documents/site-map.jpg",
                type: "image"
              }
            ]
          };
          setListing(enhancedMockListing);
          setLoading(false);
          return;
        }
        
        // If not in mock data, fetch from Supabase
        // Use direct field names from the database (no coordinates join)
        const { data: supabaseListing, error: supabaseError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .single();
        
        if (supabaseError) throw supabaseError;
        
        if (!supabaseListing) {
          setError("Listing not found");
          setLoading(false);
          return;
        }

        console.log("Database listing:", supabaseListing);
        
        // Fetch images for this listing
        const { data: imagesData, error: imagesError } = await supabase
          .from('listing_images')
          .select('*')
          .eq('listing_id', id)
          .order('position', { ascending: true });
          
        if (imagesError) throw imagesError;
        
        // Get public URLs for images
        const imageUrls = imagesData?.map(img => {
          const { data: publicUrl } = supabase
            .storage
            .from('listing-images')
            .getPublicUrl(img.storage_path);
            
          return publicUrl?.publicUrl || '';
        }) || [];
        
        // Fetch documents for this listing
        const { data: documentsData, error: documentsError } = await supabase
          .from('listing_documents')
          .select('*')
          .eq('listing_id', id)
          .order('created_at', { ascending: false });
          
        let documents = [];
        
        if (!documentsError && documentsData) {
          documents = documentsData.map(doc => {
            const { data: publicUrl } = supabase
              .storage
              .from('listing-documents')
              .getPublicUrl(doc.storage_path);
              
            return {
              name: doc.name || doc.storage_path.split('/').pop() || 'Document',
              url: publicUrl?.publicUrl || '',
              type: doc.type || 'pdf'
            };
          });
        }
        
        // Fetch user info if user_id exists
        let brokerInfo: BrokerInfo = { 
          id: CURRENT_USER,
          name: CURRENT_USER,
          email: 'contact@example.com',
          company: 'RV Park Specialists'
        };
        
        if (supabaseListing.user_id) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supabaseListing.user_id)
            .single();
            
          if (!userError && userData) {
            brokerInfo = {
              id: userData.id || CURRENT_USER,
              name: userData.full_name || CURRENT_USER,
              email: userData.email || 'contact@example.com',
              company: userData.company_name || 'RV Park Specialists',
              avatar: userData.avatar_url,
              phone: userData.phone
            };
          }
        }
        
        // Get coordinates directly from listing table
        const latitude = supabaseListing.latitude || 30.2672; // Default to Austin, TX                          
        const longitude = supabaseListing.longitude || -97.7431;
        
        // Parse amenities if they exist
        let amenitiesList: string[] = [];
        if (supabaseListing.amenities) {
          try {
            if (typeof supabaseListing.amenities === 'string') {
              amenitiesList = JSON.parse(supabaseListing.amenities);
            } else if (Array.isArray(supabaseListing.amenities)) {
              amenitiesList = supabaseListing.amenities;
            }
          } catch (e) {
            console.error("Failed to parse amenities:", e);
          }
        }
        
        // Format listing data to match our interface - use snake_case field names from database
        const formattedListing: ListingData = {
          id: supabaseListing.id,
          title: supabaseListing.title || "RV Park For Sale",
          description: supabaseListing.description || "",
          price: supabaseListing.price || 100000,
          images: imageUrls.length > 0 ? imageUrls : [
            'https://images.unsplash.com/photo-1501886429477-2cd2912c7a21?auto=format&q=75&fit=crop&w=800',
            'https://images.unsplash.com/photo-1602796403359-cff93848c868?auto=format&q=75&fit=crop&w=800',
          ],
          broker: brokerInfo,
          location: {
            city: supabaseListing.city || 'Unknown',
            state: supabaseListing.state || 'Unknown',
            address: supabaseListing.address || '',
            latitude: latitude,
            longitude: longitude
          },
          num_sites: supabaseListing.num_sites || 50,
          occupancy_rate: supabaseListing.occupancy_rate || 80,
          annual_revenue: supabaseListing.annual_revenue || supabaseListing.price * 0.12,
          cap_rate: supabaseListing.cap_rate || 9.5,
          status: supabaseListing.status || 'active',
          property_type: supabaseListing.property_type || 'RV Park',
          created_at: supabaseListing.created_at,
          updated_at: supabaseListing.updated_at,
          user_id: supabaseListing.user_id,
          documents: documents.length > 0 ? documents : [
            {
              name: "Property Brochure.pdf",
              url: "/sample-documents/property-brochure.pdf",
              type: "pdf"
            },
            {
              name: "Financial Summary.xlsx",
              url: "/sample-documents/financial-summary.xlsx",
              type: "excel"
            }
          ]
        };
        
        setListing(formattedListing);
      } catch (err: any) {
        console.error("Error fetching listing:", err);
        setError(err.message || "Failed to load listing");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load listing details",
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchListing();
    }
  }, [id, toast]);
  
  // Auto slide images
  useEffect(() => {
    if (!listing || isFullscreen) return;
    
    const interval = setInterval(() => {
      if (listing.images?.length > 1) {
        setActiveImageIndex(prev => 
          prev === listing.images.length - 1 ? 0 : prev + 1
        );
      }
    }, 8000);
    
    return () => clearInterval(interval);
  }, [listing, isFullscreen]);
  
  const handlePrevImage = () => {
    if (!listing?.images) return;
    setActiveImageIndex(prev => 
      prev === 0 ? listing.images.length - 1 : prev - 1
    );
  };
  
  const handleNextImage = () => {
    if (!listing?.images) return;
    setActiveImageIndex(prev => 
      prev === listing.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleDownload = (url: string, filename: string) => {
    // Create an anchor element and trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Started",
      description: `Downloading ${filename}`,
    });
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <HeaderSpacer />
        <div className="container mx-auto px-4 py-24 text-center flex-grow">
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-12 w-12 text-[#f74f4f] animate-spin mb-4" />
            <p className="text-gray-600">Loading property details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Error state or no listing found
  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <HeaderSpacer />
        <div className="container mx-auto px-4 py-24 text-center flex-grow">
          <div className="max-w-md mx-auto">
            <div className="bg-[#f74f4f]/10 rounded-full p-6 inline-block mb-6">
              <Building className="h-12 w-12 text-[#f74f4f]" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Listing Not Found</h1>
            <p className="text-gray-600 mb-8">
              Sorry, the property you're looking for doesn't exist or has been removed from our marketplace.
            </p>
            <Button asChild className="bg-[#f74f4f] hover:bg-[#e43c3c] text-white">
              <Link to="/listings">Browse All Listings</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Get more listings from the same broker
  const brokerListings = mockListings
    .filter(item => 
      item.broker?.id === listing.broker?.id && 
      item.id !== listing.id
    )
    .slice(0, 3);
  
  // Get the listing date (random date within last 60 days)
  const getListingDate = () => {
    if (listing.created_at) {
      return new Date(listing.created_at).toLocaleDateString();
    }
    
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    return date.toLocaleDateString();
  };
  
  const listingDate = getListingDate();

  // Generate OpenStreetMap URL using coordinates
  const latitude = listing.location.latitude || 30.2672; // Default to Austin, TX 
  const longitude = listing.location.longitude || -97.7431;
  const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01}%2C${latitude-0.01}%2C${longitude+0.01}%2C${latitude+0.01}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <HeaderSpacer />
      
      {/* Full screen image view */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button 
            className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors"
            onClick={() => setIsFullscreen(false)}
          >
            <Maximize2 className="h-6 w-6" />
          </button>
          
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <button 
              className="bg-black/50 p-3 rounded-full hover:bg-black/70 transition-colors text-white"
              onClick={handlePrevImage}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>
          
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <button 
              className="bg-black/50 p-3 rounded-full hover:bg-black/70 transition-colors text-white"
              onClick={handleNextImage}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.img
              key={activeImageIndex}
              src={listing.images[activeImageIndex]}
              alt={listing.title}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>
          
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
            {listing.images.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === activeImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Contact Broker Modal */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl">Contact Broker about {listing.title}</DialogTitle>
            <DialogDescription>
              Send a message to {listing.broker?.name || "the broker"} about this property.
            </DialogDescription>
          </DialogHeader>
          {listing && <ContactForm listing={listing as any} />}
        </DialogContent>
      </Dialog>
      
      {/* Breadcrumb - Removed "Back to Listings" link */}
      <div className="bg-white border-b py-3 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center text-sm">
            <Link to="/" className="text-gray-500 hover:text-[#f74f4f]">Home</Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link to="/listings" className="text-gray-500 hover:text-[#f74f4f]">Listings</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900 font-medium truncate max-w-xs">{listing.title}</span>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6 pb-12">
        {/* Title & Key Stats - Desktop */}
        <div className="mb-6">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-[#f74f4f] text-white border-0 hover:bg-[#f74f4f]">
                  {listing.property_type || "RV Park"}
                </Badge>
                <Badge variant="outline" className="bg-white text-gray-600 border-gray-300">
                  Listed {listingDate}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{listing.title}</h1>
              <div className="flex items-center text-gray-700">
                <MapPin className="h-5 w-5 text-[#f74f4f] mr-1" />
                <span className="text-lg">{listing.location.city}, {listing.location.state}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-gray-500">Asking Price</div>
                <div className="text-3xl font-bold text-[#f74f4f]">
                  {formatCurrency(listing.price)}
                </div>
              </div>
              
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={cn(
                          "border-gray-200",
                          isFavorite && "text-red-500 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-600"
                        )}
                      >
                        <Heart className={cn("h-5 w-5", isFavorite && "fill-red-500")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isFavorite ? "Remove from favorites" : "Save to favorites"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="border-gray-200">
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share listing</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width on desktop */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={activeImageIndex}
                    src={listing.images[activeImageIndex]} 
                    alt={listing.title} 
                    className="h-full w-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </AnimatePresence>
                
                {/* Image controls */}
                <button 
                  onClick={() => setIsFullscreen(true)}
                  className="absolute top-4 right-4 bg-black/50 p-2 rounded-md hover:bg-black/70 transition-colors text-white"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <button 
                    className="bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors text-white"
                    onClick={handlePrevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <button 
                    className="bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors text-white"
                    onClick={handleNextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Image counter */}
                <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-md text-white text-sm">
                  {activeImageIndex + 1} / {listing.images.length}
                </div>
              </div>
              
              {listing.images.length > 1 && (
                <div className="p-3 flex gap-2 overflow-x-auto bg-gray-50 border-t border-gray-100">
                  {listing.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 transition-all ${
                        index === activeImageIndex 
                          ? 'ring-2 ring-[#f74f4f] opacity-100 scale-105' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={image} 
                        alt={`Image ${index + 1}`} 
                        className="h-full w-full object-cover" 
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Key Property Features */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
                <div className="p-6 flex items-center">
                  <div className="bg-[#f74f4f]/10 p-3 rounded-lg mr-4">
                    <Users className="h-6 w-6 text-[#f74f4f]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{listing.num_sites || 50}</div>
                    <div className="text-sm text-gray-500">Total Sites</div>
                  </div>
                </div>
                <div className="p-6 flex items-center">
                  <div className="bg-[#f74f4f]/10 p-3 rounded-lg mr-4">
                    <PercentSquare className="h-6 w-6 text-[#f74f4f]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{listing.occupancy_rate || 85}%</div>
                    <div className="text-sm text-gray-500">Occupancy</div>
                  </div>
                </div>
                <div className="p-6 flex items-center">
                  <div className="bg-[#f74f4f]/10 p-3 rounded-lg mr-4">
                    <DollarSign className="h-6 w-6 text-[#f74f4f]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatCurrency(listing.annual_revenue || listing.price * 0.12, 0)}</div>
                    <div className="text-sm text-gray-500">Annual Revenue</div>
                  </div>
                </div>
                <div className="p-6 flex items-center">
                  <div className="bg-[#f74f4f]/10 p-3 rounded-lg mr-4">
                    <PercentSquare className="h-6 w-6 text-[#f74f4f]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{listing.cap_rate || 8.5}%</div>
                    <div className="text-sm text-gray-500">Cap Rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Files Section */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold">Property Documents</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Download these files for more information about the property
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-3">
                  {listing.documents && listing.documents.map((doc, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="bg-blue-100 text-blue-700 p-2 rounded-lg mr-4">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-gray-500">Click to download</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="text-blue-600"
                        onClick={() => handleDownload(doc.url, doc.name)}
                      >
                        <FileDown className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                  
                  {/* If no documents, show a download button for the offering memorandum */}
                  {(!listing.documents || listing.documents.length === 0) && listing.pdfUrl && (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className="bg-blue-100 text-blue-700 p-2 rounded-lg mr-4">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-medium">Offering Memorandum</p>
                          <p className="text-xs text-gray-500">Complete property details (PDF)</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="text-blue-600"
                        onClick={() => handleDownload(listing.pdfUrl!, "offering-memorandum.pdf")}
                      >
                        <FileDown className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}

                  {/* If no documents at all, show placeholder */}
                  {(!listing.documents || listing.documents.length === 0) && !listing.pdfUrl && (
                    <div className="text-center py-6">
                      <div className="mb-3">
                        <FileText className="h-12 w-12 mx-auto text-gray-300" />
                      </div>
                      <h3 className="text-lg font-medium mb-1">No documents available</h3>
                      <p className="text-gray-500 text-sm">
                        Contact the agent for additional property information
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Detailed Information */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <Tabs defaultValue="description" className="w-full">
                <div className="border-b">
                  <TabsList className="p-0 bg-transparent h-auto border-b-0 w-full rounded-none">
                    <div className="container px-6">
                      <div className="flex overflow-x-auto">
                        <TabsTrigger 
                          value="description" 
                          className="py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#f74f4f] data-[state=active]:bg-transparent data-[state=active]:text-[#f74f4f] data-[state=active]:shadow-none"
                        >
                          Description
                        </TabsTrigger>
                        <TabsTrigger 
                          value="features" 
                          className="py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#f74f4f] data-[state=active]:bg-transparent data-[state=active]:text-[#f74f4f] data-[state=active]:shadow-none"
                        >
                          Features & Amenities
                        </TabsTrigger>
                        <TabsTrigger 
                          value="location" 
                          className="py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#f74f4f] data-[state=active]:bg-transparent data-[state=active]:text-[#f74f4f] data-[state=active]:shadow-none"
                        >
                          Location
                        </TabsTrigger>
                        <TabsTrigger 
                          value="financials" 
                          className="py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#f74f4f] data-[state=active]:bg-transparent data-[state=active]:text-[#f74f4f] data-[state=active]:shadow-none"
                        >
                          Financials
                        </TabsTrigger>
                      </div>
                    </div>
                  </TabsList>
                </div>
                
                <TabsContent value="description" className="mt-0 p-6">
                  <h2 className="text-xl font-bold mb-4">Property Overview</h2>
                  <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
                    {listing.description || `This beautiful RV park is located in ${listing.location.city}, ${listing.location.state}, featuring ${listing.num_sites || 50} sites with full hookups, Wi-Fi, and modern amenities. The property boasts an impressive ${listing.occupancy_rate || 85}% occupancy rate and generates approximately $${formatCurrency(listing.annual_revenue || listing.price * 0.12)} in annual revenue.

The park is well-maintained and includes amenities such as a swimming pool, clubhouse, dog park, and laundry facilities. It's conveniently located near popular attractions, making it ideal for travelers and long-term stays.

This turnkey operation is perfect for investors looking to enter the growing RV park and campground industry with an established, profitable business.`}
                  </p>
                  
                  {listing.pdfUrl && (
                    <Button 
                      variant="outline" 
                      className="flex items-center mt-4 border-[#f74f4f]/20 text-[#f74f4f] hover:bg-[#f74f4f]/5"
                      onClick={() => handleDownload(listing.pdfUrl!, "offering-memorandum.pdf")}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Offering Memorandum
                    </Button>
                  )}
                </TabsContent>
                
                <TabsContent value="features" className="mt-0 p-6">
                  <h2 className="text-xl font-bold mb-4">Features & Amenities</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                    {['WiFi', 'Swimming Pool', 'Laundry Facilities', '24/7 Security', 
                      'Club House', 'Playground', 'Pet Friendly', 'Waterfront Access',
                      'Hiking Trails', 'Fishing Pond', 'Full Hookups', 'Store/Shop'].map((feature, i) => (
                      <div key={i} className="flex items-center py-2 border-b border-gray-100">
                        <div className="p-1 rounded-full bg-emerald-100 mr-3">
                          <Star className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="location" className="mt-0">
                  {/* Map embedded here */}
                  <div className="aspect-[16/10] w-full">
                    <iframe
                      src={openStreetMapUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="RV Park Location"
                    ></iframe>
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Location Details</h2>
                    <p className="text-gray-700 mb-4">
                      This property is located at coordinates ({latitude.toFixed(5)}, {longitude.toFixed(5)}) in {listing.location.city}, {listing.location.state}, 
                      providing excellent access to local amenities and attractions.
                    </p>
                    
                    <div className="bg-gray-50 rounded-lg p-4 flex items-start">
                      <MapPin className="h-5 w-5 text-[#f74f4f] mr-3 mt-0.5" />
                      <div>
                        <div className="font-medium">{listing.location.address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}</div>
                        <div className="text-gray-500">{listing.location.city}, {listing.location.state}</div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="financials" className="mt-0 p-6">
                  <h2 className="text-xl font-bold mb-4">Financial Overview</h2>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 px-4 text-gray-700">Annual Revenue</td>
                          <td className="py-3 px-4 text-right font-medium">{formatCurrency(listing.annual_revenue || listing.price * 0.12)}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 px-4 text-gray-700">Operating Expenses</td>
                          <td className="py-3 px-4 text-right font-medium">{formatCurrency((listing.annual_revenue || listing.price * 0.12) * 0.4)}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 px-4 text-gray-700">Net Operating Income</td>
                          <td className="py-3 px-4 text-right font-medium">{formatCurrency((listing.annual_revenue || listing.price * 0.12) * 0.6)}</td>
                        </tr>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">Cap Rate</td>
                          <td className="py-3 px-4 text-right font-bold text-[#f74f4f]">{listing.cap_rate || 8.5}%</td>
                        </tr>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">Asking Price</td>
                          <td className="py-3 px-4 text-right font-bold text-[#f74f4f]">{formatCurrency(listing.price)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-6 text-sm text-gray-500">
                    <p>*Financial information is provided for informational purposes only. Buyers are advised to verify all information.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Video if available */}
            {listing.videoUrl && (
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-bold">Property Video Tour</h2>
                </div>
                <div className="aspect-video w-full">
                  <iframe 
                    src={listing.videoUrl}
                    title="Property Video"
                    className="h-full w-full"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar - 1/3 width on desktop */}
          <div className="space-y-6">
            {/* Broker Profile - with single Contact Broker button */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold">Listing Agent</h3>
                <div className="text-xs text-gray-500 mt-1">Viewed on: {CURRENT_DATE}</div>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 mr-4">
                    <img 
                      src={listing.broker?.avatar || "https://randomuser.me/api/portraits/men/32.jpg"} 
                      alt={listing.broker?.name || CURRENT_USER} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{listing.broker?.name || CURRENT_USER}</h4>
                    <p className="text-sm text-gray-500">{listing.broker?.company || "RV Park Specialists"}</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  {/* Single Contact Broker button */}
                  <Button 
                    className="w-full bg-[#f74f4f] hover:bg-[#e43c3c] text-white"
                    size="lg"
                    onClick={() => setContactModalOpen(true)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Broker
                  </Button>
                </div>
                
                <div className="text-sm text-gray-500">
                  <p className="mb-2">
                    Typically responds within 24 hours
                  </p>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    <span>Member since 2023</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact form with enhanced styling */}
            <div className="bg-gradient-to-br from-[#f74f4f] to-[#ff7a45] rounded-xl overflow-hidden shadow-md">
              <div className="relative p-6">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                  <div className="absolute -bottom-20 -left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-1">Interested in this property?</h3>
                  <p className="text-white/80 mb-4">
                    Contact the broker now to learn more about this listing.
                  </p>
                  
                  <Button 
                    className="w-full bg-white hover:bg-white/90 text-[#f74f4f]"
                    size="lg"
                    onClick={() => setContactModalOpen(true)}
                  >
                    Contact Broker Now
                  </Button>
                </div>
              </div>
            </div>
            
            {/* RoverPass CTA for new owners */}
            <div className="bg-purple-900 p-6 rounded-lg text-white">
              <h3 className="text-lg font-bold mb-2">Planning to Buy This RV Park?</h3>
              <p className="text-sm text-white/80 mb-4">
                Streamline your operations from day one with RoverPass's comprehensive reservation management system.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Online reservation system
                </div>
                <div className="flex items-center text-sm">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Revenue optimization tools
                </div>
                <div className="flex items-center text-sm">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Guest management platform
                </div>
              </div>
              <Button asChild className="w-full bg-white text-purple-900 hover:bg-gray-100">
                <a href="https://roverpass.com/demo" target="_blank" rel="noopener noreferrer">
                  Schedule a Demo
                </a>
              </Button>
            </div>
            
            {/* Call to action for brokers */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold">Are You a Broker?</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  List your RV parks and campgrounds for sale on our platform and reach thousands of qualified buyers and investors.
                </p>
                <Button 
                  asChild 
                  className="w-full bg-[#f74f4f] hover:bg-[#e43c3c] text-white"
                >
                  <Link to="/broker/dashboard" className="flex items-center justify-center">
                    <Building className="h-4 w-4 mr-2" />
                    List Your Property
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* More listings from this broker */}
        {brokerListings.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">More Properties from this Agent</h2>
              {listing.broker && (
                <Link 
                  to={`/broker/${listing.broker.id}`} 
                  className="text-[#f74f4f] hover:underline flex items-center"
                >
                  View all listings
                  <ExternalLink className="h-4 w-4 ml-1" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {brokerListings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        )}
        
        {/* CTA Section */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8 border border-gray-200">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Looking for Similar Properties?</h2>
            <p className="text-gray-600 mb-6">
              Join our buyers' network to receive updates when new properties matching your criteria become available.
            </p>
            <Button 
              className="bg-[#f74f4f] hover:bg-[#e43c3c] text-white px-8"
              size="lg"
            >
              Join Buyers Network
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default ListingDetail;