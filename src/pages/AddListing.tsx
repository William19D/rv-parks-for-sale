import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, DollarSign, MapPin, Home, PercentSquare, X, Image as ImageIcon, 
         CheckSquare, Building, Map as MapIcon, Loader2, FileText } from "lucide-react";
import { states } from "@/data/mockListings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { v4 as uuidv4 } from "uuid";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HCaptcha from '@hcaptcha/react-hcaptcha';

// Fix Leaflet's default icon path issues in production
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Override default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

// hCaptcha site key from environment variables
const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001';

// Enhanced validation schema with NUMERIC CONSTRAINTS and address field added
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
  
  // New field for address
  address: z
    .string()
    .min(3, { message: "Address is required" })
    .max(200, { message: "Address must be less than 200 characters" }),
  
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
    
  // Add captcha validation field
  captchaToken: z
    .string()
    .min(1, { message: "Please complete the CAPTCHA verification" })
    .optional()
});

// Image upload interface
interface ImageUpload {
  file: File;
  preview: string;
  id: string;
  progress: number;
  uploaded?: boolean;
  path?: string;
  error?: string;
  isPrimary?: boolean; // Add flag for primary image
}

// PDF upload interface - enhanced with fields matching listing_documents schema
interface PDFUpload {
  file: File;
  id: string;
  name: string; // Match column name in listing_documents
  description?: string; // Match column name in listing_documents
  file_type: string; // Match column name in listing_documents
  file_size: number; // Match column name in listing_documents
  is_primary?: boolean; // Match column name in listing_documents
  progress: number;
  uploaded?: boolean;
  path?: string;
  error?: string;
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

// Address search component for finding location by full address
interface AddressSearchProps {
  address: string;
  city: string;
  state: string;
  onLocationFound: (lat: number, lng: number) => void;
  searchTriggered: boolean;
}

const AddressSearch: React.FC<AddressSearchProps> = ({ 
  address, city, state, onLocationFound, searchTriggered 
}) => {
  const map = useMap();
  const searchComplete = useRef(false);
  const lastSearch = useRef("");
  
  useEffect(() => {
    // Only search if address is provided and search was triggered
    const fullAddress = `${address}, ${city}, ${state}, USA`.trim();
    
    if (fullAddress && searchTriggered && !searchComplete.current && fullAddress !== lastSearch.current) {
      const searchLocation = async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`
          );
          const data = await response.json();
          
          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lon);
            
            // Set the view and update marker
            map.setView([latitude, longitude], 16);
            onLocationFound(latitude, longitude);
            searchComplete.current = true;
            lastSearch.current = fullAddress;
          }
        } catch (error) {
          console.error("Error finding address:", error);
        }
      };
      
      searchLocation();
    }
  }, [address, city, state, searchTriggered, map, onLocationFound]);
  
  // Reset search complete when address changes substantially
  useEffect(() => {
    const fullAddress = `${address}, ${city}, ${state}`.trim();
    if (fullAddress !== lastSearch.current) {
      searchComplete.current = false;
    }
  }, [address, city, state]);
  
  return null;
};

// Draggable marker component with enhanced popup and reverse geocoding
interface DraggableMarkerProps {
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
  onLocationInfoChange?: (city: string, state: string, address?: string) => void;
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
      
      // Perform reverse geocoding to get city, state, and address
      if (onLocationInfoChange) {
        reverseGeocode(position.lat, position.lng).then(({ city, state, address }) => {
          onLocationInfoChange(city, state, address);
        });
      }
    }
  };

  // Enhanced reverse geocode function to convert coordinates to address
  const reverseGeocode = async (lat: number, lng: number): Promise<{ city: string, state: string, address: string }> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      let city = '';
      let state = '';
      let address = '';
      
      if (data && data.address) {
        console.log("Geocode data:", data.address);
        
        // Get street address
        const road = data.address.road || data.address.street || '';
        const houseNumber = data.address.house_number || '';
        const suburb = data.address.suburb || data.address.neighborhood || '';
        
        // Construct address
        if (road) {
          address = houseNumber ? `${houseNumber} ${road}` : road;
          if (suburb) address += `, ${suburb}`;
        }
        
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
      
      console.log("Matched location info:", { city, state, address });
      return { city, state, address };
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
      return { city: '', state: '', address: '' };
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
          <p className="text-sm text-gray-600 mt-1">Address, city and state will update automatically.</p>
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

// FIXED: Properly check if bucket exists without trying to create it
const checkBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    // Only check if bucket exists, don't try to create it
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error(`Error checking if bucket ${bucketName} exists:`, error);
      return false;
    }
    
    // Return true if the bucket exists
    return buckets?.some(b => b.name === bucketName) || false;
  } catch (e) {
    console.error(`Error checking bucket ${bucketName}:`, e);
    return false;
  }
};

const AddListing = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [primaryImageId, setPrimaryImageId] = useState<string | null>(null);
  const [pdfs, setPdfs] = useState<PDFUpload[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, boolean>>({});
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([39.8283, -98.5795]); // USA center
  const [locationFound, setLocationFound] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [addressSearchTriggered, setAddressSearchTriggered] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  
  // Add state for captcha
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<HCaptcha | null>(null);
  
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
  
  // Check storage buckets when component mounts
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Check if required buckets exist
        const imagesBucketExists = await checkBucketExists('listing-images');
        const documentsBucketExists = await checkBucketExists('listing-documents');
        
        if (!imagesBucketExists || !documentsBucketExists) {
          console.warn("Required storage buckets don't exist. Contact administrator if needed.");
        }
      } catch (error) {
        console.error("Error checking storage buckets:", error);
      }
    };
    
    initializeStorage();
  }, []);
  
  const form = useForm<z.infer<typeof listingSchema>>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: "",
      price: "",
      description: "",
      city: "",
      state: "",
      address: "",
      numSites: "",
      occupancyRate: "",
      annualRevenue: "",
      capRate: "",
      propertyType: "",
      amenities: {},
      latitude: undefined,
      longitude: undefined,
      location_set: false,
      captchaToken: ""
    },
    mode: "onChange",
  });

  const { watch } = form;
  const city = watch('city');
  const state = watch('state');
  const address = watch('address');
  const propertyType = watch('propertyType');

  // Watch for address changes to auto-update the map
  useEffect(() => {
    const addressValue = form.getValues('address');
    const cityValue = form.getValues('city');
    const stateValue = form.getValues('state');
    
    // Check if we have enough info to try to find the location
    if (addressValue && addressValue.length > 5 && cityValue && stateValue) {
      const timeout = setTimeout(() => {
        handleAddressSearch();
      }, 1500); // Delay to avoid too many API calls while typing
      
      return () => clearTimeout(timeout);
    }
  }, [address, city, state]);

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
  const handleLocationInfoChange = (city: string, state: string, address?: string) => {
    if (city) {
      form.setValue('city', city);
    }
    
    if (state) {
      // If we get a valid state from the geocoding API, update the form
      if (states.includes(state)) {
        form.setValue('state', state);
      }
    }
    
    if (address) {
      form.setValue('address', address);
    }
  };

  // Manual location search function by city/state
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
    
    // Show searching toast
    toast({
      title: "Searching...",
      description: "Looking up the location coordinates"
    });
    
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
          description: `Found coordinates for ${currentCity}, ${currentState}`,
          variant: "default"
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

  // Enhanced address search with better feedback
  const handleAddressSearch = async () => {
    const currentAddress = form.getValues('address');
    const currentCity = form.getValues('city');
    const currentState = form.getValues('state');
    
    if (!currentAddress) {
      toast({
        variant: "destructive",
        title: "Address missing",
        description: "Please enter a street address to search"
      });
      return;
    }
    
    // Show searching toast
    toast({
      title: "Searching...",
      description: "Looking up the address coordinates"
    });
    
    try {
      // Create a search query with whatever information is available
      let query = currentAddress;
      if (currentCity) query += `, ${currentCity}`;
      if (currentState) query += `, ${currentState}`;
      query += ', USA';
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        handleLocationFound(latitude, longitude);
        setAddressSearchTriggered(prev => !prev); // Toggle to trigger address search
        
        toast({
          title: "Location found",
          description: `Found coordinates for the provided address`,
          variant: "default"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Address not found",
          description: "Could not find this address. Please check the address and try again."
        });
      }
    } catch (error) {
      console.error("Error searching address:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while searching for the address. Please try again."
      });
    }
  };
  
  // Handle hCaptcha verification
  const handleVerificationSuccess = (token: string) => {
    setCaptchaToken(token);
    form.setValue('captchaToken', token);
  };

  // File selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      // Limit to 5 images total
      if (selectedFiles.length + images.length > 5) {
        toast({
          variant: "destructive",
          title: "Too many images",
          description: "You can upload a maximum of 5 images per listing."
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
        const id = uuidv4();
        const isPrimary = images.length === 0 && primaryImageId === null;
        
        // Set as primary if it's the first image ever added
        if (isPrimary) {
          setPrimaryImageId(id);
        }
        
        return {
          file,
          preview: URL.createObjectURL(file),
          id,
          progress: 0,
          uploaded: false,
          isPrimary
        };
      });

      setImages([...images, ...newImages]);
    }
  };

  // Image removal handler
  const removeImage = (id: string) => {
    // Check if we're removing the primary image
    if (primaryImageId === id) {
      // If primary image is removed, select another one as primary if available
      const remainingImages = images.filter(img => img.id !== id);
      if (remainingImages.length > 0) {
        setPrimaryImageId(remainingImages[0].id);
        setImages(remainingImages.map((img, index) => 
          index === 0 ? { ...img, isPrimary: true } : { ...img, isPrimary: false }
        ));
      } else {
        setPrimaryImageId(null);
        setImages([]);
      }
    } else {
      // Just remove the image
      setImages(images.filter(image => image.id !== id));
    }
  };
  
  // Set an image as primary
  const setPrimaryImage = (id: string) => {
    setPrimaryImageId(id);
    
    // Update all images to reflect the new primary selection
    setImages(images.map(img => ({
      ...img,
      isPrimary: img.id === id
    })));
    
    toast({
      title: "Primary image set",
      description: "This image will be displayed as the main image for your listing.",
      duration: 2000,
    });
  };

  // Upload images to Supabase - modified to handle primary image flag
  const uploadImagesToSupabase = async (listingId: number) => {
    if (!user) {
      console.error("User not authenticated");
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "You must be logged in to upload images"
      });
      return false;
    }

    // Check if we have images to upload
    if (images.length === 0) {
      console.log("No images to upload");
      return true; // Return success because there's nothing to upload
    }

    setUploadStatus("Uploading images...");
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const imageNumber = i + 1;
      setUploadStatus(`Uploading image ${imageNumber} of ${images.length}...`);
      
      try {
        // Show start of upload in UI
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
        
        console.log(`Starting upload of image ${imageNumber}/${images.length}: ${filePath}`);
        
        // Update progress
        setImages(prevImages => 
          prevImages.map(img => 
            img.id === image.id ? { ...img, progress: 30 } : img
          )
        );
        
        // Upload to Supabase Storage - using try/catch to handle any errors
        let uploadSuccess = false;
        try {
          const { data, error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(filePath, image.file, {
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) throw uploadError;
          uploadSuccess = true;
          console.log(`Storage upload successful for image ${imageNumber}`);
        } catch (uploadError: any) {
          console.error(`Storage upload error for image ${imageNumber}:`, uploadError);
          throw new Error(`Failed to upload image: ${uploadError.message || "Unknown error"}`);
        }

        // Update progress after successful upload
        setImages(prevImages => 
          prevImages.map(img => 
            img.id === image.id ? { ...img, progress: 70, path: filePath } : img
          )
        );
        
        // Only proceed with DB update if storage upload succeeded
        if (uploadSuccess) {
          try {
            // Create database record - using isPrimary flag from the image
            const { error: dbError } = await supabase
              .from('listing_images')
              .insert([{
                listing_id: listingId,
                storage_path: filePath,
                position: i,
                is_primary: image.isPrimary || image.id === primaryImageId // Use either flag
              }]);
                
            if (dbError) throw dbError;
            console.log(`Database record created successfully for image ${imageNumber}`);
          } catch (dbError: any) {
            console.error(`Database error for image ${imageNumber}:`, dbError);
            
            // Try to delete orphaned file from storage
            try {
              await supabase.storage
                .from('listing-images')
                .remove([filePath]);
              console.log(`Removed orphaned file ${filePath} after database error`);
            } catch (removeError) {
              console.error(`Failed to remove orphaned file ${filePath}:`, removeError);
            }
            
            throw new Error(`Failed to save image info: ${dbError.message || "Database error"}`);
          }
        }
        
        // Update UI to show complete success
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
    
    // Provide appropriate feedback based on results
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
    
    return successCount > 0;
  };

  // Enhanced PDF file selection handler - fixed to match schema
  const handlePDFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      // Limit to 3 PDFs total
      if (selectedFiles.length + pdfs.length > 3) {
        toast({
          variant: "destructive",
          title: "Too many files",
          description: "You can upload a maximum of 3 PDF documents per listing."
        });
        return;
      }

      // Validate file types and sizes
      const validPDFTypes = ["application/pdf"];
      const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
      
      const validFiles = selectedFiles.filter(file => {
        if (!validPDFTypes.includes(file.type)) {
          toast({
            variant: "destructive",
            title: "Invalid file type",
            description: `${file.name} is not a PDF file. Please use PDF format only.`
          });
          return false;
        }
        
        if (file.size > maxSizeInBytes) {
          toast({
            variant: "destructive",
            title: "File too large",
            description: `${file.name} exceeds the 10MB size limit.`
          });
          return false;
        }
        
        return true;
      });

      // Create PDF objects with enhanced metadata to match schema
      const newPDFs = validFiles.map((file, index) => {
        return {
          file,
          id: uuidv4(),
          name: file.name,
          description: `Document for property listing`,
          file_type: 'application/pdf',
          file_size: file.size,
          is_primary: pdfs.length === 0 && index === 0, // First document is primary if none exist
          progress: 0,
          uploaded: false
        };
      });

      setPdfs([...pdfs, ...newPDFs]);
    }
  };

  // PDF removal handler
  const removePDF = (id: string) => {
    setPdfs(pdfs.filter(pdf => pdf.id !== id));
  };

// FIXED: Upload PDFs to work consistently like images
const uploadPDFsToSupabase = async (listingId: number) => {
  if (!user) {
    console.error("User not authenticated");
    toast({
      variant: "destructive", 
      title: "Authentication error",
      description: "You must be logged in to upload documents"
    });
    return false;
  }

  // Check if we have PDFs to upload
  if (pdfs.length === 0) {
    console.log("No PDFs to upload");
    return true;
  }

  setUploadStatus("Uploading documents...");
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < pdfs.length; i++) {
    const pdf = pdfs[i];
    const documentNumber = i + 1;
    setUploadStatus(`Uploading document ${documentNumber} of ${pdfs.length}...`);
    
    try {
      // Show upload start in UI
      setPdfs(prevPdfs => 
        prevPdfs.map(p => 
          p.id === pdf.id ? { ...p, progress: 10 } : p
        )
      );
      
      // Create a unique filename - IMPORTANT: match the folder structure used in your images
      const timestamp = Date.now();
      const uniqueId = uuidv4().substring(0, 6);
      const fileName = `document_${timestamp}_${uniqueId}.pdf`;
      
      // Use the same folder structure that works for your images
      const filePath = `${user.id}/${fileName}`;
      
      console.log(`Starting upload of PDF ${documentNumber}/${pdfs.length}: ${filePath}`);
      
      // Update progress indicator
      setPdfs(prevPdfs => 
        prevPdfs.map(p => 
          p.id === pdf.id ? { ...p, progress: 30 } : p
        )
      );
      
      // IMPORTANT: Add error logging to see what's happening
      console.log("About to upload PDF to storage:", {
        bucketName: 'listing-documents',
        filePath,
        userId: user.id
      });
      
      // Upload to Supabase Storage - EXACTLY like images but with documents bucket
      let uploadedData = null;
      try {
        const { data, error: uploadError } = await supabase.storage
          .from('listing-documents')
          .upload(filePath, pdf.file, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (uploadError) {
          console.error("Storage upload error details:", uploadError);
          throw uploadError;
        }
        
        uploadedData = data;
        console.log("PDF successfully uploaded to storage:", data);
      } catch (uploadError: any) {
        console.error("PDF upload failed with error:", uploadError);
        throw new Error(`Failed to upload document: ${uploadError.message}`);
      }
      
      // Progress update after storage upload
      setPdfs(prevPdfs => 
        prevPdfs.map(p => 
          p.id === pdf.id ? { ...p, progress: 70, path: filePath } : p
        )
      );
      
      // Create database record if storage upload succeeded
      try {
        // Match exact column names from your table
        const { error: dbError } = await supabase
          .from('listing_documents')
          .insert([{
            listing_id: listingId,
            name: pdf.name || pdf.file.name,
            description: `Document for listing #${listingId}`,
            storage_path: filePath,
            file_type: 'application/pdf',
            file_size: pdf.file.size,
            is_primary: i === 0, // First document is primary
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
          
        if (dbError) {
          console.error("Database insert error:", dbError);
          throw dbError;
        }
        
        console.log(`Database record created for PDF ${documentNumber}`);
      } catch (dbError: any) {
        console.error(`Database error for PDF ${documentNumber}:`, dbError);
        
        // Try to clean up orphaned file
        try {
          await supabase.storage
            .from('listing-documents')
            .remove([filePath]);
        } catch (removeError) {
          console.error(`Failed to remove orphaned file:`, removeError);
        }
        
        throw new Error(`Database error: ${dbError.message}`);
      }
      
      // Success update
      setPdfs(prevPdfs => 
        prevPdfs.map(p => 
          p.id === pdf.id ? { 
            ...p, 
            progress: 100, 
            uploaded: true,
            path: filePath
          } : p
        )
      );
      
      successCount++;
      
    } catch (error: any) {
      errorCount++;
      console.error(`Error processing PDF ${documentNumber}:`, error);
      
      setPdfs(prevPdfs => 
        prevPdfs.map(p => 
          p.id === pdf.id ? { 
            ...p, 
            progress: 0, 
            error: error.message || "Upload failed" 
          } : p
        )
      );
    }
  }
  
  setUploadStatus(null);
  
  // Provide feedback
  if (errorCount > 0) {
    if (successCount > 0) {
      toast({
        variant: "default",
        title: `Mixed upload results`,
        description: `${successCount} documents uploaded, ${errorCount} failed.`
      });
    } else {
      toast({
        variant: "destructive",
        title: `All uploads failed`,
        description: "None of your documents could be uploaded. Please try again."
      });
    }
  } else if (successCount > 0) {
    toast({
      variant: "default", 
      title: "Documents uploaded successfully",
      description: `All ${successCount} document(s) were uploaded.`
    });
  }
  
  return successCount > 0;
};

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof listingSchema>) => {
    // Ensure user is authenticated
    if (!user || !user.id) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to create a listing."
      });
      navigate("/login"); // Redirect to login page
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
    
    // Validate captcha if provided
    if (!captchaToken && values.captchaToken) {
      toast({
        variant: "destructive",
        title: "CAPTCHA verification required",
        description: "Please complete the CAPTCHA verification before submitting."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create listing data object with number validation
      const price = parseFloat(values.price);
      const annual_revenue = parseFloat(values.annualRevenue);
      
      // Additional validation to prevent numeric overflow
      if (price >= 9999999999) {
        throw new Error("Price is too large for database. Maximum value is 9,999,999,999.99");
      }
      
      if (annual_revenue >= 9999999999) {
        throw new Error("Annual revenue is too large for database. Maximum value is 9,999,999,999.99");
      }
      
      // Explicitly set user_id from authenticated user
      const listingData = {
        title: values.title.trim(),
        price: price,
        description: values.description.trim(),
        city: values.city.trim(),
        state: values.state,
        address: values.address.trim(),
        latitude: values.latitude,
        longitude: values.longitude,
        num_sites: parseInt(values.numSites),
        occupancy_rate: parseFloat(values.occupancyRate),
        annual_revenue: annual_revenue,
        cap_rate: parseFloat(values.capRate),
        user_id: user.id, // Set the user ID from auth context
        created_at: new Date().toISOString(),
        status: 'pending',
        property_type: values.propertyType,
        amenities: values.amenities
      };
      
      console.log("Submitting listing with user ID:", user.id);
      console.log("Listing data:", listingData);
      
      // Insert into listings table
      const { data, error } = await supabase
        .from('listings')
        .insert([listingData])
        .select();
      
      if (error) {
        console.error("Error creating listing:", error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error("Listing was created but no data was returned");
      }
      
      const newListingId = data[0].id;
      console.log("Created listing with ID:", newListingId);
      
      // Upload images if listing was created and there are images to upload
      if (images.length > 0) {
        try {
          console.log(`Uploading ${images.length} images for listing ${newListingId}...`);
          const uploadSuccess = await uploadImagesToSupabase(newListingId);
          
          if (!uploadSuccess && images.length > 0) {
            toast({
              variant: "default",
              title: "⚠️ Listing created with issues",
              description: "Your listing was created, but there were problems with some images."
            });
          }
        } catch (uploadError) {
          console.error("Error in image upload process:", uploadError);
          toast({
            variant: "destructive",
            title: "Image upload error",
            description: "Your listing was created, but we couldn't upload your images."
          });
        }
      }
      
      // Upload PDFs if there are any
      if (pdfs.length > 0) {
        try {
          console.log(`Uploading ${pdfs.length} documents for listing ${newListingId}...`);
          const uploadSuccess = await uploadPDFsToSupabase(newListingId);
          
          if (!uploadSuccess && pdfs.length > 0) {
            toast({
              variant: "default",
              title: "⚠️ Document upload issues",
              description: "Your listing was created, but there were problems with some documents."
            });
          }
        } catch (uploadError) {
          console.error("Error in PDF upload process:", uploadError);
          toast({
            variant: "destructive",
            title: "Document upload error",
            description: "Your listing was created, but we couldn't upload your documents."
          });
        }
      }
      
      // Success message
      toast({
        title: "Listing submitted successfully",
        description: "Your property has been added to our listings and is pending review.",
      });
      
      // Reset captcha if used
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
      
      // Redirect to broker dashboard
      setTimeout(() => {
        navigate("/broker/dashboard");
      }, 1500);
      
    } catch (error: any) {
      console.error("Error submitting listing:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "There was a problem submitting your listing. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
      setUploadStatus(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <HeaderSpacer />
      
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold mb-2">List Your Property</h1>
          <p className="text-gray-500 mb-6">
            Complete the form below to add your property to our listings. 
            All listings are reviewed before being published.
          </p>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                              // ADDED: Value limit for numeric field
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

                {/* Enhanced address field with improved search */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="123 Main Street" 
                            className="pl-9" 
                            {...field}
                            maxLength={200}
                            // Auto-trigger address search when user enters address and moves to next field
                            onBlur={(e) => {
                              field.onBlur();
                              if (field.value && field.value.length > 5) {
                                handleAddressSearch();
                              }
                            }}
                          />
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormDescription className="flex justify-between">
                        <span>Enter the street address of your property</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          className="px-2 py-0 h-auto text-sm text-blue-600 hover:text-blue-800"
                          onClick={handleAddressSearch}
                        >
                          Find by Address
                        </Button>
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
                      Find by City/State
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
                          <AddressSearch 
                            address={address}
                            city={city}
                            state={state}
                            onLocationFound={handleLocationFound}
                            searchTriggered={addressSearchTriggered}
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
                  <FormDescription>
                    Enter your address and click "Find by Address", or use city/state and click "Find by City/State". 
                    You can also drag the marker to adjust the location - the address, city and state will update automatically.
                  </FormDescription>
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
                          defaultValue={field.value}
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
              
              {/* Image Upload Section - Updated with primary selection */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium border-b pb-2">Property Images</h2>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">Upload Images</label>
                    <p className="text-xs text-gray-500">
                      Click "Set as Primary" to select your main listing image
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {/* Current Images */}
                    {images.map((image) => (
                      <div 
                        key={image.id} 
                        className={`relative w-24 h-24 rounded-md overflow-hidden border ${image.id === primaryImageId ? 'border-blue-500 ring-2 ring-blue-400' : 'border-gray-200'}`}
                      >
                        <img 
                          src={image.preview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        {/* Primary badge */}
                        {image.id === primaryImageId && (
                          <div className="absolute top-0 left-0 bg-blue-500 text-white px-1 py-0.5 text-xs font-medium">
                            Primary
                          </div>
                        )}
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
                        {/* Primary selection button - only show for non-primary images */}
                        {image.id !== primaryImageId && (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(image.id)}
                            className="absolute bottom-1 right-1 left-1 bg-white/90 text-blue-600 text-[10px] py-0.5 rounded hover:bg-white font-medium"
                          >
                            Set as Primary
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {/* Upload button (if less than 5 images) */}
                    {images.length < 5 && (
                      <div className="w-24 h-24 border border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                        <label htmlFor="image-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-500 hover:text-gray-700">
                          <ImageIcon className="h-6 w-6 mb-1" />
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
                  {primaryImageId && (
                    <p className="text-sm text-blue-600 mt-1">
                      ✓ Primary image selected
                    </p>
                  )}
                </div>
              </div>
              
              {/* PDF Upload Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium border-b pb-2">Property Documents</h2>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Upload Documents (PDF)</label>
                  <div className="space-y-3">
                    {/* Current PDFs */}
                    {pdfs.map((pdf) => (
                      <div 
                        key={pdf.id} 
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-md bg-gray-50"
                      >
                        <FileText className="h-8 w-8 text-red-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {pdf.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(pdf.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {pdf.progress > 0 && pdf.progress < 100 && (
                            <Progress value={pdf.progress} className="w-full h-2 mt-1" />
                          )}
                          {pdf.error && (
                            <p className="text-xs text-red-600 mt-1">{pdf.error}</p>
                          )}
                        </div>
                        <button 
                          type="button"
                          onClick={() => removePDF(pdf.id)}
                          className="bg-white/80 rounded-full p-1 hover:bg-white"
                        >
                          <X className="h-4 w-4 text-gray-700" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Upload button (if less than 3 PDFs) */}
                    {pdfs.length < 3 && (
                      <div className="border border-dashed border-gray-300 rounded-md p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                        <label htmlFor="pdf-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-500 hover:text-gray-700">
                          <FileText className="h-8 w-8 mb-2" />
                          <span className="text-sm font-medium">Add PDF Document</span>
                          <span className="text-xs text-gray-400 mt-1">Click to browse files</span>
                          <input
                            id="pdf-upload"
                            type="file"
                            accept="application/pdf"
                            multiple
                            className="hidden"
                            onChange={handlePDFChange}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload up to 3 PDF documents (property reports, financial statements, etc.). Max 10MB per file.
                  </p>
                </div>
              </div>
              
              {/* hCaptcha verification */}
              <div className="space-y-4 pt-4 border-t mt-4">
                <FormField
                  control={form.control}
                  name="captchaToken"
                  render={() => (
                    <FormItem>
                      <FormLabel>Security Verification</FormLabel>
                      <FormControl>
                        <div className="flex justify-center py-2">
                          <HCaptcha
                            sitekey={HCAPTCHA_SITE_KEY}
                            onVerify={handleVerificationSuccess}
                            ref={captchaRef}
                            onLoad={() => {
                              // Auto-verify in development mode to bypass localhost warning
                              if (process.env.NODE_ENV === 'development') {
                                setTimeout(() => {
                                  const mockToken = "dev-mode-captcha-token-" + Date.now();
                                  handleVerificationSuccess(mockToken);
                                  console.log("Auto-verified captcha in development mode");
                                }, 1000);
                              }
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Please complete the CAPTCHA verification to submit your listing

                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                      {uploadStatus || "Submitting..."}
                    </div>
                  ) : "Submit Listing"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
      
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default AddListing;
