import { useState, useEffect } from "react";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ContactForm } from "@/components/listings/ContactForm";
import { useParams, Link } from "react-router-dom";
import { mockListings } from "@/data/mockListings";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Download, MapPin, Share2, Heart, 
  Calendar, Users, PercentSquare, DollarSign, 
  Building, ChevronLeft, ChevronRight, Maximize2, 
  Star, ExternalLink, MessageSquare, Phone, Mail,
  Loader2
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

// Interface for both mock and Supabase listings
interface ListingData {
  id: string | number;
  title: string;
  description?: string;
  price: number;
  images: string[];
  broker?: {
    id: string;
    name: string;
    company?: string;
    avatar?: string;
    email?: string;
  };
  location: {
    city: string;
    state: string;
    address?: string;
  };
  numSites?: number;
  occupancyRate?: number;
  annualRevenue?: number;
  capRate?: number;
  videoUrl?: string;
  pdfUrl?: string;
  status?: string;
}

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<ListingData | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
          setListing(mockListing);
          setLoading(false);
          return;
        }
        
        // If not in mock data, fetch from Supabase
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
        
        // Fetch broker info if broker_id exists
        let brokerInfo = { 
          id: 'unknown',
          name: 'Unknown Broker',
          email: 'contact@example.com'
        };
        
        if (supabaseListing.broker_id) {
          const { data: brokerData, error: brokerError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supabaseListing.broker_id)
            .single();
            
          if (!brokerError && brokerData) {
            brokerInfo = {
              id: brokerData.id,
              name: brokerData.full_name || 'Unnamed Broker',
              email: brokerData.email,
              company: brokerData.company_name,
              avatar: brokerData.avatar_url
            };
          }
        }
        
        // Format listing data to match our interface
        const formattedListing: ListingData = {
          id: supabaseListing.id,
          title: supabaseListing.title,
          description: supabaseListing.description,
          price: supabaseListing.price,
          images: imageUrls.length > 0 ? imageUrls : [
            'https://images.unsplash.com/photo-1501886429477-2cd2912c7a21?auto=format&q=75&fit=crop&w=800',
            'https://images.unsplash.com/photo-1602796403359-cff93848c868?auto=format&q=75&fit=crop&w=800',
          ],
          broker: brokerInfo,
          location: {
            city: supabaseListing.city || 'Unknown',
            state: supabaseListing.state || 'Unknown',
            address: supabaseListing.address,
          },
          numSites: supabaseListing.num_sites || 50,
          occupancyRate: supabaseListing.occupancy_rate || 80,
          annualRevenue: supabaseListing.annual_revenue || supabaseListing.price * 0.12,
          capRate: supabaseListing.cap_rate || 9.5,
          status: supabaseListing.status || 'active',
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
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    return date.toLocaleDateString();
  };
  
  const listingDate = getListingDate();
  
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
      
      {/* Breadcrumb & Quick Nav */}
      <div className="bg-white border-b py-3 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm">
              <Link to="/" className="text-gray-500 hover:text-[#f74f4f]">Home</Link>
              <span className="mx-2 text-gray-400">/</span>
              <Link to="/listings" className="text-gray-500 hover:text-[#f74f4f]">Listings</Link>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900 font-medium truncate max-w-xs">{listing.title}</span>
            </div>
            
            <Link to="/listings" className="inline-flex items-center text-[#f74f4f] hover:underline text-sm font-medium">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Listings
            </Link>
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
                  Featured
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
                    <div className="text-2xl font-bold">{listing.numSites || 50}</div>
                    <div className="text-sm text-gray-500">Total Sites</div>
                  </div>
                </div>
                <div className="p-6 flex items-center">
                  <div className="bg-[#f74f4f]/10 p-3 rounded-lg mr-4">
                    <PercentSquare className="h-6 w-6 text-[#f74f4f]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{listing.occupancyRate || 85}%</div>
                    <div className="text-sm text-gray-500">Occupancy</div>
                  </div>
                </div>
                <div className="p-6 flex items-center">
                  <div className="bg-[#f74f4f]/10 p-3 rounded-lg mr-4">
                    <DollarSign className="h-6 w-6 text-[#f74f4f]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatCurrency(listing.annualRevenue || listing.price * 0.12, 0)}</div>
                    <div className="text-sm text-gray-500">Annual Revenue</div>
                  </div>
                </div>
                <div className="p-6 flex items-center">
                  <div className="bg-[#f74f4f]/10 p-3 rounded-lg mr-4">
                    <PercentSquare className="h-6 w-6 text-[#f74f4f]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{listing.capRate || 8.5}%</div>
                    <div className="text-sm text-gray-500">Cap Rate</div>
                  </div>
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
                    {listing.description || `This beautiful RV park is located in ${listing.location.city}, ${listing.location.state}, featuring ${listing.numSites || 50} sites with full hookups, Wi-Fi, and modern amenities. The property boasts an impressive ${listing.occupancyRate || 85}% occupancy rate and generates approximately $${formatCurrency(listing.annualRevenue || listing.price * 0.12)} in annual revenue.

The park is well-maintained and includes amenities such as a swimming pool, clubhouse, dog park, and laundry facilities. It's conveniently located near popular attractions, making it ideal for travelers and long-term stays.

This turnkey operation is perfect for investors looking to enter the growing RV park and campground industry with an established, profitable business.`}
                  </p>
                  
                  {listing.pdfUrl && (
                    <Button 
                      variant="outline" 
                      className="flex items-center mt-4 border-[#f74f4f]/20 text-[#f74f4f] hover:bg-[#f74f4f]/5"
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
                  <div className="aspect-[16/10] bg-gray-100 w-full">
                    {/* Here you'd normally embed a Google Map */}
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                      <div className="text-gray-500">Location: {listing.location.city}, {listing.location.state}</div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Location Details</h2>
                    <p className="text-gray-700 mb-4">
                      This property is conveniently located in {listing.location.city}, {listing.location.state}, 
                      providing excellent access to local amenities and attractions.
                    </p>
                    
                    <div className="bg-gray-50 rounded-lg p-4 flex items-start">
                      <MapPin className="h-5 w-5 text-[#f74f4f] mr-3 mt-0.5" />
                      <div>
                        <div className="font-medium">{listing.location.address || `123 Main St`}</div>
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
                          <td className="py-3 px-4 text-right font-medium">{formatCurrency(listing.annualRevenue || listing.price * 0.12)}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 px-4 text-gray-700">Operating Expenses</td>
                          <td className="py-3 px-4 text-right font-medium">{formatCurrency((listing.annualRevenue || listing.price * 0.12) * 0.4)}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 px-4 text-gray-700">Net Operating Income</td>
                          <td className="py-3 px-4 text-right font-medium">{formatCurrency((listing.annualRevenue || listing.price * 0.12) * 0.6)}</td>
                        </tr>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">Cap Rate</td>
                          <td className="py-3 px-4 text-right font-bold text-[#f74f4f]">{listing.capRate || 8.5}%</td>
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
            {/* Broker Profile */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold">Listing Agent</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 mr-4">
                    <img 
                      src={listing.broker?.avatar || "https://randomuser.me/api/portraits/men/32.jpg"} 
                      alt={listing.broker?.name || "Agent"} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{listing.broker?.name || "Agent Name"}</h4>
                    <p className="text-sm text-gray-500">{listing.broker?.company || "RV Park Specialists"}</p>
                    <div className="flex items-center mt-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">(32 reviews)</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <Button 
                    className="w-full bg-[#f74f4f] hover:bg-[#e43c3c] text-white"
                    size="lg"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Agent
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email Agent
                  </Button>
                </div>
                
                <div className="text-sm text-gray-500">
                  <p className="mb-2">
                    Typically responds within 24 hours
                  </p>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    <span>Member since 2018</span>
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
                    Fill out the form below and the agent will contact you shortly.
                  </p>
                  
                  <ContactForm listing={listing} />
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
              <h2 className="text-2xl font-bold">More Properties from this Broker</h2>
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