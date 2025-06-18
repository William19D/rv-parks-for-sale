import { useState, useRef, useEffect } from "react";
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
import { Loader2, Send, HelpCircle, ChevronRight, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import HCaptcha from '@hcaptcha/react-hcaptcha';

// Environment detection
const IS_DEV = import.meta.env.DEV === true || window.location.hostname === 'localhost';

// Get environment variables with fallbacks
const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '';

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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha | null>(null);
  
  // Expanded FAQ state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Check if hCaptcha site key is configured
  useEffect(() => {
    if (!HCAPTCHA_SITE_KEY) {
      setFormError("Security verification is not properly configured. Please contact support.");
    }
  }, []);
  
  // Clear form error when inputs change
  useEffect(() => {
    if (formError) {
      setFormError(null);
    }
  }, [email, name, topic, message, captchaToken, formError]);
  
  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  // Handle hCaptcha verification
  const handleVerificationSuccess = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaError = () => {
    setFormError("Captcha verification failed. Please try again.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormError(null);

    // Validate form
    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }
    
    if (!email.trim() || !email.includes('@')) {
      setFormError("Valid email is required");
      return;
    }
    
    if (!topic) {
      setFormError("Topic is required");
      return;
    }
    
    if (!message.trim() || message.length < 10) {
      setFormError("Please provide more details in your message (at least 10 characters)");
      return;
    }

    // Validate captcha
    if (!captchaToken) {
      setFormError("Please complete the security verification");
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
            status: 'new',
            captcha_token: captchaToken // Include captcha token
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
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
      
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      toast({
        title: "Failed to send message",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive",
      });
      
      // Reset captcha on error
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
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
          <div className="max-w-3xl mx-auto">
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
                {formError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <span className="text-red-800 text-sm">{formError}</span>
                  </div>
                )}
                
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
                        className={!name.trim() && formError ? "border-red-300" : ""}
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
                        className={(!email.trim() || !email.includes('@')) && formError ? "border-red-300" : ""}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Select value={topic} onValueChange={setTopic} disabled={isSubmitting}>
                      <SelectTrigger 
                        id="topic"
                        className={!topic && formError ? "border-red-300" : ""}
                      >
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
                      className={(!message.trim() || message.length < 10) && formError ? "border-red-300" : ""}
                    />
                  </div>
                  
                  {/* Security verification section */}
                  <div>
                    <Label className="block mb-2">Security Verification</Label>
                    <div className={`flex justify-center py-2 ${!captchaToken && formError ? "border border-red-300 rounded-md" : ""}`}>
                      {HCAPTCHA_SITE_KEY ? (
                        <HCaptcha
                          ref={captchaRef}
                          sitekey={HCAPTCHA_SITE_KEY}
                          onVerify={handleVerificationSuccess}
                          onError={handleCaptchaError}
                          onExpire={() => setCaptchaToken(null)}
                          theme="light"
                        />
                      ) : (
                        <div className="text-sm text-red-500 p-2">
                          Security verification not configured. Please contact support.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !captchaToken}
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
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Support;