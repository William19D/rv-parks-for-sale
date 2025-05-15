
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BrokerStats } from "@/components/broker/BrokerStats";
import { BrokerListings } from "@/components/broker/BrokerListings";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const BrokerDashboard = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Broker Dashboard</h1>
            <p className="text-muted-foreground">Manage your RV park listings and inquiries</p>
          </div>
          <Button asChild className="mt-4 md:mt-0">
            <Link to="/broker/listings/new">Add New Listing</Link>
          </Button>
        </div>
        
        <div className="space-y-8">
          <BrokerStats />
          
          <div className="bg-white rounded-lg p-6">
            <BrokerListings />
          </div>
          
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Recent Inquiries</h2>
            
            <div className="text-center py-8">
              <div className="mb-4 text-gray-400">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">No inquiries yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                When potential buyers inquire about your listings, they will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default BrokerDashboard;
