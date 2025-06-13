import { useState, useEffect } from "react";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { 
  LifeBuoy, 
  PlusCircle, 
  Clock, 
  CheckCircle, 
  ArrowUpRight,
  Loader2,
  AlertCircle,
  FileQuestion,
  Settings,
  CreditCard
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Define support request type
interface SupportRequest {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

// Define common support categories
const supportCategories = [
  { value: "account", label: "Account Issues" },
  { value: "billing", label: "Billing Questions" },
  { value: "listing", label: "Listing Problems" },
  { value: "software", label: "Reservation Software" },
  { value: "other", label: "Other Inquiries" },
];

// Form validation schema
const formSchema = z.object({
  category: z.string().min(1, "Please select a category"),
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string()
    .min(20, "Please provide more details (minimum 20 characters)")
    .max(2000, "Description cannot exceed 2000 characters"),
});

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'in_progress':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'resolved':
        return "bg-green-100 text-green-800 border-green-200";
      case 'closed':
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'pending':
        return "Pending";
      case 'in_progress':
        return "In Progress";
      case 'resolved':
        return "Resolved";
      case 'closed':
        return "Closed";
      default:
        return status;
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
      {getStatusLabel()}
    </span>
  );
};

const Support = () => {
  const { user, status } = useAuth();
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Setup form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      title: "",
      description: "",
    },
  });

  // Load user's support requests
  useEffect(() => {
    const fetchSupportRequests = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("support_requests")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        setSupportRequests(data || []);
      } catch (error) {
        console.error("Error fetching support requests:", error);
        toast({
          title: "Failed to load support requests",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchSupportRequests();
    }
  }, [user, toast]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit a support request.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const newRequest = {
        user_id: user.id,
        title: `[${values.category}] ${values.title}`,
        description: values.description,
        status: 'pending',
      };
      
      const { data, error } = await supabase
        .from("support_requests")
        .insert([newRequest])
        .select();

      if (error) throw error;
      
      // Add the new request to the state
      if (data && data[0]) {
        setSupportRequests([data[0], ...supportRequests]);
      }
      
      // Reset the form
      form.reset();
      
      toast({
        title: "Support request submitted",
        description: "We'll get back to you as soon as possible.",
        variant: "default",
      });
      
    } catch (error) {
      console.error("Error submitting support request:", error);
      toast({
        title: "Failed to submit request",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Not logged in state
  if (status !== 'loading' && !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <HeaderSpacer />
        
        <div className="flex-grow flex items-center justify-center bg-gray-50 py-12">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Authentication Required</CardTitle>
              <CardDescription>
                Please sign in to access the support center
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <LifeBuoy className="h-20 w-20 text-gray-400 mb-6" />
              <p className="mb-6 text-center text-gray-600">
                You need to be logged in to create support requests and view your ticket history.
              </p>
              <Button 
                className="bg-[#f74f4f] hover:bg-[#e43c3c] w-full" 
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
            </CardContent>
            <CardFooter className="justify-center">
              <p className="text-sm text-gray-500">
                Don't have an account?{" "}
                <Button variant="link" className="p-0" onClick={() => navigate("/register")}>
                  Register here
                </Button>
              </p>
            </CardFooter>
          </Card>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <HeaderSpacer />
      
      <div className="flex-grow bg-gray-50">
        <div className="container mx-auto py-12 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
                <p className="text-gray-600 mt-1">
                  Get help with your account, listings, or any other questions
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => navigate("/faq")}>
                  <FileQuestion className="mr-2 h-4 w-4" />
                  View FAQ
                </Button>
                <a href="https://www.roverpass.com/p/campground-reservation-software" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Software Help
                  </Button>
                </a>
              </div>
            </div>
            
            <Tabs defaultValue="new-request" className="w-full">
              <TabsList className="mb-8 grid w-full grid-cols-2">
                <TabsTrigger value="new-request" className="text-base">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Request
                </TabsTrigger>
                <TabsTrigger value="my-requests" className="text-base">
                  <Clock className="mr-2 h-4 w-4" />
                  Request History
                </TabsTrigger>
              </TabsList>
              
              {/* New Request Tab */}
              <TabsContent value="new-request">
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Submit a Support Request</CardTitle>
                      <CardDescription>
                        Please provide details about your issue and we'll get back to you as soon as possible
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {supportCategories.map((category) => (
                                      <SelectItem 
                                        key={category.value} 
                                        value={category.value}
                                      >
                                        {category.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl>
                                  <Input placeholder="Brief summary of your issue" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Details</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Please describe your issue in detail" 
                                    className="min-h-[150px]" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="submit" 
                            className="bg-[#f74f4f] hover:bg-[#e43c3c] w-full" 
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>Submit Request</>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                  
                  {/* Help sidebar */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Common Topics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="item-1">
                            <AccordionTrigger className="text-sm">
                              How to update my listing?
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-gray-600">
                              You can update your listing by going to the Broker Dashboard and selecting the listing you want to edit.
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="item-2">
                            <AccordionTrigger className="text-sm">
                              How to contact a buyer?
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-gray-600">
                              When a buyer shows interest, you'll receive their contact information via email. You can also see all inquiries in your dashboard.
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="item-3">
                            <AccordionTrigger className="text-sm">
                              How to update payment info?
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-gray-600">
                              You can update your payment information in your Profile settings under the Billing section.
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Need Immediate Help?</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                          For urgent matters related to your listing or account:
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-2 text-gray-600" />
                            <p className="text-sm">Billing: (800) 123-4567</p>
                          </div>
                          <div className="flex items-center">
                            <LifeBuoy className="h-4 w-4 mr-2 text-gray-600" />
                            <p className="text-sm">Email: support@roverpass.com</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              {/* Request History Tab */}
              <TabsContent value="my-requests">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Support Requests</CardTitle>
                    <CardDescription>
                      View and track all your previous support requests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 text-[#f74f4f] animate-spin" />
                      </div>
                    ) : supportRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold">No Requests Found</h3>
                        <p className="text-gray-500 mt-2">
                          You haven't submitted any support requests yet
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Subject</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {supportRequests.map((request) => (
                              <TableRow key={request.id}>
                                <TableCell className="font-medium">#{request.id}</TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                  {request.title}
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={request.status} />
                                </TableCell>
                                <TableCell>
                                  {format(new Date(request.created_at), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      // Implementation for viewing request details
                                      // Could open a modal or navigate to a details page
                                      toast({
                                        title: "Request Details",
                                        description: `Viewing details for request #${request.id}`,
                                      });
                                    }}
                                  >
                                    <ArrowUpRight className="h-4 w-4" />
                                    <span className="sr-only">View details</span>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Support;