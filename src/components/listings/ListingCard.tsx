import { useState } from "react";
import { Listing } from "@/data/mockListings";
import { formatCurrency } from "@/lib/utils"; // Removed formatDate from import
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Heart, Calendar, ChevronRight, Star, DollarSign, Users, Percent } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  listing: Listing;
  className?: string;
}

// Helper function to format dates - defined locally in the component
const formatDate = (date: Date): string => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 7) {
    return diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
  } else {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  }
};

export const ListingCard = ({ listing, className }: ListingCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Function to handle favorite toggle without navigating to the detail page
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  // Function to cycle through available images
  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
  };

  return (
    <Link to={`/listings/${listing.id}`} className="block h-full">
      <Card 
        className={cn(
          "listing-card overflow-hidden h-full border border-gray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-1 group", 
          className
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="relative h-52 w-full overflow-hidden">
          {/* Image gallery with transition */}
          <div className="relative h-full w-full">
            {listing.images.map((image, index) => (
              <motion.img 
                key={index}
                src={image} 
                alt={`${listing.title} - Image ${index + 1}`} 
                className="absolute top-0 left-0 h-full w-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: index === currentImageIndex ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              />
            ))}
            
            {/* Image navigation dots */}
            {listing.images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
                {listing.images.map((_, index) => (
                  <button 
                    key={index}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      index === currentImageIndex 
                        ? "bg-white scale-125" 
                        : "bg-white/50 hover:bg-white/80"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Next image button on hover */}
            {listing.images.length > 1 && isHovering && (
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 rounded-full p-1 transition-colors"
                onClick={nextImage}
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            )}
          </div>

          {/* Badge for featured listings */}
          {listing.featured && (
            <Badge className="absolute top-2 left-2 bg-[#f74f4f] text-white font-medium">
              <Star className="h-3 w-3 mr-1 fill-white" /> Newest
            </Badge>
          )}

          {/* Favorite button */}
          <button
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors"
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart 
              className={cn(
                "h-4 w-4 transition-colors", 
                isFavorite ? "fill-[#f74f4f] text-[#f74f4f]" : "text-gray-500"
              )} 
            />
          </button>

          {/* Creation date badge */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-white/80 text-xs text-gray-700 px-2 py-0.5 rounded-full flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(new Date(listing.createdAt))}
          </div>

          {/* Price tag */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="flex justify-between items-end p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
              <div>
                <h3 className="text-white font-bold text-lg line-clamp-1 group-hover:underline decoration-2 underline-offset-2">
                  {listing.title}
                </h3>
                <div className="flex items-center text-white/90">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  <span className="text-sm">{listing.location.city}, {listing.location.state}</span>
                </div>
              </div>
              <div className="bg-[#f74f4f] text-white px-3 py-1 rounded-lg font-bold">
                {formatCurrency(listing.price)}
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Key metrics in a more visual way */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#f74f4f]/10 flex items-center justify-center mr-2">
                <Users className="h-4 w-4 text-[#f74f4f]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Sites</p>
                <p className="font-semibold">{listing.numSites}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#f74f4f]/10 flex items-center justify-center mr-2">
                <Percent className="h-4 w-4 text-[#f74f4f]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Occupancy</p>
                <p className="font-semibold">{listing.occupancyRate}%</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#f74f4f]/10 flex items-center justify-center mr-2">
                <DollarSign className="h-4 w-4 text-[#f74f4f]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Annual Revenue</p>
                <p className="font-semibold">{formatCurrency(listing.annualRevenue, 0)}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#f74f4f]/10 flex items-center justify-center mr-2">
                <Percent className="h-4 w-4 text-[#f74f4f]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Cap Rate</p>
                <p className="font-semibold">{listing.capRate}%</p>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="relative">
            <p className="text-sm text-gray-600 line-clamp-2 group-hover:text-gray-800 transition-colors">
              {listing.description}
            </p>
            
            {/* Broker info */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {/* Broker avatar or initials */}
                  <span className="font-medium text-gray-600">{listing.broker.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div className="text-xs">
                  <p className="font-medium">{listing.broker.name}</p>
                  <p className="text-gray-500">{listing.broker.company}</p>
                </div>
              </div>
              
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-xs text-[#f74f4f] hover:text-[#f74f4f]/80 hover:bg-[#f74f4f]/5 flex items-center"
              >
                <span>View Details</span>
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};