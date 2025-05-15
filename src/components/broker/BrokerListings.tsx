
import { mockListings } from "@/data/mockListings";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Edit, Eye, Trash } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export const BrokerListings = () => {
  const { toast } = useToast();
  
  // Filter listings to simulate those belonging to the current broker
  const brokerListings = mockListings.filter(listing => listing.broker.id === "b1");
  
  const handleDeleteClick = (id: string) => {
    toast({
      title: "Listing Deleted",
      description: "The listing has been deleted successfully.",
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Listings</h2>
        <Button asChild>
          <Link to="/broker/listings/new">Add New Listing</Link>
        </Button>
      </div>
      
      {brokerListings.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No listings yet</h3>
          <p className="text-muted-foreground mb-4">
            Start adding your RV parks for sale to reach potential buyers.
          </p>
          <Button asChild>
            <Link to="/broker/listings/new">Create Your First Listing</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-left font-medium">Property</th>
                <th className="py-2 px-4 text-left font-medium">Price</th>
                <th className="py-2 px-4 text-left font-medium">Views</th>
                <th className="py-2 px-4 text-left font-medium">Inquiries</th>
                <th className="py-2 px-4 text-left font-medium">Status</th>
                <th className="py-2 px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {brokerListings.map((listing) => (
                <tr key={listing.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 overflow-hidden rounded">
                        <img 
                          src={listing.images[0]} 
                          alt={listing.title} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{listing.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {listing.location.city}, {listing.location.state}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {formatCurrency(listing.price)}
                  </td>
                  <td className="py-4 px-4">
                    {Math.floor(Math.random() * 500) + 50}
                  </td>
                  <td className="py-4 px-4">
                    {Math.floor(Math.random() * 20)}
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        asChild
                      >
                        <Link to={`/listings/${listing.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        asChild
                      >
                        <Link to={`/broker/listings/edit/${listing.id}`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteClick(listing.id)}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
