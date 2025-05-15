
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

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
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-lg p-6 shadow-sm">
            <h1 className="text-3xl font-bold mb-6">List Your RV Park</h1>
            <p className="text-muted-foreground mb-6">
              Complete the form below to add your RV park to our listings. 
              All listings are reviewed before being published.
            </p>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listing Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Scenic Mountain RV Park - 50 Sites" {...field} />
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
                        <Input placeholder="1000000" {...field} />
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
                          <Input placeholder="City" {...field} />
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
                          <Input placeholder="State" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
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
                          <Input placeholder="75" {...field} />
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
                          <Input placeholder="250000" {...field} />
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
                          <Input placeholder="8.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide a detailed description of your property..." 
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* We'll add photo upload functionality in a future iteration */}
                <div className="bg-gray-50 p-4 rounded-md border border-dashed border-gray-300 text-center">
                  <p className="text-muted-foreground">
                    Photo upload will be available soon. In the meantime, please submit your listing 
                    and our team will contact you about adding photos.
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Listing"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AddListing;
