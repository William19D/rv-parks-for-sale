
import { Listing } from "@/data/mockListings";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

interface ListingCardProps {
  listing: Listing;
}

export const ListingCard = ({ listing }: ListingCardProps) => {
  return (
    <Link to={`/listings/${listing.id}`}>
      <Card className="listing-card overflow-hidden h-full">
        <div className="relative h-48 w-full overflow-hidden">
          <img 
            src={listing.images[0]} 
            alt={listing.title} 
            className="h-full w-full object-cover"
          />
          {listing.featured && (
            <Badge className="absolute top-2 right-2 bg-roverpass-purple">
              Featured
            </Badge>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <h3 className="text-white font-bold text-lg line-clamp-1">{listing.title}</h3>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-center text-muted-foreground mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{listing.location.city}, {listing.location.state}</span>
          </div>
          
          <div className="text-xl font-bold mb-2 text-roverpass-purple">
            {formatCurrency(listing.price)}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div>
              <span className="text-muted-foreground">Sites:</span> {listing.numSites}
            </div>
            <div>
              <span className="text-muted-foreground">Occupancy:</span> {listing.occupancyRate}%
            </div>
            <div>
              <span className="text-muted-foreground">Cap Rate:</span> {listing.capRate}%
            </div>
            <div>
              <span className="text-muted-foreground">Revenue:</span> {formatCurrency(listing.annualRevenue, 0)}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {listing.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};
