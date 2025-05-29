import { useState } from "react";
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
import { Upload, DollarSign, MapPin, Home, PercentSquare, X, Image as ImageIcon, CheckSquare, Building } from "lucide-react";
import { states } from "@/data/mockListings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { v4 as uuidv4 } from "uuid";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Esquema de validación mejorado con validaciones estrictas
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
    }),
  
  capRate: z
    .string()
    .refine(val => /^\d+(\.\d{1,2})?$/.test(val), { 
      message: "Cap rate must be a valid number (e.g. 8.5 or 10)" 
    })
    .refine(val => Number(val) >= 0 && Number(val) <= 100, { 
      message: "Cap rate must be between 0-100%" 
    }),
  
  // Nuevos campos para tipo de propiedad y amenidades
  propertyType: z
    .string()
    .min(1, { message: "Property type is required" }),
  
  amenities: z
    .record(z.boolean())
    .default({})
});

// Tipo para las imágenes
interface ImageUpload {
  file: File;
  preview: string;
  id: string;
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

const AddListing = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, boolean>>({});
  
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
      amenities: {}
    },
    mode: "onChange", // Validar al cambiar los campos
  });

  // Helpers para validar inputs numéricos
  const formatNumberInput = (value: string, allowDecimal: boolean = true) => {
    if (!value) return value;
    
    // Eliminar caracteres no numéricos excepto punto decimal si está permitido
    if (allowDecimal) {
      value = value.replace(/[^\d.]/g, "");
      
      // Asegurar que solo hay un punto decimal
      const parts = value.split(".");
      if (parts.length > 2) {
        value = `${parts[0]}.${parts.slice(1).join("")}`;
      }
      
      // Limitar a dos decimales
      if (value.includes(".")) {
        const [whole, decimal] = value.split(".");
        value = `${whole}.${decimal.slice(0, 2)}`;
      }
    } else {
      // Solo permitir dígitos enteros
      value = value.replace(/[^\d]/g, "");
    }
    
    return value;
  };

  // Función para manejar amenidades
  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const updatedAmenities = { ...selectedAmenities, [amenity]: checked };
    setSelectedAmenities(updatedAmenities);
    form.setValue('amenities', updatedAmenities);
  };

  // Función para manejar la selección de archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      // Limitar a 5 imágenes en total
      if (selectedFiles.length + images.length > 5) {
        toast({
          variant: "destructive",
          title: "Too many images",
          description: "You can upload a maximum of 5 images per listing."
        });
        return;
      }

      // Validar tipos de archivo y tamaños
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

      // Crear objetos para cada imagen seleccionada
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

  // Función para eliminar una imagen
  const removeImage = (id: string) => {
    setImages(images.filter(image => image.id !== id));
  };

  // Función para subir imágenes a Supabase Storage
  const uploadImagesToSupabase = async (listingId: number) => {
    const uploadedImages = [];
    
    // Para cada imagen, subirla a Supabase Storage
    for (let image of images) {
      try {
        // Crear un nombre de archivo único basado en la fecha y UUID
        const fileName = `${Date.now()}-${uuidv4().substring(0, 8)}-${image.file.name.replace(/\s+/g, '-')}`;
        const filePath = `rv-parks/${user?.id}/${fileName}`;
        
        // Actualizar el progreso de la carga
        setImages(prevImages => 
          prevImages.map(img => 
            img.id === image.id ? { ...img, progress: 20 } : img
          )
        );
        
        // Subir la imagen a Supabase Storage
        const { data, error } = await supabase.storage
          .from('listing-images')
          .upload(filePath, image.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;
        
        // Actualizar el progreso y el estado
        setImages(prevImages => 
          prevImages.map(img => 
            img.id === image.id 
              ? { ...img, progress: 100, uploaded: true, path: data.path } 
              : img
          )
        );
        
        // Insertar en la tabla listing_images
        const { data: imageData, error: imageError } = await supabase
          .from('listing_images')
          .insert({
            listing_id: listingId,
            storage_path: data.path,
            position: uploadedImages.length,  // Posición basada en el orden de subida
            is_primary: uploadedImages.length === 0  // Primera imagen es la primaria
          })
          .select();
          
        if (imageError) throw imageError;
        
        uploadedImages.push(imageData?.[0]);
        
      } catch (error: any) {
        // Manejar errores
        console.error(`Error uploading image: ${error.message}`);
        setImages(prevImages => 
          prevImages.map(img => 
            img.id === image.id 
              ? { ...img, error: error.message, progress: 0 } 
              : img
          )
        );
        
        // Mostrar mensaje de error
        toast({
          variant: "destructive",
          title: "Error uploading image",
          description: error.message
        });
      }
    }
    
    return uploadedImages.length > 0;
  };

  // Función para manejar el envío del formulario
  const onSubmit = async (values: z.infer<typeof listingSchema>) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to create a listing."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Crear el objeto de datos para la base de datos
      const listingData = {
        title: values.title.trim(),
        price: parseFloat(values.price),
        description: values.description.trim(),
        city: values.city.trim(),
        state: values.state,
        num_sites: parseInt(values.numSites),
        occupancy_rate: parseFloat(values.occupancyRate),
        annual_revenue: parseFloat(values.annualRevenue),
        cap_rate: parseFloat(values.capRate),
        user_id: user.id,
        created_at: new Date(),
        status: 'pending', // initial status (pending review)
        property_type: values.propertyType,
        amenities: values.amenities
      };
      
      // Guardar el listado en la tabla 'listings' de Supabase
      const { data, error } = await supabase
        .from('listings')
        .insert([listingData])
        .select();
      
      if (error) throw error;
      
      // Ahora subir las imágenes si hay un listado creado exitosamente
      if (data && data[0] && images.length > 0) {
        const listingId = data[0].id;
        const uploadSuccess = await uploadImagesToSupabase(listingId);
        
        if (!uploadSuccess) {
          toast({
            variant: "destructive",
            title: "Listing created but some images failed",
            description: "Your listing was created but there were issues with some images."
          });
        }
      }
      
      // Success message
      toast({
        title: "Listing submitted successfully",
        description: "Your property has been added to our listings and is pending review.",
      });
      
      // Redirect to broker dashboard después de un breve delay
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
                              e.target.value = formattedValue;
                              onChange(e);
                            }}
                            inputMode="decimal"
                          />
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Enter the asking price for your property (numbers only)
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
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
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
                              e.target.value = formattedValue;
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
                                // Limitar a 100
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
                                e.target.value = formattedValue;
                                onChange(e);
                              }}
                              inputMode="decimal"
                            />
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Enter the annual revenue (numbers only)
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
                                // Limitar a 100
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
                  <label className="block text-sm font-medium text-gray-700">Upload Images</label>
                  <div className="flex flex-wrap gap-4">
                    {/* Current Images */}
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
                        <button 
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute top-1 right-1 bg-white/80 rounded-full p-1"
                        >
                          <X className="h-3 w-3 text-gray-700" />
                        </button>
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
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t mt-8">
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="bg-[#f74f4f] hover:bg-[#e43c3c] text-white"
                >
                  {isSubmitting ? "Submitting..." : "Submit Listing"}
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