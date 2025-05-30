import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, DollarSign, MapPin, Home, PercentSquare, X, Image as ImageIcon, 
  CheckSquare, Building, Map as MapIcon, Loader2, AlertCircle, CheckCircle, 
  XCircle, Clock, Plus, ArrowLeft
} from "lucide-react";
import { states } from "@/data/mockListings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { v4 as uuidv4 } from "uuid";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

// Enhanced validation schema with NUMERIC CONSTRAINTS added
// Adding status field for admins to use
const listingSchema = z.object({
  title: z
    .string()
    .min(5, { message: "Title must be at least 5 characters" })
    .max(100, { message: "Title must be less than 100 characters" }),
  
  price: z
    .string()
    .refine(val => /^\d+(\.\d{1,2})?$/.test(val), { 
      message: "Price must be a valid number (e.g. 100000 or 100000.50)" 
    })
    .refine(val => Number(val) > 0, { 
      message: "Price must be greater than zero" 
    })
    .refine(val => Number(val) < 9999999999, {  // Added constraint
      message: "Price must be less than 10 billion"
    }),
  
  description: z
    .string()
    .min(20, { message: "Description must be at least 20 characters" })
    .max(2000, { message: "Description must be less than 2000 characters" }),
  
  city: z
    .string()
    .min(2, { message: "City is required" })
    .max(50, { message: "City name is too long" })
    .refine(val => /^[A-Za-z\s\-'.]+$/.test(val), { 
      message: "City must contain only letters, spaces, hyphens, apostrophes, and periods" 
    }),
  
  state: z
    .string()
    .min(2, { message: "State is required" }),
  
  numSites: z
    .string()
    .refine(val => /^\d+$/.test(val), { 
      message: "Number of sites must be a whole number" 
    })
    .refine(val => Number(val) > 0, { 
      message: "Number of sites must be greater than zero" 
    })
    .refine(val => Number(val) < 1000000, {  // Added constraint
      message: "Number of sites must be realistic (less than 1 million)"
    }),
  
  occupancyRate: z
    .string()
    .refine(val => /^\d+(\.\d{1,2})?$/.test(val), { 
      message: "Occupancy rate must be a valid number (e.g. 75 or 75.5)" 
    })
    .refine(val => Number(val) >= 0 && Number(val) <= 100, { 
      message: "Occupancy rate must be between 0-100%" 
    }),
  
  annualRevenue: z
    .string()
    .refine(val => /^\d+(\.\d{1,2})?$/.test(val), { 
      message: "Annual revenue must be a valid number (e.g. 250000 or 250000.50)" 
    })
    .refine(val => Number(val) >= 0, { 
      message: "Annual revenue must be a positive number" 
    })
    .refine(val => Number(val) < 9999999999, {  // Added constraint
      message: "Annual revenue must be less than 10 billion"
    }),
  
  capRate: z
    .string()
    .refine(val => /^\d+(\.\d{1,2})?$/.test(val), { 
      message: "Cap rate must be a valid number (e.g. 8.5 or 10)" 
    })
    .refine(val => Number(val) >= 0 && Number(val) <= 100, { 
      message: "Cap rate must be between 0-100%" 
    }),
  
  // Property type and amenities
  propertyType: z
    .string()
    .min(1, { message: "Property type is required" }),
  
  amenities: z
    .record(z.boolean())
    .default({}),
    
  // Map location fields
  latitude: z
    .number()
    .min(-90, { message: "Latitude must be between -90 and 90" })
    .max(90, { message: "Latitude must be between -90 and 90" })
    .optional(),
    
  longitude: z
    .number()
    .min(-180, { message: "Longitude must be between -180 and 180" })
    .max(180, { message: "Longitude must be between -180 and 180" })
    .optional(),
    
  location_set: z
    .boolean()
    .optional(),
    
  // Status field for admins
  status: z
    .enum(["pending", "approved", "rejected"])
    .default("pending"),
});

// Image interfaces
interface ImageUpload {
  file: File;
  preview: string;
  id: string;
  progress: number;
  uploaded?: boolean;
  path?: string;
  error?: string;
}

interface ExistingImage {
  id: string;
  storage_path: string;
  position: number;
  is_primary: boolean;
  url?: string; // URL for display
}

const propertyTypes = [
  "RV Park",
  "Campground",
  "Mobile Home Park",
  "Resort",
  "Marina",
  "Mixed-Use"
];

const amenitiesList = [
  "Waterfront",
  "Pool",
  "Clubhouse",
  "WiFi",
  "Pet Friendly",
  "Laundry",
  "Playground",
  "Boat Ramp",
  "Fishing",
  "Hiking Trails",
  "Store/Shop",
  "Restaurant",
  "Full Hookups",
  "Bathhouse",
  "Recreation Hall"
];

