import { Header, HeaderSpacer } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BrokerStats } from "@/components/broker/BrokerStats";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle } from "lucide-react";

const BrokerDashboard = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <HeaderSpacer />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Broker Dashboard</h1>
            <p className="text-gray-500">Manage your RV park listings and inquiries</p>
          </div>
          <Button 
            asChild 
            className="mt-4 md:mt-0 bg-[#f74f4f] hover:bg-[#e43c3c] text-white flex items-center gap-2"
          >
            <Link to="/broker/listings/new">
              <Plus className="h-4 w-4" />
              Add New Listing
            </Link>
          </Button>
        </div>
        
        <div className="space-y-8">
          <BrokerStats />
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">Your Listings</h2>
            </div>
            <div className="p-6">
              {/* Importante: Asegúrate que BrokerListings NO tenga su propio Header/HeaderSpacer */}
              <div className="text-center py-8">
                <div className="mb-4 text-gray-400">
                  <MessageCircle className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium mb-2">No listings yet</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-4">
                  Start adding your RV parks and campgrounds for sale to reach potential buyers and investors.
                </p>
                <Button 
                  className="bg-[#f74f4f] hover:bg-[#e43c3c] text-white"
                  asChild
                >
                  <Link to="/broker/listings/new">
                    <Plus className="h-4 w-4 mr-1" />
                    Create Your First Listing
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-6">Recent Inquiries</h2>
            
            <div className="text-center py-8">
              <div className="mb-4 text-gray-400">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">No inquiries yet</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-4">
                When potential buyers inquire about your listings, they will appear here.
              </p>
              <Button variant="outline" asChild>
                <Link to="/listings">View Your Listings</Link>
              </Button>
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