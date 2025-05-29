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
import { Upload, DollarSign, MapPin, Home, PercentSquare, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { states } from "@/data/mockListings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const listingSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  price: z.string().refine((val) => !isNaN(Number(val)), { message: "Price must be a number" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  city: z.string().min(2, { message: "City is required" }),
  state: z.string().min(2, { message: "State is required" }),
  numSites: z.string().refine((val) => !isNaN(Number(val)), { message: "Number of sites must be a number" }),
  occupancyRate: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, 
    { message: "Occupancy rate must be between 0-100%" }
  ),
  annualRevenue: z.string().refine((val) => !isNaN(Number(val)), { message: "Annual revenue must be a number" }),
  capRate: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, 
    { message: "Cap rate must be between 0-100%" }
  ),
});

const AddListing = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    },
  });

  const onSubmit = async (values: z.infer<typeof listingSchema>) => {
    setIsSubmitting(true);
    
    try {
      // This would typically send data to backend
      console.log("Form values:", values);
      
      // Success message
      toast({
        title: "Listing submitted successfully",
        description: "Your property has been added to our listings.",
      });
      
      // Redirect to broker dashboard
      setTimeout(() => {
        navigate("/broker/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error submitting listing:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem submitting your listing. Please try again.",
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
        <Link 
          to="/broker/dashboard" 
          className="inline-flex items-center mb-6 text-[#f74f4f] hover:underline text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        
        <div className="max-w-3xl mx-auto bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold mb-2">List Your RV Park</h1>
          <p className="text-gray-500 mb-6">
            Complete the form below to add your RV park to our listings. 
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
                          <Input placeholder="e.g. Scenic Mountain RV Park - 50 Sites" className="pl-9" {...field} />
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asking Price ($)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="1000000" className="pl-9" {...field} />
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
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
                            <Input placeholder="City" className="pl-9" {...field} />
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
              
              <div className="space-y-4">
                <h2 className="text-lg font-medium border-b pb-2">Business Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="numSites"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Sites</FormLabel>
                        <FormControl>
                          <Input placeholder="50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="occupancyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupancy Rate (%)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="75" className="pl-9" {...field} />
                            <PercentSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="annualRevenue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Revenue ($)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="250000" className="pl-9" {...field} />
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="capRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cap Rate (%)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="8.5" className="pl-9" {...field} />
                            <PercentSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </FormControl>
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
                        />
                      </FormControl>
                      <FormDescription>
                        Include amenities, unique features, and selling points
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="bg-[#f74f4f]/5 p-6 rounded-lg border border-dashed border-[#f74f4f]/30 text-center mt-8">
                <Upload className="h-8 w-8 mx-auto text-[#f74f4f]/50 mb-2" />
                <h3 className="font-medium text-gray-800 mb-1">Photo Upload Coming Soon</h3>
                <p className="text-gray-500 text-sm">
                  Photo upload will be available soon. In the meantime, please submit your listing 
                  and our team will contact you about adding photos.
                </p>
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