// State abbreviations mapping to support better state matching
const stateAbbreviations: Record<string, string> = {
  "AL": "Alabama",
  "AK": "Alaska",
  "AZ": "Arizona",
  "AR": "Arkansas",
  "CA": "California",
  "CO": "Colorado",
  "CT": "Connecticut",
  "DE": "Delaware",
  "FL": "Florida",
  "GA": "Georgia",
  "HI": "Hawaii",
  "ID": "Idaho",
  "IL": "Illinois",
  "IN": "Indiana",
  "IA": "Iowa",
  "KS": "Kansas",
  "KY": "Kentucky",
  "LA": "Louisiana",
  "ME": "Maine",
  "MD": "Maryland",
  "MA": "Massachusetts",
  "MI": "Michigan",
  "MN": "Minnesota",
  "MS": "Mississippi",
  "MO": "Missouri",
  "MT": "Montana",
  "NE": "Nebraska",
  "NV": "Nevada",
  "NH": "New Hampshire",
  "NJ": "New Jersey",
  "NM": "New Mexico",
  "NY": "New York",
  "NC": "North Carolina",
  "ND": "North Dakota",
  "OH": "Ohio",
  "OK": "Oklahoma",
  "OR": "Oregon",
  "PA": "Pennsylvania",
  "RI": "Rhode Island",
  "SC": "South Carolina",
  "SD": "South Dakota",
  "TN": "Tennessee",
  "TX": "Texas",
  "UT": "Utah",
  "VT": "Vermont",
  "VA": "Virginia",
  "WA": "Washington",
  "WV": "West Virginia",
  "WI": "Wisconsin",
  "WY": "Wyoming",
  "DC": "District of Columbia"
};

// Generate reverse mapping
const stateToAbbreviation: Record<string, string> = {};
Object.entries(stateAbbreviations).forEach(([abbr, name]) => {
  stateToAbbreviation[name.toLowerCase()] = abbr;
});

// Draggable marker component with enhanced popup and reverse geocoding
interface DraggableMarkerProps {
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
  onLocationInfoChange?: (city: string, state: string) => void;
  propertyType?: string;
}

const DraggableMarker: React.FC<DraggableMarkerProps> = ({ 
  position, 
  onPositionChange, 
  onLocationInfoChange, 
  propertyType = "property" 
}) => {
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(position);
  
  const eventHandlers = {
    dragend(e: any) {
      const marker = e.target;
      const position = marker.getLatLng();
      setMarkerPosition([position.lat, position.lng]);
      onPositionChange(position.lat, position.lng);
      
      // Perform reverse geocoding to get city and state
      if (onLocationInfoChange) {
        reverseGeocode(position.lat, position.lng).then(({ city, state }) => {
          if (city && state) {
            onLocationInfoChange(city, state);
          }
        });
      }
    }
  };

  // Enhanced reverse geocode function to convert coordinates to address
  const reverseGeocode = async (lat: number, lng: number): Promise<{ city: string, state: string }> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      let city = '';
      let state = '';
      
      if (data && data.address) {
        console.log("Geocode data:", data.address);
        
        // Try to get city (may be labeled differently based on region)
        city = data.address.city || 
               data.address.town || 
               data.address.village || 
               data.address.hamlet ||
               '';
        
        // Get state - First try to match the standard field names
        state = data.address.state || data.address.province || '';

        // Check if state is an abbreviation or has abbreviation
        let stateValue = '';
        
        // Try to match by full state name
        if (state) {
          // Check if we got a full state name that's in our list
          const matchedState = states.find(s => 
            s.toLowerCase() === state.toLowerCase() || 
            state.toLowerCase().includes(s.toLowerCase())
          );
          
          if (matchedState) {
            stateValue = matchedState;
          } 
          // Try to match by abbreviation
          else {
            const stateAbbr = state.length === 2 ? state.toUpperCase() : '';
            if (stateAbbr && stateAbbreviations[stateAbbr]) {
              stateValue = stateAbbreviations[stateAbbr];
            } else {
              // Try to find the state by matching the beginning of the state name
              for (const s of states) {
                if (state.toLowerCase().startsWith(s.toLowerCase()) || 
                    s.toLowerCase().startsWith(state.toLowerCase())) {
                  stateValue = s;
                  break;
                }
              }
            }
          }
        }
        
        // If we found a valid state in our list, use it
        if (states.includes(stateValue)) {
          state = stateValue;
        } 
        // Otherwise, try to extract from the display_name as last resort
        else if (data.display_name) {
          const nameParts = data.display_name.split(', ');
          // Usually the state is near the end of the display name
          for (let i = nameParts.length - 3; i >= 0; i--) {
            const part = nameParts[i];
            for (const s of states) {
              if (part === s || part.includes(s)) {
                state = s;
                break;
              }
            }
            if (state) break;
          }
        }
      }
      
      console.log("Matched city and state:", { city, state });
      return { city, state };
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
      return { city: '', state: '' };
    }
  };

  // Update marker position when external position changes
  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  return (
    <Marker 
      position={markerPosition} 
      draggable={true}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <div className="text-center">
          <strong>Property Location</strong>
          <p className="mt-1">Drag this marker to set the exact location of your {propertyType}.</p>
          <p className="text-sm text-gray-600 mt-1">City and state will update automatically.</p>
        </div>
      </Popup>
    </Marker>
  );
};

