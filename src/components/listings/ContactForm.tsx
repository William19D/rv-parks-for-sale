
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Listing } from "@/data/mockListings";

interface ContactFormProps {
  listing: Listing;
}

export const ContactForm = ({ listing }: ContactFormProps) => {
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
      });
      
      setLoading(false);
      // Reset form fields except message
      setName("");
      setEmail("");
      setPhone("");
    }, 1000);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Contact Broker</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div>
            <Textarea
              placeholder="Your Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Message"}
          </Button>
          <div className="text-xs text-center text-muted-foreground">
            By sending, you agree to our <a href="#" className="underline hover:text-roverpass-purple">Privacy Policy</a>
          </div>
        </form>
        
        <div className="mt-6 border-t pt-4">
          <div className="mb-4">
            <h4 className="font-medium mb-1">{listing.broker.name}</h4>
            <p className="text-sm text-muted-foreground">{listing.broker.company}</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex">
              <span className="w-20 text-muted-foreground">Phone:</span>
              <a href={`tel:${listing.broker.phone}`} className="hover:text-roverpass-purple">
                {listing.broker.phone}
              </a>
            </div>
            <div className="flex">
              <span className="w-20 text-muted-foreground">Email:</span>
              <a href={`mailto:${listing.broker.email}`} className="hover:text-roverpass-purple">
                {listing.broker.email}
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
