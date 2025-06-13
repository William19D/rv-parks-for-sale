import { useState, useEffect, useRef } from "react";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useParams, Link } from "react-router-dom";
import { mockListings } from "@/data/mockListings";
import { formatCurrency, getListingDocuments, getFileTypeCategory } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Download, MapPin, Share2, Heart, 
  Calendar, Users, PercentSquare, DollarSign, 
  Building, ChevronLeft, ChevronRight, Maximize2, 
  Star, ExternalLink, MessageSquare, Phone, Mail,
  Loader2, FileText, FileDown, Send, User, Lock,
  FileIcon, File, Check
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

// Get hCaptcha site key from environment variables
const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001';

// Interface for broker information
interface BrokerInfo {
  id: string;
  name: string;
  email: string;
  company?: string;
  avatar?: string;
  phone?: string;
  title?: string;
  bio?: string;
  website?: string;
  experience?: number;
  totalListings?: number;
  joinedDate?: string;
  verifiedStatus?: boolean;
}

// Enhanced DocumentData interface with storage fields
interface DocumentData {
  id: number;
  name: string;
  url?: string;
  storagePath?: string; // Added for secure download
  storageBucket?: string; // Added for secure download
  type: string;
  size?: number;
  is_primary?: boolean;
  description?: string;
  created_at?: string;
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
  documents?: DocumentData[];
  property_type?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  amenities?: Record<string, boolean> | string[] | null;
}

// Interface for the current user
interface CurrentUser {
  id: string;
  email: string;
  full_name?: string;
}