// Location finder component - now doesn't interfere with map interaction
interface LocationFinderProps {
  city: string;
  state: string;
  onLocationFound: (lat: number, lng: number) => void;
  searchTriggered: boolean;
}

const LocationFinder: React.FC<LocationFinderProps> = ({ city, state, onLocationFound, searchTriggered }) => {
  const map = useMap();
  const searchComplete = useRef(false);
  
  useEffect(() => {
    // Only search if both city and state are provided and search was triggered
    // and we haven't already searched for this city+state combination
    if (city && state && searchTriggered && !searchComplete.current) {
      const searchLocation = async () => {
        try {
          const query = `${city}, ${state}, USA`;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
          );
          const data = await response.json();
          
          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lon);
            
            // Set the view but don't lock it
            map.setView([latitude, longitude], 13);
            onLocationFound(latitude, longitude);
            searchComplete.current = true;
          }
        } catch (error) {
          console.error("Error finding location:", error);
        }
      };
      
      searchLocation();
    }
  }, [city, state, searchTriggered, map, onLocationFound]);
  
  // Reset search complete when city or state changes
  useEffect(() => {
    searchComplete.current = false;
  }, [city, state]);
  
  return null;
};

const ListingEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  
  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, boolean>>({});
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([39.8283, -98.5795]); // USA center
  const [locationFound, setLocationFound] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [listingOwnerId, setListingOwnerId] = useState<string | null>(null);
  const [originalStatus, setOriginalStatus] = useState<string>("pending");
  
  // Status change confirmation
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
type ListingStatus = "pending" | "approved" | "rejected";
const [newStatus, setNewStatus] = useState<ListingStatus | null>(null);  
  // Setup form
  const form = useForm<z.infer<typeof listingSchema>>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: "",
      price: "",
      description: "",
      city: "",
      state: "",
      numSites: "",
      occupancyRate: "",
      annualRevenue: "",
      capRate: "",
      propertyType: "",
      amenities: {},
      latitude: undefined,
      longitude: undefined,
      location_set: false,
      status: "pending"
    },
    mode: "onChange",
  });

  const { watch, setValue } = form;
  const city = watch('city');
  const state = watch('state');
  const propertyType = watch('propertyType');
  const status = watch('status');
  
  // Fix for z-index issues with dropdowns
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .leaflet-container {
        z-index: 1 !important;
      }
      
      [data-radix-popper-content-wrapper] {
        z-index: 9999 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Check permissions and load listing data
  useEffect(() => {
    const checkPermissionsAndLoadData = async () => {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "You must be logged in to edit a listing"
        });
        navigate("/login");
        return;
      }
      
      setIsAdmin(userRole === 'ADMIN');
      
      try {
        setIsLoading(true);
        
        // Fetch the listing data
        const { data: listing, error: listingError } = await supabase
          .from('listings')
          .select('*, user_id')
          .eq('id', id)
          .single();
          
        if (listingError) {
          throw new Error(`Error fetching listing: ${listingError.message}`);
        }
        
        if (!listing) {
          throw new Error("Listing not found");
        }
        
        // Check if user has permission to edit (owner or admin)
        const isListingOwner = user.id === listing.user_id;
        setListingOwnerId(listing.user_id);
        setIsOwner(isListingOwner);
        
        if (!isListingOwner && userRole !== 'ADMIN') {
          toast({
            variant: "destructive",
            title: "Permission denied",
            description: "You don't have permission to edit this listing"
          });
          navigate("/");
          return;
        }
        
        // Store original status for comparison
        setOriginalStatus(listing.status || "pending");
        
        // Fetch listing images
        const { data: imageData, error: imageError } = await supabase
          .from('listing_images')
          .select('*')
          .eq('listing_id', id)
          .order('position');
        
        if (imageError) {
          console.error("Error fetching images:", imageError);
        }
        
        // Process images if they exist
        if (imageData && imageData.length > 0) {
          const processedImages = await Promise.all(
            imageData.map(async (img) => {
              // Get the public URL for each image
              const { data: urlData } = await supabase.storage
                .from('listing-images')
                .getPublicUrl(img.storage_path);
              
              return {
                ...img,
                url: urlData.publicUrl
              };
            })
          );
          
          setExistingImages(processedImages);
        }
        
        // Parse amenities from the JSON string or use the object directly
        let amenities = {};
        try {
          if (listing.amenities) {
            if (typeof listing.amenities === 'string') {
              amenities = JSON.parse(listing.amenities);
            } else {
              amenities = listing.amenities;
            }
          }
        } catch (e) {
          console.error("Error parsing amenities:", e);
        }
        
        // Fill the form with listing data
        form.reset({
          title: listing.title || "",
          price: listing.price?.toString() || "",
          description: listing.description || "",
          city: listing.city || "",
          state: listing.state || "",
          numSites: listing.num_sites?.toString() || "",
          occupancyRate: listing.occupancy_rate?.toString() || "",
          annualRevenue: listing.annual_revenue?.toString() || "",
          capRate: listing.cap_rate?.toString() || "",
          propertyType: listing.property_type || "",
          amenities: amenities,
          latitude: listing.latitude || undefined,
          longitude: listing.longitude || undefined,
          location_set: !!(listing.latitude && listing.longitude),
          status: listing.status || "pending"
        });
        
        // Update amenities state
        setSelectedAmenities(amenities);
        
        // Set map marker position if coordinates are available
        if (listing.latitude && listing.longitude) {
          setMarkerPosition([listing.latitude, listing.longitude]);
          setLocationFound(true);
        }
        
      } catch (error) {
        console.error("Error in initialization:", error);
        toast({
          variant: "destructive",
          title: "Error loading listing",
          description: error instanceof Error ? error.message : "An unknown error occurred"
        });
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkPermissionsAndLoadData();
  }, [id, user, userRole, navigate, toast, form]);
  
  // Number input formatting helper
  const formatNumberInput = (value: string, allowDecimal: boolean = true) => {
    if (!value) return value;
    
    if (allowDecimal) {
      value = value.replace(/[^\d.]/g, "");
      
      const parts = value.split(".");
      if (parts.length > 2) {
        value = `${parts[0]}.${parts.slice(1).join("")}`;
      }
      
      if (value.includes(".")) {
        const [whole, decimal] = value.split(".");
        value = `${whole}.${decimal.slice(0, 2)}`;
      }
    } else {
      value = value.replace(/[^\d]/g, "");
    }
    
    return value;
  };

  // Amenity selection handler
  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const updatedAmenities = { ...selectedAmenities, [amenity]: checked };
    setSelectedAmenities(updatedAmenities);
    form.setValue('amenities', updatedAmenities);
  };
  
  // Marker position change handler
  const handlePositionChange = (lat: number, lng: number) => {
    setMarkerPosition([lat, lng]);
    form.setValue('latitude', lat);
    form.setValue('longitude', lng);
    form.setValue('location_set', true);
  };
  
  // Location found handler
  const handleLocationFound = (lat: number, lng: number) => {
    setMarkerPosition([lat, lng]);
    form.setValue('latitude', lat);
    form.setValue('longitude', lng);
    setLocationFound(true);
    form.setValue('location_set', true);
  };
  
  // Handle location info change from marker drag
  const handleLocationInfoChange = (city: string, state: string) => {
    if (city) {
      form.setValue('city', city);
    }
    
    if (state) {
      // If we get a valid state from the geocoding API, update the form
      if (states.includes(state)) {
        form.setValue('state', state);
      }
    }
  };

  // Manual location search function
  const handleSearchLocation = async () => {
    const currentCity = form.getValues('city');
    const currentState = form.getValues('state');
    
    if (!currentCity || !currentState) {
      toast({
        variant: "destructive",
        title: "Location information missing",
        description: "Please enter both city and state to search for a location"
      });
      return;
    }
    
    try {
      const query = `${currentCity}, ${currentState}, USA`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        handleLocationFound(latitude, longitude);
        setSearchTriggered(prev => !prev); // Toggle to trigger a new search
        
        toast({
          title: "Location found",
          description: `Found coordinates for ${currentCity}, ${currentState}`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Location not found",
          description: "Could not find coordinates for this location. Try entering a more specific location."
        });
      }
    } catch (error) {
      console.error("Error searching location:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while searching for the location. Please try again."
      });
    }
  };

  // File selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      // Limit to 5 images total (including existing)
      if (selectedFiles.length + images.length + existingImages.length > 5) {
        toast({
          variant: "destructive",
          title: "Too many images",
          description: "You can have a maximum of 5 images per listing."
        });
        return;
      }

      // Validate file types and sizes
      const validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      
      const validFiles = selectedFiles.filter(file => {
        if (!validImageTypes.includes(file.type)) {
          toast({
            variant: "destructive",
            title: "Invalid file type",
            description: `${file.name} is not a supported image format. Please use JPG, PNG, or WebP.`
          });
          return false;
        }
        
        if (file.size > maxSizeInBytes) {
          toast({
            variant: "destructive",
            title: "File too large",
            description: `${file.name} exceeds the 5MB size limit.`
          });
          return false;
        }
        
        return true;
      });

      // Create image objects
      const newImages = validFiles.map(file => {
        return {
          file,
          preview: URL.createObjectURL(file),
          id: uuidv4(),
          progress: 0,
          uploaded: false
        };
      });

      setImages([...images, ...newImages]);
    }
  };

  // Image removal handler for new images
  const removeImage = (id: string) => {
    setImages(images.filter(image => image.id !== id));
  };
  
  // Existing image removal handler
  const handleRemoveExistingImage = (imageId: string) => {
    // Mark for deletion but keep in the list for now (will be deleted on save)
    setImagesToDelete(prev => [...prev, imageId]);
    
    // Visually remove from the array
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Upload new images
  const uploadNewImages = async (listingId: number | string) => {
    if (!user) {
      console.error("User not authenticated");
      return false;
    }

    // Check if we have images to upload
    if (images.length === 0) {
      return true; // Return success because there's nothing to upload
    }

    setUploadStatus("Uploading new images...");
    let successCount = 0;
    let errorCount = 0;
    
    // Get current position for new images
    let startPosition = existingImages.length;
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const imageNumber = i + 1;
      const position = startPosition + i;
      
      setUploadStatus(`Uploading image ${imageNumber} of ${images.length}...`);
      
      try {
        // Update UI to show progress
        setImages(prevImages => 
          prevImages.map(img => 
            img.id === image.id ? { ...img, progress: 10 } : img
          )
        );
        
        // Create a unique, clean filename with a safe path
        const fileExt = image.file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const timestamp = Date.now();
        const uniqueId = uuidv4().substring(0, 6);
        const fileName = `image_${timestamp}_${uniqueId}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        // Update progress
        setImages(prevImages => 
          prevImages.map(img => 
            img.id === image.id ? { ...img, progress: 30 } : img
          )
        );
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(filePath, image.file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;
        
        // Update progress
        setImages(prevImages => 
          prevImages.map(img => 
            img.id === image.id ? { ...img, progress: 70, path: filePath } : img
          )
        );
        
        // Create database record for the image
        const { error: dbError } = await supabase
          .from('listing_images')
          .insert([{
            listing_id: listingId,
            storage_path: filePath,
            position: position,
            is_primary: position === 0 && existingImages.length === 0 // First image is primary if no other images exist
          }]);
            
        if (dbError) throw dbError;
        
        // Update UI to show success
        setImages(prevImages => 
          prevImages.map(img => 
            img.id === image.id ? { 
              ...img, 
              progress: 100, 
              uploaded: true,
              path: filePath
            } : img
          )
        );
        
        successCount++;
        
      } catch (error: any) {
        errorCount++;
        console.error(`Error uploading image ${imageNumber}:`, error);
        
        // Show error in UI
        setImages(prevImages => 
          prevImages.map(img => 
            img.id === image.id ? { 
              ...img, 
              progress: 0, 
              error: error.message || "Upload failed" 
            } : img
          )
        );
      }
    }
    
    setUploadStatus(null);
    
    // Show toast with results
    if (errorCount > 0) {
      if (successCount > 0) {
        toast({
          variant: "default",
          title: `Mixed upload results`,
          description: `${successCount} images uploaded, ${errorCount} failed.`
        });
      } else {
        toast({
          variant: "destructive",
          title: `All uploads failed`,
          description: "None of your images could be uploaded. Please try again."
        });
      }
    } else if (successCount > 0) {
      toast({
        variant: "default", 
        title: "Images uploaded successfully",
        description: `All ${successCount} image(s) were uploaded.`
      });
    }
    
    return successCount > 0 || images.length === 0;
  };
  
  // Delete marked images
  const deleteMarkedImages = async () => {
    if (imagesToDelete.length === 0) return true;
    
    setUploadStatus("Removing deleted images...");
    
    try {
      // First get the paths of images to delete
      const { data: imageData, error: fetchError } = await supabase
        .from('listing_images')
        .select('storage_path')
        .in('id', imagesToDelete);
      
      if (fetchError) {
        throw new Error(`Error fetching image data: ${fetchError.message}`);
      }
      
      // Delete images from storage
      if (imageData && imageData.length > 0) {
        const pathsToDelete = imageData.map(img => img.storage_path);
        
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('listing-images')
          .remove(pathsToDelete);
          
        if (storageError) {
          console.error("Error deleting from storage:", storageError);
          // Continue anyway to delete the database entries
        }
      }
      
      // Delete image records from database
      const { error: deleteError } = await supabase
        .from('listing_images')
        .delete()
        .in('id', imagesToDelete);
        
      if (deleteError) {
        throw new Error(`Error deleting images: ${deleteError.message}`);
      }
      
      // Clear the list of images to delete
      setImagesToDelete([]);
      return true;
      
    } catch (error) {
      console.error("Error deleting images:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete some images. ${error instanceof Error ? error.message : ""}`
      });
      return false;
    } finally {
      setUploadStatus(null);
    }
  };
  
  // Status change handler
