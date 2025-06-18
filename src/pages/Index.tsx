import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ListingCard } from "@/components/listings/ListingCard";
import { getFeaturedListings, Listing } from "@/data/mockListings";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowRight, ChevronDown, Calendar, BarChart3, CreditCard, 
  Users, CheckCircle2, Loader2, MapPin 
} from "lucide-react";

// Importar imágenes directamente
import backgroundImage from "@/assets/background.jpeg";
import softwareImage from "@/assets/sofware.png";

const Index = () => {
  // Estados para los listings y UI
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  // Cargar listings aprobados cuando el componente se monta
  useEffect(() => {
    const loadApprovedListings = async () => {
      setIsLoading(true);
      try {
        // Esta función ya está filtrando por status 'approved' en la API
        const approvedFeaturedListings = await getFeaturedListings();
        // Only take the last 3 listings
        setFeaturedListings(approvedFeaturedListings.slice(0, 3));
      } catch (error) {
        // No mostramos detalles del error que podrían contener información sensible
        console.error("Error loading listings");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadApprovedListings();
  }, []);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };
  
  // Array of FAQ items for easier management
  const faqItems = [
    {
      question: "How much does it cost to list my property?",
      answer: "Listing your RV park on RoverPass is completely free. We don't charge any upfront fees or commissions."
    },
    {
      question: "Who can see my listing?",
      answer: "Your listing will be visible to thousands of qualified investors and buyers specifically looking for RV park opportunities."
    },
    {
      question: "How long will my listing be active?",
      answer: "Listings remain active for 6 months and can be renewed or updated at any time through your broker dashboard."
    },
    {
      question: "Can I edit my listing after publishing?",
      answer: "Yes, you can update your listings at any time through your broker dashboard. Changes will be published immediately."
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section - Enhanced with animation */}
      <section className="relative bg-gradient-to-r from-[#f74f4f] to-[#ff7a45] py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img 
            src={backgroundImage} 
            alt="RV Park Background" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Moving background pattern */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-white rounded-full mix-blend-overlay blur-xl animate-float-slow"></div>
          <div className="absolute top-20 right-20 w-60 h-60 bg-white rounded-full mix-blend-overlay blur-xl animate-float"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-md">
              Find Your Perfect RV Park Investment
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8">
              Browse exclusive listings of RV parks and campgrounds for sale across the United States.
            </p>
            <motion.div 
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Button asChild size="lg" className="bg-white text-[#f74f4f] hover:bg-gray-100 hover:shadow-lg transition-all group">
                <Link to="/listings" className="flex items-center gap-2">
                  Browse All Listings
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-white text-[#f74f4f] hover:bg-gray-100 hover:shadow-lg transition-all group">
                <Link to="/listings/new">List Your Property</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          <ChevronDown className="h-6 w-6 text-white animate-bounce" />
        </motion.div>
      </section>
      
      {/* Featured Listings Section - Solo listings aprobados */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold relative">
              Latest Properties
              <span className="absolute -bottom-2 left-0 h-1 w-20 bg-[#f74f4f] rounded-full"></span>
            </h2>
            <Button asChild variant="outline" className="border-[#f74f4f] text-[#f74f4f] hover:bg-[#f74f4f]/5 group">
              <Link to="/listings" className="flex items-center gap-1">
                View All
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-[#f74f4f] animate-spin mb-4" />
                <p className="text-gray-500 text-lg">Loading latest properties...</p>
              </div>
            </div>
          ) : featuredListings.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {featuredListings.map((listing) => (
                <motion.div key={listing.id} variants={itemVariants}>
                  <ListingCard listing={listing} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20 bg-gray-100 rounded-lg">
              <div className="flex flex-col items-center">
                <div className="bg-gray-200 rounded-full p-4 mb-4">
                  <MapPin className="h-10 w-10 text-[#f74f4f]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Featured Properties Available</h3>
                <p className="text-gray-500 max-w-lg mx-auto">
                  We don't have any featured properties at the moment. Please check back soon or browse our other listings.
                </p>
                <Button asChild className="mt-6 bg-[#f74f4f] hover:bg-[#e43c3c]">
                  <Link to="/listings">Browse All Listings</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RV Park Reservation Software Section - NEW */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 relative inline-block">
              The Ultimate Campground Reservation Software
              <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-[#f74f4f] rounded-full"></span>
            </h2>
            <p className="text-lg text-muted-foreground mt-4">
              Take full control of your campground with our industry-leading campground reservation software. 
              Boost revenue, cut operating costs, and deliver an exceptional, seamless experience for both you and your guests.
            </p>
          </motion.div>

          {/* Split section with image and features */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
              <h3 className="text-2xl font-bold mb-6 text-[#f74f4f]">
                What's included in our Campground Management Software?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-[#f74f4f]/10 mt-1">
                    <BarChart3 className="h-5 w-5 text-[#f74f4f]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Revenue Capabilities</h4>
                    <p className="text-muted-foreground">Drive more revenue with site locks, dynamic pricing, and add-ons</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-[#f74f4f]/10 mt-1">
                    <Calendar className="h-5 w-5 text-[#f74f4f]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Long-Term Stays</h4>
                    <p className="text-muted-foreground">Manage extended bookings with recurring payments</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-[#f74f4f]/10 mt-1">
                    <CreditCard className="h-5 w-5 text-[#f74f4f]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Point of Sale</h4>
                    <p className="text-muted-foreground">Sell merchandise and extras directly to your guests</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-[#f74f4f]/10 mt-1">
                    <Users className="h-5 w-5 text-[#f74f4f]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Guest Management</h4>
                    <p className="text-muted-foreground">Track preferences and simplify the booking process</p>
                  </div>
                </div>
              </div>
              
              <Button asChild size="lg" className="mt-8 bg-[#f74f4f] hover:bg-[#e43c3c]">
                <a href="https://www.roverpass.com/p/campground-reservation-software" target="_blank" rel="noopener" className="flex items-center gap-2">
                  Learn More
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2 bg-gray-100 rounded-xl p-3 shadow-lg"
            >
              <img 
                src={softwareImage} 
                alt="RoverPass Campground Reservation Software" 
                className="w-full h-auto rounded-lg" 
              />
            </motion.div>
          </div>
          
          {/* Key benefits */}
          <motion.div
            className="bg-gray-50 rounded-2xl p-8 md:p-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-8 text-center">
              Why RV Park Owners Love Our Software
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-[#f74f4f]/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#f74f4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">Increase Revenue</h4>
                <p className="text-muted-foreground">Maximize your earnings with dynamic pricing and add-on sales</p>
              </motion.div>
              
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-[#f74f4f]/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#f74f4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">Secure Payments</h4>
                <p className="text-muted-foreground">Process payments securely with integrated payment solutions</p>
              </motion.div>
              
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-[#f74f4f]/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#f74f4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">Easy Bookings</h4>
                <p className="text-muted-foreground">Simplify the reservation process for you and your guests</p>
              </motion.div>
              
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-[#f74f4f]/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#f74f4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">Cloud-Based</h4>
                <p className="text-muted-foreground">Access your campground data anywhere, anytime, on any device</p>
              </motion.div>
            </div>
            
            <div className="mt-10 text-center">
              <a 
                href="https://www.roverpass.com/p/campground-reservation-software" 
                target="_blank" 
                rel="noopener"
                className="text-[#f74f4f] font-semibold hover:underline inline-flex items-center"
              >
                Learn more about our reservation software
                <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section for Software */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4 relative inline-block">
              What Campground Owners Are Saying
              <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-[#f74f4f] rounded-full"></span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
              See why campground owners choose RoverPass to manage their reservations
            </p>
          </motion.div>
          
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col h-full">
                <p className="italic text-gray-600 flex-grow">"RoverPass service is excellent and makes us feel that our success is really important to them. Thank You!"</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="font-semibold">Machille</p>
                  <p className="text-sm text-gray-500">Freedom Lives Ranch RV Resort</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col h-full">
                <p className="italic text-gray-600 flex-grow">"Rover Pass has made it easy to run my RV park almost virtually."</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="font-semibold">Tammy</p>
                  <p className="text-sm text-gray-500">Reel World RV Park</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col h-full">
                <p className="italic text-gray-600 flex-grow">"The Roverpass team is continually improving on the user friendliness of the software and the Customer Support team is great to work with."</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="font-semibold">Mary</p>
                  <p className="text-sm text-gray-500">Hidden Acres RV Park</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* RoverPass Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4 relative inline-block">
              Why List With RoverPass?
              <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-[#f74f4f] rounded-full"></span>
            </h2>
            <p className="text-lg text-muted-foreground mt-4">
              Join hundreds of brokers who trust RoverPass to connect with qualified RV park buyers.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={itemVariants} className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-[#f74f4f]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#f74f4f]/20 transition-colors">
                <svg className="w-6 h-6 text-[#f74f4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-[#f74f4f] transition-colors">Maximum Exposure</h3>
              <p className="text-muted-foreground">
                Your listings are seen by thousands of qualified investors actively looking for RV park opportunities.
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-[#f74f4f]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#f74f4f]/20 transition-colors">
                <svg className="w-6 h-6 text-[#f74f4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-[#f74f4f] transition-colors">Free Listings</h3>
              <p className="text-muted-foreground">
                No upfront fees or commissions. List your properties completely free of charge.
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-[#f74f4f]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#f74f4f]/20 transition-colors">
                <svg className="w-6 h-6 text-[#f74f4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-[#f74f4f] transition-colors">Powerful Tools</h3>
              <p className="text-muted-foreground">
                Backed by RoverPass's deep understanding of the RV park industry and reservation management.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* CTA Section - Modified to highlight both services */}
      <section className="py-16 bg-gradient-to-r from-[#f74f4f] to-[#ff7a45] relative overflow-hidden">
        {/* Moving background elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-xl"></div>
        
        <motion.div 
          className="container mx-auto px-4 text-center relative z-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white mb-4">RV Park Solutions for Every Need</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Whether you're buying, selling, or managing an RV park, RoverPass has industry-leading tools to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-[#f74f4f] hover:bg-gray-100 hover:shadow-lg transition-all group">
              <Link to="/listings/new" className="flex items-center gap-2">
                Sell Your RV Park
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-white text-[#f74f4f] hover:bg-gray-100 hover:shadow-lg transition-all group">
              <a href="https://www.roverpass.com/p/campground-reservation-software" target="_blank" rel="noopener" className="flex items-center gap-2">
                Get Reservation Software
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>
        </motion.div>
      </section>
      
      {/* FAQ Section - Enhanced with interactive accordion */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-center relative inline-block">
              Frequently Asked Questions
              <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-[#f74f4f] rounded-full"></span>
            </h2>
          </motion.div>
          
          <motion.div 
            className="max-w-3xl mx-auto space-y-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {faqItems.map((faq, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  className={`w-full flex justify-between items-center p-6 text-left transition-colors ${
                    expandedFaq === index ? 'bg-[#f74f4f]/5' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => toggleFaq(index)}
                >
                  <h3 className={`text-xl font-semibold ${expandedFaq === index ? 'text-[#f74f4f]' : ''}`}>
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                      expandedFaq === index ? "transform rotate-180 text-[#f74f4f]" : "text-gray-500"
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedFaq === index ? "max-h-40" : "max-h-0"
                  }`}
                >
                  <p className="p-6 text-muted-foreground">{faq.answer}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Call to action within FAQ */}
          <motion.div 
            className="mt-10 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <p className="text-lg mb-4">Still have questions?</p>
            <Button asChild variant="outline" className="border-[#f74f4f] text-[#f74f4f] hover:bg-[#f74f4f]/5">
              <Link to="/contact">Contact Our Support Team</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section - New section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4 relative inline-block">
              What Our Clients Say
              <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-[#f74f4f] rounded-full"></span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
              Discover what brokers and property owners are saying about their experience with RoverPass.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all border-t-4 border-[#f74f4f]">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-[#f74f4f]/10 flex items-center justify-center mr-4">
                  <span className="text-[#f74f4f] font-bold">JD</span>
                </div>
                <div>
                  <h3 className="font-semibold">John Davis</h3>
                  <p className="text-sm text-gray-500">RV Park Owner</p>
                </div>
              </div>
              <p className="italic text-gray-600">"I sold my RV park in just 3 months thanks to RoverPass. The platform connected me with serious buyers and the process was seamless."</p>
              <div className="flex text-[#ff9f45] mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all border-t-4 border-[#f74f4f]">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-[#f74f4f]/10 flex items-center justify-center mr-4">
                  <span className="text-[#f74f4f] font-bold">SM</span>
                </div>
                <div>
                  <h3 className="font-semibold">Sarah Miller</h3>
                  <p className="text-sm text-gray-500">Property Broker</p>
                </div>
              </div>
              <p className="italic text-gray-600">"The analytics dashboard helps me understand which listings are performing best. My clients are consistently impressed with the quality of leads."</p>
              <div className="flex text-[#ff9f45] mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all border-t-4 border-[#f74f4f]">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-[#f74f4f]/10 flex items-center justify-center mr-4">
                  <span className="text-[#f74f4f] font-bold">RJ</span>
                </div>
                <div>
                  <h3 className="font-semibold">Robert Johnson</h3>
                  <p className="text-sm text-gray-500">Investor</p>
                </div>
              </div>
              <p className="italic text-gray-600">"I've acquired three properties through RoverPass. The detailed listings and financial information made my investment decisions much easier."</p>
              <div className="flex text-[#ff9f45] mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Newsletter Section - New addition */}
      {/* Newsletter Section - Updated with orange theme */}
      <section className="py-16 bg-gradient-to-r from-[#f74f4f] to-[#ff7a45] relative overflow-hidden">
        {/* Moving background elements - matches CTA section style */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-xl"></div>
        
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-3xl mx-auto text-center text-white relative z-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-xl mb-8 text-white/80">
              Get the latest RV park listings and industry insights delivered to your inbox.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <Button 
                className="bg-white text-[#f74f4f] hover:bg-gray-100 hover:shadow-lg transition-all"
              >
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;