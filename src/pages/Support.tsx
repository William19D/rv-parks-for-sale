import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, MessageSquare, Mail, HelpCircle, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

// Define topics for the dropdown
const supportTopics = [
  { value: "account", label: "Account Issues" },
  { value: "listing", label: "Listing Problems" },
  { value: "payment", label: "Payment Questions" },
  { value: "suggestion", label: "Feature Suggestions" },
  { value: "bug", label: "Bug Reports" },
  { value: "other", label: "Other" },
];

// Define FAQs for the Support page
const faqs = [
  {
    question: "How do I create a listing?",
    answer: "To create a listing, sign in to your account and click on 'Add Listing' in the navigation menu. Follow the step-by-step form to complete your listing information."
  },
  {
    question: "How long will my listing remain active?",
    answer: "Listings remain active for 6 months by default. You can renew or update your listing at any time through your broker dashboard."
  },
  {
    question: "Can I edit my listing after publishing?",
    answer: "Yes, you can update your listings at any time through your broker dashboard. All changes will be published immediately."
  },
  {
    question: "How do I contact a seller?",
    answer: "On each listing page, you'll find a contact form that allows you to send a message directly to the property seller or broker."
  },
];

const Support = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Form states
  const [name, setName] = useState(user ? `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() : "");
  const [email, setEmail] = useState(user?.email || "");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Expanded FAQ state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }
    
    if (!email.trim() || !email.includes('@')) {
      toast({
        title: "Valid email is required",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    if (!topic) {
      toast({
        title: "Topic is required",
        description: "Please select a topic for your message",
        variant: "destructive",
      });
      return;
    }
    
    if (!message.trim() || message.length < 10) {
      toast({
        title: "Message is too short",
        description: "Please provide more details in your message (at least 10 characters)",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create a support ticket in Supabase
      const { error } = await supabase
        .from('support_tickets')
        .insert([
          { 
            name,
            email,
            topic,
            message,
            user_id: user?.id || null,
            status: 'new'
          },
        ]);
      
      if (error) throw error;
      
      // Show success message
      toast({
        title: "Message sent successfully",
        description: "We'll get back to you as soon as possible",
      });
      
      // Reset form after successful submission
      if (!user) {
        setName("");
        setEmail("");
      }
      setTopic("");
      setMessage("");
      
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      toast({
        title: "Failed to send message",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Main content area */}
            <div className="flex-1">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Support Center</h1>
                <p className="text-muted-foreground">
                  Need help? Get in touch with our support team or browse common questions.
                </p>
              </div>
              
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Contact Support</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input 
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your name"
                          disabled={isSubmitting || !!user}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          disabled={isSubmitting || !!user}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="topic">Topic</Label>
                      <Select value={topic} onValueChange={setTopic} disabled={isSubmitting}>
                        <SelectTrigger id="topic">
                          <SelectValue placeholder="Select a topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {supportTopics.map((topic) => (
                            <SelectItem key={topic.value} value={topic.value}>
                              {topic.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Your Message</Label>
                      <Textarea 
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please describe your issue or question in detail"
                        rows={6}
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-[#f74f4f] hover:bg-[#e43c3c]"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              
              {/* FAQ Section */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2 text-[#f74f4f]" />
                  Frequently Asked Questions
                </h2>
                
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <div 
                      key={index}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <button
                        className={`w-full flex justify-between items-center p-4 text-left transition-colors ${
                          expandedFaq === index ? 'bg-[#f74f4f]/5' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => toggleFaq(index)}
                      >
                        <span className={`font-medium ${expandedFaq === index ? 'text-[#f74f4f]' : ''}`}>
                          {faq.question}
                        </span>
                        <ChevronRight
                          className={`h-5 w-5 transition-transform ${
                            expandedFaq === index ? "transform rotate-90 text-[#f74f4f]" : "text-gray-400"
                          }`}
                        />
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          expandedFaq === index ? "max-h-40" : "max-h-0"
                        }`}
                      >
                        <div className="p-4 bg-gray-50 text-muted-foreground">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <Link 
                    to="/listings"
                    className="text-[#f74f4f] font-medium hover:underline inline-flex items-center"
                  >
                    Browse all listings
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Sidebar with contact info and resources */}
            <div className="w-full md:w-80">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 mr-3 text-[#f74f4f] mt-0.5" />
                      <div>
                        <p className="font-medium">Email Support</p>
                        <a 
                          href="mailto:support@roverpass.com" 
                          className="text-sm text-[#f74f4f] hover:underline"
                        >
                          support@roverpass.com
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <MessageSquare className="h-5 w-5 mr-3 text-[#f74f4f] mt-0.5" />
                      <div>
                        <p className="font-medium">Live Chat</p>
                        <p className="text-sm text-muted-foreground">
                          Available Monday to Friday<br />
                          9:00 AM - 5:00 PM (CST)
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Useful Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li>
                      <a 
                        href="https://www.roverpass.com/blog" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#f74f4f] hover:underline flex items-center"
                      >
                        RV Industry Blog
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </a>
                    </li>
                    <li>
                      <a 
                        href="https://www.roverpass.com/p/campground-reservation-software" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#f74f4f] hover:underline flex items-center"
                      >
                        Reservation Software
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </a>
                    </li>
                    <li>
                      <Link 
                        to="/listings" 
                        className="text-[#f74f4f] hover:underline flex items-center"
                      >
                        RV Parks For Sale
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Support;