const handleStatusChange = (status: ListingStatus) => {
  // Only admins can change status
  if (!isAdmin) return;
  
  // If changing status, show confirmation dialog
  if (status !== originalStatus) {
    setNewStatus(status);
    setIsStatusDialogOpen(true);
  } else {
    // If setting back to original status, just update the form
    form.setValue('status', status);
  }
};

// The confirmation function
const confirmStatusChange = () => {
  if (newStatus) {
    form.setValue('status', newStatus);
    setIsStatusDialogOpen(false);
  }
}; // <-- Missing closing brace was here

// Get status badge
    const getStatusBadge = (status: string) => {
    switch (status) {
    case 'approved':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" /> Approved
        </Badge>
      );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" /> Pending Review
          </Badge>
        );
    }
  };
  
  // Form submission handler
  const onSubmit = async (values: z.infer<typeof listingSchema>) => {
    if (!user || !id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing user or listing ID"
      });
      return;
    }
    
    // Validate location selection
    if (!values.latitude || !values.longitude) {
      toast({
        variant: "destructive",
        title: "Location required",
        description: "Please select a location for your property on the map."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Parse numeric fields
      const price = parseFloat(values.price);
      const annual_revenue = parseFloat(values.annualRevenue);
      
      // Additional validation
      if (price >= 9999999999) {
        throw new Error("Price is too large. Maximum value is 9,999,999,999.99");
      }
      
      if (annual_revenue >= 9999999999) {
        throw new Error("Annual revenue is too large. Maximum value is 9,999,999,999.99");
      }
      
      // Prepare listing data
      const listingData = {
        title: values.title.trim(),
        price: price,
        description: values.description.trim(),
        city: values.city.trim(),
        state: values.state,
        latitude: values.latitude,
        longitude: values.longitude,
        num_sites: parseInt(values.numSites),
        occupancy_rate: parseFloat(values.occupancyRate),
        annual_revenue: annual_revenue,
        cap_rate: parseFloat(values.capRate),
        updated_at: new Date().toISOString(),
        property_type: values.propertyType,
        amenities: values.amenities
      };
      
      // Add status field if admin is changing it
      if (isAdmin) {
        Object.assign(listingData, { status: values.status });
      }
      
      // Update the listing
      const { error: updateError } = await supabase
        .from('listings')
        .update(listingData)
        .eq('id', id);
      
      if (updateError) {
        throw new Error(`Error updating listing: ${updateError.message}`);
      }
      
      // Handle deleted images
      await deleteMarkedImages();
      
      // Upload new images
      await uploadNewImages(id);
      
      // Show success message
      toast({
        title: "Listing updated successfully",
        description: isAdmin && originalStatus !== values.status
          ? `Listing status changed to ${values.status}.`
          : "Your property listing has been updated."
      });
      
      // Redirect based on user role
      setTimeout(() => {
        if (isAdmin) {
          navigate("/admin/listings");
        } else {
          navigate("/broker/dashboard");
        }
      }, 1500);
      
    } catch (error: any) {
      console.error("Error updating listing:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "There was a problem updating your listing. Please try again."
      });
    } finally {
      setIsSubmitting(false);
      setUploadStatus(null);
    }
  };

  // Show loading spinner while checking permissions and loading data
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-[#f74f4f]/20 border-t-[#f74f4f] rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading listing data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {isAdmin ? (
        <>
          <AdminHeader />
          <HeaderSpacer />
          <div className="flex flex-1">
            <AdminSidebar />
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-3xl mx-auto">
                <Button 
                  variant="ghost" 
                  className="mb-4" 
                  onClick={() => navigate('/admin/listings')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Listings
                </Button>
                <h1 className="text-2xl font-bold mb-4">Edit Listing</h1>
              </div>
              <EditForm />
            </div>
          </div>
        </>
      ) : (
        <>
          <Header />
          <HeaderSpacer />
          <div className="container mx-auto px-4 py-6">
            <EditForm />
          </div>
          <div className="mt-auto">
            <Footer />
          </div>
        </>
      )}
      
      {/* Status change confirmation dialog */}
      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Listing Status</AlertDialogTitle>
            <AlertDialogDescription>
              {newStatus === 'approved' 
                ? "This listing will be visible to all users after approval." 
                : newStatus === 'rejected'
                ? "This listing will be hidden from public view."
                : "This listing will require review before becoming visible again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              className={
                newStatus === 'approved' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : newStatus === 'rejected'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
  
  // Form component to avoid duplication
  function EditForm() {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Edit Listing</h2>
          {isAdmin && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Current status:</span>
              {getStatusBadge(status)}
            </div>
          )}
        </div>
        
        {/* Admin status change alert */}
        {isAdmin && originalStatus !== status && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Status change detected</AlertTitle>
            <AlertDescription className="text-blue-700">
              You are changing this listing's status from <strong>{originalStatus}</strong> to <strong>{status}</strong>. 
              This will be saved when you update the listing.
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Admin status selector */}
            {isAdmin && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-md border">
                <h3 className="font-medium text-lg">Admin Controls</h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant={status === 'approved' ? "default" : "outline"}
                    size="sm"
                    className={status === 'approved' ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => handleStatusChange('approved')}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  
                  <Button
                    type="button"
                    variant={status === 'rejected' ? "default" : "outline"}
                    size="sm"
                    className={status === 'rejected' ? "bg-red-600 hover:bg-red-700" : ""}
                    onClick={() => handleStatusChange('rejected')}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  
                  <Button
                    type="button"
                    variant={status === 'pending' ? "default" : "outline"}
                    size="sm"
                    className={status === 'pending' ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                    onClick={() => handleStatusChange('pending')}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Mark as Pending
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <h2 className="text-lg font-medium border-b pb-2">Basic Information</h2>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Listing Title</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="e.g. Scenic Mountain RV Park - 50 Sites" 
                          className="pl-9" 
                          {...field}
                          maxLength={100}
                        />
                        <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Create a descriptive title for your property
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                render={({ field: { onChange, ...restField } }) => (
                  <FormItem>
                    <FormLabel>Asking Price ($)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="1000000" 
                          className="pl-9" 
                          {...restField} 
                          onChange={(e) => {
                            const formattedValue = formatNumberInput(e.target.value, true);
                            // Value limit for numeric field
                            if (formattedValue && parseFloat(formattedValue) > 9999999999) {
                              e.target.value = "9999999999";
                            } else {
                              e.target.value = formattedValue;
                            }
                            onChange(e);
                          }}
                          inputMode="decimal"
                        />
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter the asking price for your property (max 9,999,999,999.99)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="City" 
                            className="pl-9" 
                            {...field}
                            maxLength={50}
                          />
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            {states.map((state) => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Map Location Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium flex items-center gap-2">
                    <MapIcon className="h-4 w-4 text-gray-500" />
                    Property Location
                  </h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleSearchLocation}
                  >
                    Find Location
                  </Button>
                </div>
                
                <Card>
                  <CardContent className="p-1">
                    <div className="h-[300px] w-full rounded-md overflow-hidden">
                      <MapContainer
                        center={markerPosition}
                        zoom={locationFound ? 15 : 4}
                        style={{ height: '100%', width: '100%' }}
                        doubleClickZoom={true}
                        scrollWheelZoom={true}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <DraggableMarker 
                          position={markerPosition} 
                          onPositionChange={handlePositionChange}
                          onLocationInfoChange={handleLocationInfoChange}
                          propertyType={propertyType || "RV Park"}
                        />
                        <LocationFinder 
                          city={city} 
                          state={state} 
                          onLocationFound={handleLocationFound}
                          searchTriggered={searchTriggered}
                        />
                      </MapContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex flex-wrap gap-3 text-sm items-center">
                  <div className={`px-3 py-1 rounded-full ${form.getValues('location_set') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {form.getValues('location_set') ? 'Location set' : 'Location not set'}
                  </div>
                  {form.getValues('latitude') && form.getValues('longitude') && (
                    <span className="text-gray-500">
                      Coordinates: {form.getValues('latitude')?.toFixed(6)}, {form.getValues('longitude')?.toFixed(6)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Property Type Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium border-b pb-2">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-gray-500" />
                  <span>Property Type</span>
                </div>
              </h2>
              
              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3"
                      >
                        {propertyTypes.map((type) => (
                          <FormItem key={type} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={type} id={`type-${type.toLowerCase().replace(/\s+/g, '-')}`} />
                            </FormControl>
                            <FormLabel htmlFor={`type-${type.toLowerCase().replace(/\s+/g, '-')}`} className="font-normal cursor-pointer">
                              {type}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Amenities Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium border-b pb-2">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-gray-500" />
                  <span>Features & Amenities</span>
                </div>
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6">
                {amenitiesList.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`amenity-${amenity.toLowerCase().replace(/\s+/g, '-')}`} 
                      checked={!!selectedAmenities[amenity]}
                      onCheckedChange={(checked) => 
                        handleAmenityChange(amenity, checked === true)
                      }
                      className="data-[state=checked]:bg-[#f74f4f] data-[state=checked]:border-[#f74f4f]"
                    />
                    <label 
                      htmlFor={`amenity-${amenity.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      {amenity}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-lg font-medium border-b pb-2">Business Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="numSites"
                  render={({ field: { onChange, ...restField } }) => (
                    <FormItem>
                      <FormLabel>Number of Sites</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="50" 
                          {...restField}
                          onChange={(e) => {
                            const formattedValue = formatNumberInput(e.target.value, false);
                            // Value limit for numeric field
                            if (formattedValue && parseInt(formattedValue) > 999999) {
                              e.target.value = "999999";
                            } else {
                              e.target.value = formattedValue;
                            }
                            onChange(e);
                          }}
                          inputMode="numeric"
                        />
                      </FormControl>
                      <FormDescription>
                        Number of available sites (whole numbers only)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="occupancyRate"
                  render={({ field: { onChange, ...restField } }) => (
                    <FormItem>
                      <FormLabel>Occupancy Rate (%)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="75" 
                            className="pl-9" 
                            {...restField}
                            onChange={(e) => {
                              const formattedValue = formatNumberInput(e.target.value, true);
                              // Limit to 100
                              if (formattedValue && parseFloat(formattedValue) > 100) {
                                e.target.value = "100";
                              } else {
                                e.target.value = formattedValue;
                              }
                              onChange(e);
                            }}
                            inputMode="decimal"
                            max="100"
                          />
                          <PercentSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Enter a value between 0 and 100
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="annualRevenue"
                  render={({ field: { onChange, ...restField } }) => (
                    <FormItem>
                      <FormLabel>Annual Revenue ($)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="250000" 
                            className="pl-9" 
                            {...restField}
                            onChange={(e) => {
                              const formattedValue = formatNumberInput(e.target.value, true);
                              // Value limit for numeric field
                              if (formattedValue && parseFloat(formattedValue) > 9999999999) {
                                e.target.value = "9999999999";
                              } else {
                                e.target.value = formattedValue;
                              }
                              onChange(e);
                            }}
                            inputMode="decimal"
                          />
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Enter the annual revenue (max 9,999,999,999.99)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="capRate"
                  render={({ field: { onChange, ...restField } }) => (
                    <FormItem>
                      <FormLabel>Cap Rate (%)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="8.5" 
                            className="pl-9" 
                            {...restField}
                            onChange={(e) => {
                              const formattedValue = formatNumberInput(e.target.value, true);
                              // Limit to 100
                              if (formattedValue && parseFloat(formattedValue) > 100) {
                                e.target.value = "100";
                              } else {
                                e.target.value = formattedValue;
                              }
                              onChange(e);
                            }}
                            inputMode="decimal"
                            max="100"
                          />
                                                    <PercentSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Enter a value between 0 and 100
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-lg font-medium border-b pb-2">Property Description</h2>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide a detailed description of your property..." 
                        className="min-h-[150px] resize-y"
                        {...field}
                        maxLength={2000}
                      />
                    </FormControl>
                    <FormDescription>
                      Include amenities, unique features, and selling points (min 20 characters, max 2000)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Image Upload Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium border-b pb-2">Property Images</h2>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Current Images</label>
                <div className="flex flex-wrap gap-4">
                  {/* Existing images */}
                  {existingImages.map((image) => (
                    <div 
                      key={image.id}
                      className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-200"
                    >
                      <img 
                        src={image.url} 
                        alt="Property" 
                        className="w-full h-full object-cover"
                      />
                      {image.is_primary && (
                        <div className="absolute top-1 left-1">
                          <Badge variant="secondary" className="bg-white/80 text-xs">Primary</Badge>
                        </div>
                      )}
                      <button 
                        type="button"
                        onClick={() => handleRemoveExistingImage(image.id)}
                        className="absolute top-1 right-1 bg-white/80 rounded-full p-1"
                      >
                        <X className="h-3 w-3 text-gray-700" />
                      </button>
                    </div>
                  ))}
                  
                  {/* New images being uploaded */}
                  {images.map((image) => (
                    <div 
                      key={image.id} 
                      className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-200"
                    >
                      <img 
                        src={image.preview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      {image.progress > 0 && image.progress < 100 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Progress value={image.progress} className="w-4/5 h-2" />
                        </div>
                      )}
                      {image.error && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                          <span className="text-xs text-white px-1 bg-red-500/70 rounded">Error</span>
                        </div>
                      )}
                      <button 
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute top-1 right-1 bg-white/80 rounded-full p-1"
                      >
                        <X className="h-3 w-3 text-gray-700" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Upload button (if less than 5 images total) */}
                  {existingImages.length + images.length < 5 && (
                    <div className="w-24 h-24 border border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                      <label htmlFor="image-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-500 hover:text-gray-700">
                        <Plus className="h-6 w-6 mb-1" />
                        <span className="text-xs">Add Image</span>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          multiple
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Upload up to 5 high-quality images (JPG, PNG, WebP). Max 5MB per image.
                </p>
                {imagesToDelete.length > 0 && (
                  <p className="text-sm text-red-500">
                    {imagesToDelete.length} image(s) marked for deletion. Changes will be applied when you save.
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t mt-8">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="bg-[#f74f4f] hover:bg-[#e43c3c] text-white"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadStatus || "Saving changes..."}
                  </div>
                ) : "Update Listing"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }
};

export default ListingEdit;