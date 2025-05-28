
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ListingCard } from "@/components/listings/ListingCard";
import { mockListings } from "@/data/mockListings";
import { Link } from "react-router-dom";

const Index = () => {
  // Get featured listings
  const featuredListings = mockListings.filter(listing => listing.featured);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-roverpass-purple to-roverpass-purple-light py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img 
            src="/placeholder.svg" 
            alt="RV Park Background" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Find Your Perfect RV Park Investment
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8">
              Browse exclusive listings of RV parks and campgrounds for sale across the United States.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-white text-roverpass-purple hover:bg-gray-100">
                <Link to="/listings">Browse All Listings</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                <Link to="/broker/dashboard">List Your Property</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* RoverPass Reservation System CTA */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center bg-roverpass-purple/10 px-4 py-2 rounded-full mb-6">
              <span className="text-roverpass-purple font-semibold">Powered by RoverPass</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Already Own an RV Park? Streamline Your Operations with RoverPass
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of RV park owners who trust RoverPass for their reservation management, 
              online bookings, and revenue optimization.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <a href="https://roverpass.com" target="_blank" rel="noopener noreferrer">
                  Learn About RoverPass
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="https://roverpass.com/demo" target="_blank" rel="noopener noreferrer">
                  Request Demo
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Listings Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Properties</h2>
            <Button asChild variant="outline">
              <Link to="/listings">View All</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>

      {/* RoverPass Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why RV Park Owners Choose RoverPass</h2>
            <p className="text-lg text-muted-foreground">
              Whether you're buying your first park or expanding your portfolio, RoverPass provides the tools to maximize your investment.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-roverpass-purple/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-roverpass-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Online Reservations</h3>
              <p className="text-muted-foreground">
                Accept bookings 24/7 with our user-friendly reservation system. Increase revenue with automated upsells and dynamic pricing.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-roverpass-purple/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-roverpass-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Revenue Management</h3>
              <p className="text-muted-foreground">
                Optimize your pricing with real-time analytics, occupancy forecasting, and automated revenue management tools.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-roverpass-purple/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-roverpass-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Guest Management</h3>
              <p className="text-muted-foreground">
                Streamline check-ins, manage guest communications, and build lasting relationships with automated follow-ups.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg">
              <a href="https://roverpass.com/features" target="_blank" rel="noopener noreferrer">
                Explore All Features
              </a>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Info Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why List With RoverPass?</h2>
            <p className="text-lg text-muted-foreground">
              Join hundreds of brokers who trust RoverPass to connect with qualified RV park buyers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-roverpass-purple/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-roverpass-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Maximum Exposure</h3>
              <p className="text-muted-foreground">
                Your listings are seen by thousands of qualified investors actively looking for RV park opportunities.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-roverpass-purple/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-roverpass-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Free Listings</h3>
              <p className="text-muted-foreground">
                No upfront fees or commissions. List your properties completely free of charge.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-roverpass-purple/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-roverpass-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Industry Expertise</h3>
              <p className="text-muted-foreground">
                Backed by RoverPass's deep understanding of the RV park industry and reservation management.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-roverpass-purple">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to List Your RV Park?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join our network of professional brokers and reach thousands of qualified buyers.
          </p>
          <Button asChild size="lg" className="bg-white text-roverpass-purple hover:bg-gray-100">
            <Link to="/broker/dashboard">Get Started</Link>
          </Button>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
            <p className="text-lg text-muted-foreground">
              Hear from RV park owners who transformed their operations with RoverPass
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-roverpass-purple rounded-full flex items-center justify-center text-white font-bold">
                  JS
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold">John Smith</h4>
                  <p className="text-sm text-muted-foreground">Pine Valley RV Resort, Colorado</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                "Since implementing RoverPass, our online bookings increased by 40% and we reduced our front desk workload significantly. The automated pricing helped us increase revenue during peak seasons."
              </p>
              <div className="text-sm font-semibold text-roverpass-purple">
                40% increase in online bookings
              </div>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-roverpass-purple rounded-full flex items-center justify-center text-white font-bold">
                  MR
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold">Maria Rodriguez</h4>
                  <p className="text-sm text-muted-foreground">Desert Oasis RV Park, Arizona</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                "RoverPass made it so easy for our guests to book online. The system is intuitive and the support team is fantastic. We've seen a 25% increase in direct bookings."
              </p>
              <div className="text-sm font-semibold text-roverpass-purple">
                25% increase in direct bookings
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg">
              <a href="https://roverpass.com/testimonials" target="_blank" rel="noopener noreferrer">
                Read More Success Stories
              </a>
            </Button>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">How much does it cost to list my property?</h3>
              <p className="text-muted-foreground">
                Listing your RV park on RoverPass is completely free. We don't charge any upfront fees or commissions.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Who can see my listing?</h3>
              <p className="text-muted-foreground">
                Your listing will be visible to thousands of qualified investors and buyers specifically looking for RV park opportunities.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">What is RoverPass's reservation system?</h3>
              <p className="text-muted-foreground">
                RoverPass is the leading reservation management platform for RV parks and campgrounds, helping owners streamline operations, increase bookings, and maximize revenue.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Can I edit my listing after publishing?</h3>
              <p className="text-muted-foreground">
                Yes, you can update your listings at any time through your broker dashboard. Changes will be published immediately.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