// Secure document download handler
const secureDocumentDownload = async (
  path: string,
  bucketName: string = 'listing-documents',
  filename: string,
  onSuccess?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    // Get the document directly from Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(path);
    
    if (error || !data) {
      console.error("Secure download error:", error);
      if (onError) onError(new Error(error?.message || "Failed to download file"));
      return;
    }
    
    // Create a blob from the file data
    const blob = new Blob([data]);
    
    // Create a temporary URL for the blob
    const objectUrl = URL.createObjectURL(blob);
    
    // Create a temporary link element and trigger download
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    }, 100);
    
    if (onSuccess) onSuccess();
    
  } catch (err) {
    console.error("Secure download failed:", err);
    if (onError) onError(err instanceof Error ? err : new Error("Unknown error"));
  }
};

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<ListingData | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [amenities, setAmenities] = useState<string[]>([]);
  
  // Contact form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // hCaptcha state
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha | null>(null);
  
  const { toast } = useToast();

  // Fetch current authenticated user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("Error fetching current user:", error);
        return;
      }
      
      if (user) {
        // If authenticated, get additional profile information
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        setCurrentUser({
          id: user.id,
          email: user.email || '',
          full_name: profileData?.full_name || user.email?.split('@')[0] || ''
        });
      }
    };
    
    fetchCurrentUser();
  }, []);
  
  // Set default message when listing is loaded
  useEffect(() => {
    if (listing) {
      setMessage(`I'm interested in ${listing.title}. Please send me more information.`);
    }
  }, [listing]);
  
  // Handle hCaptcha verification
  const handleVerificationSuccess = (token: string) => {
    console.log('[Inquiry] hCaptcha verification successful');
    setCaptchaToken(token);
  };

  const handleCaptchaError = () => {
    console.error('[Inquiry] hCaptcha verification failed');
    toast({
      title: "Verification Error",
      description: "Failed to verify that you're not a robot. Please try again.",
      variant: "destructive",
    });
  };
  
  // Reset captcha when the modal is closed
  useEffect(() => {
    if (!contactModalOpen) {
      setCaptchaToken(null);
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
    }
  }, [contactModalOpen]);
  
  // Fetch documents separately to ensure we have the latest data
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!id) return;
      
      setLoadingDocuments(true);
      try {
        // Get listing documents from the database
        const { data: documentData, error } = await supabase
          .from('listing_documents')
          .select('*')
          .eq('listing_id', id);
          
        if (error) throw error;
        
        if (documentData && documentData.length > 0) {
          // Transform the documents with storage paths instead of direct URLs
          const processedDocs: DocumentData[] = documentData.map(doc => {
            const fileType = getFileTypeCategory(doc.name || '');
            
            return {
              id: doc.id,
              name: doc.name || `Document ${doc.id}`,
              type: fileType,
              size: doc.file_size,
              is_primary: doc.is_primary,
              description: doc.description,
              created_at: doc.created_at,
              storagePath: doc.storage_path,
              storageBucket: 'listing-documents'
            };
          });
          
          setDocuments(processedDocs);
        } else {
          setDocuments([]);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
        setDocuments([]);
      } finally {
        setLoadingDocuments(false);
      }
    };
    
    fetchDocuments();
  }, [id]);
  
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
                id: 1,
                name: "Property Brochure.pdf",
                url: "/sample-documents/property-brochure.pdf",
                type: "pdf",
                size: 1024 * 1024, // 1MB
                is_primary: true
              },
              {
                id: 2,
                name: "Financial Summary.xlsx",
                url: "/sample-documents/financial-summary.xlsx",
                type: "excel",
                size: 512 * 1024 // 512KB
              },
              {
                id: 3,
                name: "Site Map.jpg",
                url: "/sample-documents/site-map.jpg",
                type: "image",
                size: 2 * 1024 * 1024 // 2MB
              }
            ],
            // Enhanced broker information
            broker: {
              ...mockListing.broker,
              title: "Senior RV Park Specialist",
              bio: "William is a specialist in RV Park and campground sales with over 10 years of experience in the industry. He focuses on high-value properties in the Southern states.",
              website: "www.rvparkbroker.com",
              experience: 10,
              totalListings: 48,
              joinedDate: "2018-03-15",
              verifiedStatus: true
            },
            amenities: ['WiFi', 'Swimming Pool', 'Laundry Facilities', '24/7 Security', 
                    'Club House', 'Playground', 'Pet Friendly', 'Waterfront Access']
          };
          setListing(enhancedMockListing);
          setAmenities(enhancedMockListing.amenities as string[] || []);
          setDocuments(enhancedMockListing.documents || []);
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
        
        // Fetch user info if user_id exists
        let brokerInfo: BrokerInfo = { 
          id: "unknown",
          name: "Unknown Broker",
          email: 'contact@example.com',
          company: 'RV Park Specialists',
          title: "RV Park Sales Agent",
          experience: 5,
          totalListings: 24,
          joinedDate: new Date().toISOString(),
          verifiedStatus: true
        };
        
        if (supabaseListing.user_id) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supabaseListing.user_id)
            .single();
            
          if (!userError && userData) {
            brokerInfo = {
              id: userData.id || "unknown",
              name: userData.full_name || "Unknown Broker",
              email: userData.email || 'contact@example.com',
              company: userData.company_name || 'RV Park Specialists',
              avatar: userData.avatar_url,
              phone: userData.phone,
              title: userData.title || "RV Park Specialist",
              bio: userData.bio || "Specialist in recreational property sales",
              website: userData.website,
              experience: userData.experience || 5,
              totalListings: 24, // This would come from a separate query in a real app
              joinedDate: userData.created_at,
              verifiedStatus: userData.verified || true
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
            } else if (typeof supabaseListing.amenities === 'object') {
              // Handle both array and object formats
              if (Array.isArray(supabaseListing.amenities)) {
                amenitiesList = supabaseListing.amenities;
              } else {
                // Convert object of {amenity: true/false} to array of string keys with true values
                amenitiesList = Object.keys(supabaseListing.amenities).filter(
                  key => supabaseListing.amenities[key] === true
                );
              }
            }
          } catch (e) {
            console.error("Failed to parse amenities:", e);
          }
        }
        
        setAmenities(amenitiesList);
        
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
          amenities: amenitiesList
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if captcha is completed
    if (!captchaToken) {
      toast({
        title: "Verification required",
        description: "Please complete the captcha verification",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Save inquiry to database with captcha token
      const { data, error } = await supabase
        .from('inquiry')
        .insert([
          { 
            listing_id: Number(listing?.id), // Make sure it's a number if your ID is numeric
            name,
            email,
            phone,
            message,
            captcha_token: captchaToken, // Include captcha token in the request
            created_at: new Date().toISOString()
          }
        ]);
      
      if (error) {
        console.error('Error saving inquiry:', error);
        
        // Reset captcha if submission fails
        captchaRef.current?.resetCaptcha();
        setCaptchaToken(null);
        
        toast({
          title: "Error",
          description: "There was a problem sending your inquiry. Please try again.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      
      // Show success message
      toast({
        title: "Inquiry Sent!",
        description: `Your inquiry about ${listing?.title} has been sent. We'll contact you shortly.`,
        duration: 5000,
      });
      
      // Reset form and close modal
      setSubmitting(false);
      setName("");
      setEmail("");
      setPhone("");
      setContactModalOpen(false);
      
    } catch (err) {
      console.error('Exception in handleSubmit:', err);
      
      // Reset captcha on error
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
      
      toast({
        title: "Error",
        description: "There was a problem sending your inquiry. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };
  
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

  // UPDATED: Secure document download handler
  const handleDownload = async (doc: DocumentData) => {
    // Show loading toast
    toast({
      title: "Preparing download...",
      description: `Getting ${doc.name} ready`
    });
    
    try {
      // Check if this is a Supabase document with storage path
      if (doc.storagePath) {
        // Use the secure document download function
        await secureDocumentDownload(
          doc.storagePath,
          doc.storageBucket || 'listing-documents',
          doc.name,
          () => {
            toast({
              title: "Download Started",
              description: `Downloading ${doc.name}`
            });
          },
          (error) => {
            toast({
              variant: "destructive",
              title: "Download Failed",
              description: error.message || "Could not download the file"
            });
          }
        );
      } 
      // For legacy documents
      else if (doc.url) {
        if (doc.url.includes('supabase.co/storage/v1/object/public/')) {
          // Extract path and bucket from URL
          const urlParts = doc.url.split('/storage/v1/object/public/');
          if (urlParts.length !== 2) throw new Error("Invalid storage URL");
          
          const [bucketWithPath] = urlParts[1].split('?', 1);
          const [bucket, ...pathParts] = bucketWithPath.split('/');
          const path = pathParts.join('/');
          
          // Use secure download
          await secureDocumentDownload(
            path,
            bucket,
            doc.name
          );
          
          toast({
            title: "Download Started",
            description: `Downloading ${doc.name}`
          });
        } else {
          // For local files or external URLs without Supabase domain
          const link = document.createElement('a');
          link.href = doc.url;
          link.download = doc.name;
          link.target = "_blank"; // Open in new tab to avoid navigation
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Download Started",
            description: `Downloading ${doc.name}`
          });
        }
      } else {
        throw new Error("Document has no URL or storage path");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not download the document"
      });
    }
  };

  // Helper function for document icon and color
  const getDocumentIconAndColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return { icon: <FileText className="h-6 w-6" />, bg: "bg-red-100 text-red-600" };
      case 'excel':
        return { icon: <FileText className="h-6 w-6" />, bg: "bg-green-100 text-green-600" };
      case 'word':
        return { icon: <FileText className="h-6 w-6" />, bg: "bg-blue-100 text-blue-600" };
      case 'powerpoint':
        return { icon: <FileText className="h-6 w-6" />, bg: "bg-orange-100 text-orange-600" };
      case 'image':
        return { icon: <FileText className="h-6 w-6" />, bg: "bg-purple-100 text-purple-600" };
      default:
        return { icon: <FileText className="h-6 w-6" />, bg: "bg-gray-100 text-gray-600" };
    }
  };
  
  // Helper function to format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
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
      
      {/* Contact Form Modal - UPDATED WITH HCAPTCHA */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl">Interested in this property?</DialogTitle>
            <DialogDescription>
              Fill out the form below and we'll send you more information about {listing.title}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-white">
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div className="relative">
                <Input
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 bg-gray-50 border-gray-200 focus:border-[#f74f4f] focus:ring-[#f74f4f]/10"
                  required
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-gray-50 border-gray-200 focus:border-[#f74f4f] focus:ring-[#f74f4f]/10"
                  required
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              
              <div className="relative">
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9 bg-gray-50 border-gray-200 focus:border-[#f74f4f] focus:ring-[#f74f4f]/10"
                  required
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              
              <div className="relative">
                <Textarea
                  placeholder="Your Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="pl-9 pt-3 bg-gray-50 border-gray-200 focus:border-[#f74f4f] focus:ring-[#f74f4f]/10"
                  required
                />
                <MessageSquare className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              </div>
              
              {/* hCaptcha Component */}
              <div className="flex justify-center py-2">
                <HCaptcha
                  ref={captchaRef}
                  sitekey={HCAPTCHA_SITE_KEY}
                  onVerify={handleVerificationSuccess}
                  onError={handleCaptchaError}
                  onExpire={() => setCaptchaToken(null)}
                  size="normal"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-[#f74f4f] hover:bg-[#e43c3c] text-white"
                size="lg"
                disabled={submitting || !captchaToken}
              >
                {submitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Inquiry
                  </>
                )}
              </Button>
              
              <div className="text-xs text-center text-gray-500 flex items-center justify-center">
                <Lock className="h-3 w-3 mr-1 text-gray-400" />
                By sending, you agree to our <a href="#" className="mx-1 text-[#f74f4f] hover:underline">Privacy Policy</a>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Breadcrumb */}
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
                {/* Added status badge */}
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Active
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

            {/* Files Section with direct database integration */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold">Property Documents</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Download these files for more information about the property
                </p>
              </div>
              <div className="p-6">
                {loadingDocuments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 text-gray-300 animate-spin mr-3" />
                    <p className="text-gray-500">Loading documents...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {/* Check for documents */}
                    {documents && documents.length > 0 ? (
                      documents.map((doc) => {
                        const { icon, bg } = getDocumentIconAndColor(doc.type);
                        return (
                          <div 
                            key={doc.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center">
                              <div className={cn("p-2 rounded-lg mr-4", bg)}>
                                {icon}
                              </div>
                              <div>
                                <p className="font-medium">{doc.name}</p>
                                <p className="text-xs text-gray-500">
                                  {doc.is_primary ? "Primary Document • " : ""}
                                  {formatFileSize(doc.size)}
                                </p>
                              </div>
                            </div>
                            <Button 
                              variant="outline"
                              size="sm"
                              className="text-blue-600"
                              onClick={() => handleDownload(doc)}
                            >
                              <FileDown className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        );
                      })
                    ) : (
                      // If no documents at all, show placeholder
                      <div className="text-center py-8">
                        <div className="mb-4">
                          <FileText className="h-16 w-16 mx-auto text-gray-200" />
                        </div>
                        <h3 className="text-lg font-medium mb-1">No documents available</h3>
                        <p className="text-gray-500 mb-4">
                          The broker hasn't uploaded any documents for this property yet.
                        </p>
                        <Button
                          variant="outline" 
                          onClick={() => setContactModalOpen(true)}
                          className="text-[#f74f4f]"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Request Property Documents
                        </Button>
                      </div>
                    )}
                  </div>
                )}
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

                </TabsContent>
                
                <TabsContent value="features" className="mt-0 p-6">
                  <h2 className="text-xl font-bold mb-4">Features & Amenities</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                    {amenities && amenities.length > 0 ? (
                      // Display actual amenities from database
                      amenities.map((amenity, i) => (
                        <div key={i} className="flex items-center py-2 border-b border-gray-100">
                          <div className="p-1 rounded-full bg-emerald-100 mr-3">
                            <Check className="h-4 w-4 text-emerald-600" />
                          </div>
                          <span className="text-gray-700">{amenity}</span>
                        </div>
                      ))
                    ) : (
                      // Fallback message if no amenities
                      <div className="col-span-2 py-6 text-center text-gray-500">
                        <p>No amenities information available for this property.</p>
                      </div>
                    )}
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
            {/* Simplified Broker Contact Card - Only name, phone and photo */}
            <Card className="overflow-hidden border-gray-200 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Avatar className="h-16 w-16 mr-4 border border-gray-100">
                    {listing.broker?.avatar ? (
                      <AvatarImage src={listing.broker.avatar} alt={listing.broker.name} />
                    ) : (
                      <AvatarFallback className="bg-gray-100 text-gray-500 text-lg">
                        {listing.broker?.name?.charAt(0) || 'B'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg">{listing.broker?.name || "Property Broker"}</h3>
                    {listing.broker?.phone && (
                      <a 
                        href={`tel:${listing.broker.phone}`} 
                        className="text-[#f74f4f] flex items-center mt-1"
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        {listing.broker.phone}
                      </a>
                    )}
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-[#f74f4f] hover:bg-[#e43c3c] text-white"
                  onClick={() => setContactModalOpen(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact About This Property
                </Button>
              </CardContent>
            </Card>
            
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
                <a href="https://www.roverpass.com/p/campground-reservation-software" target="_blank" rel="noopener noreferrer">
                  Learn More
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
              <h2 className="text-2xl font-bold">Similar Properties</h2>
              <Link 
                to="/listings" 
                className="text-[#f74f4f] hover:underline flex items-center"
              >
                View all listings
                <ExternalLink className="h-4 w-4 ml-1" />
              </Link>
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