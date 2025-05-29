import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Listing } from "@/data/mockListings";
import { Phone, Mail, Send, User, MessageSquare, Lock } from "lucide-react";

interface ContactFormProps {
  listing: Listing;
  className?: string; // Added to allow custom styling from parent
}

export const ContactForm = ({ listing, className }: ContactFormProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(`I'm interested in ${listing.title}. Please send me more information.`);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Inquiry Sent!",
        description: `Your message has been sent to ${listing.broker.name}. They will contact you shortly.`,
        duration: 5000,
        variant: "default",
      });
      
      setLoading(false);
      // Reset form fields except message
      setName("");
      setEmail("");
      setPhone("");
    }, 1000);
  };
  
  return (
    <Card className={`border-0 shadow-sm overflow-hidden ${className}`}>
      <div className="bg-white">
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="relative">
            <Input
              placeholder="Full Name"
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
          
          <Button 
            type="submit" 
            className="w-full bg-[#f74f4f] hover:bg-[#e43c3c] text-white"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
          
          <div className="text-xs text-center text-gray-500 flex items-center justify-center">
            <Lock className="h-3 w-3 mr-1 text-gray-400" />
            By sending, you agree to our <a href="#" className="mx-1 text-[#f74f4f] hover:underline">Privacy Policy</a>
          </div>
        </form>
        
        <div className="border-t border-gray-100 bg-gray-50 p-6">
          <div className="mb-4">
            <h4 className="font-medium text-gray-900">{listing.broker.name}</h4>
            <p className="text-sm text-gray-500">{listing.broker.company}</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <Phone className="h-4 w-4 text-[#f74f4f] mr-2" />
              <a href={`tel:${listing.broker.phone}`} className="text-gray-700 hover:text-[#f74f4f]">
                {listing.broker.phone}
              </a>
            </div>
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-[#f74f4f] mr-2" />
              <a href={`mailto:${listing.broker.email}`} className="text-gray-700 hover:text-[#f74f4f]">
                {listing.broker.email}
              </a>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};