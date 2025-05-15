
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ContactForm } from "@/components/listings/ContactForm";
import { useParams, Link } from "react-router-dom";
import { mockListings, Listing } from "@/data/mockListings";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, MapPin } from "lucide-react";
import { ListingCard } from "@/components/listings/ListingCard";

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const listing = mockListings.find(listing => listing.id === id);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center flex-grow">
          <h1 className="text-3xl font-bold mb-4">Listing Not Found</h1>
          <p className="mb-8">Sorry, the listing you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/listings">Browse All Listings</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Get more listings from the same broker
  const brokerListings = mockListings
    .filter(item => item.broker.id === listing.broker.id && item.id !== listing.id)
    .slice(0, 3);
    
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Link to="/listings" className="inline-flex items-center text-roverpass-purple hover:underline mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Listings
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width on desktop */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <div className="relative aspect-video">
                <img 
                  src={listing.images[activeImageIndex]} 
                  alt={listing.title} 
                  className="h-full w-full object-cover"
                />
              </div>
              
              {listing.images.length > 1 && (
                <div className="p-2 flex gap-2 overflow-x-auto">
                  {listing.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`relative w-20 h-20 rounded overflow-hidden flex-shrink-0 ${
                        index === activeImageIndex ? 'ring-2 ring-roverpass-purple' : ''
                      }`}
                    >
                      <img 
                        src={image} 
                        alt={`Image ${index + 1}`} 
                        className="h-full w-full object-cover" 
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Property Details */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
              <div className="flex items-center text-lg mb-4">
                <MapPin className="h-5 w-5 mr-1 text-roverpass-purple" />
                <span>{listing.location.city}, {listing.location.state}</span>
              </div>
              <div className="text-3xl font-bold text-roverpass-purple mb-6">
                {formatCurrency(listing.price)}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Number of Sites</div>
                  <div className="font-bold">{listing.numSites}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Occupancy Rate</div>
                  <div className="font-bold">{listing.occupancyRate}%</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Annual Revenue</div>
                  <div className="font-bold">{formatCurrency(listing.annualRevenue, 0)}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Cap Rate</div>
                  <div className="font-bold">{listing.capRate}%</div>
                </div>
              </div>
              
              <h2 className="text-xl font-bold mb-3">Description</h2>
              <p className="text-gray-600 mb-6 whitespace-pre-line">
                {listing.description}
              </p>
              
              {listing.pdfUrl && (
                <Button variant="outline" className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Download Offering Memorandum
                </Button>
              )}
            </div>
            
            {/* Location */}
            <div>
              <h2 className="text-xl font-bold mb-3">Location</h2>
              <div className="aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden">
                {/* Here you'd normally embed a Google Map */}
                <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                  <div className="text-gray-500">Map would be displayed here</div>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {listing.location.address}, {listing.location.city}, {listing.location.state}
              </p>
            </div>
            
            {/* Video if available */}
            {listing.videoUrl && (
              <div>
                <h2 className="text-xl font-bold mb-3">Property Video</h2>
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe 
                    src={listing.videoUrl}
                    title="Property Video"
                    className="h-full w-full"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar - 1/3 width on desktop */}
          <div className="space-y-6">
            <ContactForm listing={listing} />
            
            {/* Call to action for brokers */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-2">Are You a Broker?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                List your RV parks for sale on RoverPass and reach thousands of qualified buyers.
              </p>
              <Button asChild className="w-full">
                <Link to="/broker/dashboard">List Your Property</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* More listings from this broker */}
        {brokerListings.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">More Properties from this Broker</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {brokerListings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default ListingDetail;
